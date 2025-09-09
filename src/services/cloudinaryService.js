const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  /**
   * Upload image buffer to Cloudinary
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Cloudinary URL
   */
  async uploadImage(buffer, options = {}) {
    try {
      const defaultOptions = {
        resource_type: 'image',
        folder: 'uploads',
        quality: 'auto',
        format: 'auto'
      };

      const uploadOptions = { ...defaultOptions, ...options };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Failed to upload image: ${error.message}`));
            } else {
              resolve(result.secure_url);
            }
          }
        ).end(buffer);
      });
    } catch (error) {
      console.error('Cloudinary service error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload generated image to Cloudinary
   * @param {Buffer} buffer - Image buffer
   * @param {string} publicId - Public ID for the image
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result with URL and metadata
   */
  async uploadGeneratedImage(buffer, publicId, options = {}) {
    try {
      const defaultOptions = {
        resource_type: 'image',
        folder: 'generated-images',
        public_id: publicId,
        quality: options.quality || 90,
        format: options.format || 'png'
      };

      const uploadOptions = { ...defaultOptions, ...options };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Failed to upload generated image: ${error.message}`));
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                width: result.width,
                height: result.height
              });
            }
          }
        ).end(buffer);
      });
    } catch (error) {
      console.error('Cloudinary service error:', error);
      throw new Error(`Generated image upload failed: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} imageUrl - Cloudinary image URL
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteImage(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return { result: 'not_found' };
      }

      // Extract public_id from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];

      // Find folder path
      const folderIndex = urlParts.findIndex(part => part === 'upload') + 2;
      const folders = urlParts.slice(folderIndex, -1);
      const fullPublicId = folders.length > 0 ? `${folders.join('/')}/${publicId}` : publicId;

      const result = await cloudinary.uploader.destroy(fullPublicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get image info from Cloudinary
   * @param {string} publicId - Public ID of the image
   * @returns {Promise<Object>} - Image info
   */
  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Cloudinary get info error:', error);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * Generate transformation URL for image resizing/optimization
   * @param {string} imageUrl - Original image URL
   * @param {Object} transformations - Transformation options
   * @returns {string} - Transformed image URL
   */
  generateTransformationUrl(imageUrl, transformations = {}) {
    try {
      if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return imageUrl;
      }

      // Extract public_id from URL
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');

      if (uploadIndex === -1) {
        return imageUrl;
      }

      const baseUrl = urlParts.slice(0, uploadIndex + 1).join('/');
      const resourcePath = urlParts.slice(uploadIndex + 1).join('/');

      // Build transformation string
      const transformationParts = [];

      if (transformations.width) transformationParts.push(`w_${transformations.width}`);
      if (transformations.height) transformationParts.push(`h_${transformations.height}`);
      if (transformations.quality) transformationParts.push(`q_${transformations.quality}`);
      if (transformations.format) transformationParts.push(`f_${transformations.format}`);
      if (transformations.crop) transformationParts.push(`c_${transformations.crop}`);

      const transformationString = transformationParts.length > 0 ? transformationParts.join(',') : '';

      return transformationString
        ? `${baseUrl}/${transformationString}/${resourcePath}`
        : imageUrl;
    } catch (error) {
      console.error('Transformation URL generation error:', error);
      return imageUrl;
    }
  }
}

module.exports = new CloudinaryService();
