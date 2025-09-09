const express = require('express');
const Joi = require('joi');
const GeneratedImage = require('../models/GeneratedImage');
const Template = require('../models/Template');
const { auth, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const imageGeneratorService = require('../services/imageGeneratorService');
const cloudinaryService = require('../services/cloudinaryService');

const router = express.Router();

// Validation schemas
const generateImageSchema = Joi.object({
  templateId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  customElements: Joi.array().items(
    Joi.object({
      elementId: Joi.string().required(),
      customData: Joi.object().required()
    })
  ).default([]),
  outputFormat: Joi.string().valid('jpeg', 'png', 'webp').default('png'),
  outputQuality: Joi.number().min(1).max(100).default(90),
  isPublic: Joi.boolean().default(false)
});

// @route   POST /api/images/generate
// @desc    Generate image from template
// @access  Private
router.post('/generate', auth, upload.single('background'), handleUploadError, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = generateImageSchema.validate(JSON.parse(req.body.imageData || '{}'));
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    // Check if background image is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Background image is required'
      });
    }

    // Find template
    const template = await Template.findById(value.templateId);
    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or inactive'
      });
    }

    // Check template access permission
    if (!template.isPublic && template.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this template'
      });
    }

    // Upload background image to cloudinary
    const backgroundUrl = await cloudinaryService.uploadImage(req.file.buffer, {
      folder: 'generated-images/backgrounds',
      public_id: `bg_${req.user._id}_${Date.now()}`,
      format: 'webp',
      quality: 90
    });

    // Create GeneratedImage document with pending status
    const generatedImage = new GeneratedImage({
      title: value.title,
      description: value.description,
      templateId: value.templateId,
      userId: req.user._id,
      backgroundImage: {
        url: backgroundUrl,
        originalName: req.file.originalname,
        size: req.file.size
      },
      customElements: value.customElements,
      generatedImage: {
        url: '', // Will be filled after processing
        format: value.outputFormat,
        quality: value.outputQuality
      },
      status: 'processing',
      isPublic: value.isPublic,
      processingLog: {
        startTime: new Date()
      }
    });

    await generatedImage.save();

    // Start image generation process (async)
    imageGeneratorService.generateImage(generatedImage._id, template, backgroundUrl, value.customElements, {
      format: value.outputFormat,
      quality: value.outputQuality
    }).catch(async (error) => {
      // Update status to failed if error occurs
      await GeneratedImage.findByIdAndUpdate(generatedImage._id, {
        status: 'failed',
        'processingLog.endTime': new Date(),
        'processingLog.errorMessage': error.message
      });
    });

    // Return immediate response
    res.status(201).json({
      success: true,
      message: 'Image generation started',
      data: {
        generatedImage: {
          id: generatedImage._id,
          status: generatedImage.status,
          title: generatedImage.title
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start image generation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/images/status/:id
// @desc    Get image generation status
// @access  Private
router.get('/status/:id', auth, async (req, res) => {
  try {
    const generatedImage = await GeneratedImage.findById(req.params.id)
      .populate('templateId', 'name thumbnail')
      .select('status processingLog generatedImage title description createdAt');

    if (!generatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Generated image not found'
      });
    }

    // Check if user owns this generated image
    if (generatedImage.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        generatedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get generation status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/images/my-images
// @desc    Get user's generated images
// @access  Private
router.get('/my-images', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sort = '-createdAt'
    } = req.query;

    // Build query
    let query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const images = await GeneratedImage.find(query)
      .populate('templateId', 'name category thumbnail')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await GeneratedImage.countDocuments(query);

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/images/:id
// @desc    Get generated image by ID
// @access  Private/Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const generatedImage = await GeneratedImage.findById(req.params.id)
      .populate('templateId', 'name category thumbnail')
      .populate('userId', 'name email');

    if (!generatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Generated image not found'
      });
    }

    // Check access permission
    const isOwner = req.user && generatedImage.userId._id.toString() === req.user._id.toString();
    if (!generatedImage.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        generatedImage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch generated image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/images/:id/download
// @desc    Download generated image
// @access  Private/Public
router.post('/:id/download', optionalAuth, async (req, res) => {
  try {
    const generatedImage = await GeneratedImage.findById(req.params.id);

    if (!generatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Generated image not found'
      });
    }

    // Check access permission
    const isOwner = req.user && generatedImage.userId.toString() === req.user._id.toString();
    if (!generatedImage.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (generatedImage.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Image is not ready for download'
      });
    }

    // Update download count and timestamp
    await GeneratedImage.findByIdAndUpdate(req.params.id, {
      $inc: { downloadCount: 1 },
      lastDownloaded: new Date()
    });

    res.json({
      success: true,
      data: {
        downloadUrl: generatedImage.generatedImage.url,
        fileName: `${generatedImage.title}.${generatedImage.generatedImage.format}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process download',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/images/:id/share
// @desc    Toggle image sharing status
// @access  Private
router.put('/:id/share', auth, async (req, res) => {
  try {
    const { isPublic } = req.body;

    const generatedImage = await GeneratedImage.findById(req.params.id);

    if (!generatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Generated image not found'
      });
    }

    // Check if user owns this generated image
    if (generatedImage.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update sharing status
    generatedImage.isPublic = isPublic;
    if (isPublic) {
      generatedImage.generateShareUrl();
    } else {
      generatedImage.shareUrl = undefined;
    }

    await generatedImage.save();

    res.json({
      success: true,
      message: `Image ${isPublic ? 'shared publicly' : 'made private'}`,
      data: {
        isPublic: generatedImage.isPublic,
        shareUrl: generatedImage.shareUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update sharing status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/images/:id
// @desc    Delete generated image
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const generatedImage = await GeneratedImage.findById(req.params.id);

    if (!generatedImage) {
      return res.status(404).json({
        success: false,
        message: 'Generated image not found'
      });
    }

    // Check if user owns this generated image
    if (generatedImage.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete image files from cloudinary
    try {
      await cloudinaryService.deleteImage(generatedImage.backgroundImage.url);
      await cloudinaryService.deleteImage(generatedImage.generatedImage.url);
    } catch (cloudinaryError) {
      console.warn('Failed to delete images from cloudinary:', cloudinaryError.message);
    }

    // Delete from database
    await GeneratedImage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Generated image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete generated image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
