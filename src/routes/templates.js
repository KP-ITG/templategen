const express = require('express');
const Joi = require('joi');
const Template = require('../models/Template');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const cloudinaryService = require('../services/cloudinaryService');

const router = express.Router();

// Validation schemas
const elementSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('text', 'image', 'shape', 'logo').required(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required()
  }).required(),
  size: Joi.object({
    width: Joi.number().required(),
    height: Joi.number().required()
  }).required(),
  content: Joi.string().allow('').default(''),
  fontFamily: Joi.string().default('Arial'),
  fontSize: Joi.number().default(16),
  fontWeight: Joi.string().valid('normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900').default('normal'),
  color: Joi.string().default('#000000'),
  textAlign: Joi.string().valid('left', 'center', 'right').default('left'),
  imageUrl: Joi.string().allow(null),
  shapeType: Joi.string().valid('rectangle', 'circle', 'line').allow(null),
  backgroundColor: Joi.string().default('transparent'),
  borderColor: Joi.string().default('transparent'),
  borderWidth: Joi.number().default(0),
  rotation: Joi.number().default(0),
  opacity: Joi.number().min(0).max(1).default(1),
  zIndex: Joi.number().default(1),
  isLocked: Joi.boolean().default(false),
  isEditable: Joi.boolean().default(true)
});

const templateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  category: Joi.string().valid('event', 'announcement', 'social-media', 'business', 'education', 'other').required(),
  canvasSize: Joi.object({
    width: Joi.number().required(),
    height: Joi.number().required()
  }).required(),
  defaultBackground: Joi.string().default('#ffffff'),
  elements: Joi.array().items(elementSchema).default([]),
  tags: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
  isPublic: Joi.boolean().default(true),
  version: Joi.string().default('1.0.0')
});

// @route   GET /api/templates
// @desc    Get all templates (public + user's templates if authenticated)
// @access  Public/Private
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      tags,
      sort = '-createdAt'
    } = req.query;

    // Build query
    let query = { isActive: true };

    // If user is authenticated, show public templates + their own templates
    // If not authenticated, show only public templates
    if (req.user) {
      query = {
        $and: [
          { isActive: true },
          {
            $or: [
              { isPublic: true },
              { createdBy: req.user._id }
            ]
          }
        ]
      };
    } else {
      query.isPublic = true;
    }

    // Add filters
    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const templates = await Template.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Template.countDocuments(query);

    res.json({
      success: true,
      data: {
        templates,
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
      message: 'Failed to fetch templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/templates/:id
// @desc    Get template by ID
// @access  Public/Private
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check access permission
    if (!template.isPublic && (!req.user || template.createdBy._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment usage count
    await Template.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });

    res.json({
      success: true,
      data: {
        template
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/templates
// @desc    Create new template (Admin only)
// @access  Private (Admin)
router.post('/', adminAuth, upload.single('thumbnail'), handleUploadError, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = templateSchema.validate(JSON.parse(req.body.templateData || '{}'));
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    // Check if thumbnail is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is required'
      });
    }

    // Upload thumbnail to cloudinary
    const thumbnailUrl = await cloudinaryService.uploadImage(req.file.buffer, {
      folder: 'templates/thumbnails',
      public_id: `template_${Date.now()}`,
      format: 'webp',
      quality: 80
    });

    // Create template
    const template = new Template({
      ...value,
      thumbnail: thumbnailUrl,
      createdBy: req.user._id
    });

    await template.save();
    await template.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: {
        template
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/templates/:id
// @desc    Update template (Admin only)
// @access  Private (Admin)
router.put('/:id', adminAuth, upload.single('thumbnail'), handleUploadError, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Validate request body
    const { error, value } = templateSchema.validate(JSON.parse(req.body.templateData || '{}'));
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    // Update thumbnail if new one is provided
    let updateData = { ...value };
    if (req.file) {
      const thumbnailUrl = await cloudinaryService.uploadImage(req.file.buffer, {
        folder: 'templates/thumbnails',
        public_id: `template_${template._id}`,
        format: 'webp',
        quality: 80
      });
      updateData.thumbnail = thumbnailUrl;
    }

    const updatedTemplate = await Template.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: {
        template: updatedTemplate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/templates/:id
// @desc    Delete template (Admin only)
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Soft delete - set isActive to false
    await Template.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/templates/categories/list
// @desc    Get all available categories
// @access  Public
router.get('/categories/list', (req, res) => {
  const categories = [
    { value: 'event', label: 'Event' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  res.json({
    success: true,
    data: {
      categories
    }
  });
});

module.exports = router;
