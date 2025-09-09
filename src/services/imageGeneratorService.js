const Jimp = require('jimp');
const GeneratedImage = require('../models/GeneratedImage');
const cloudinaryService = require('./cloudinaryService');

class ImageGeneratorService {
  constructor() {
    // Load fonts yang tersedia di Jimp
    this.fonts = {
      16: Jimp.FONT_SANS_16_BLACK,
      32: Jimp.FONT_SANS_32_BLACK,
      64: Jimp.FONT_SANS_64_BLACK,
      128: Jimp.FONT_SANS_128_BLACK
    };
  }

  /**
   * Generate image from template and customizations
   * @param {string} generatedImageId - ID of the GeneratedImage document
   * @param {Object} template - Template object
   * @param {string} backgroundUrl - Background image URL
   * @param {Array} customElements - Custom element data
   * @param {Object} outputOptions - Output format and quality options
   */
  async generateImage(generatedImageId, template, backgroundUrl, customElements, outputOptions = {}) {
    try {
      console.log(`Starting image generation for ${generatedImageId}`);

      // Update status to processing
      await GeneratedImage.findByIdAndUpdate(generatedImageId, {
        status: 'processing',
        'processingLog.startTime': new Date()
      });

      // Load background image dengan Jimp
      const backgroundImage = await Jimp.read(backgroundUrl);

      // Resize background to template dimensions
      backgroundImage.resize(template.canvasSize.width, template.canvasSize.height);

      // Merge template elements with custom elements
      const mergedElements = this.mergeElements(template.elements, customElements);

      // Sort elements by zIndex for proper layering
      mergedElements.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      // Draw each element
      for (const element of mergedElements) {
        await this.drawElement(backgroundImage, element);
      }

      // Convert to buffer
      const buffer = await backgroundImage.getBufferAsync(
        outputOptions.format === 'jpeg' ? Jimp.MIME_JPEG :
        outputOptions.format === 'webp' ? 'image/webp' : Jimp.MIME_PNG
      );

      // Use the buffer directly without Sharp optimization
      const finalBuffer = buffer;

      // Upload generated image to Cloudinary
      const uploadResult = await cloudinaryService.uploadGeneratedImage(
        finalBuffer,
        `generated_${generatedImageId}`,
        {
          format: outputOptions.format || 'png',
          quality: outputOptions.quality || 90,
          folder: 'generated-images/final'
        }
      );

      // Update GeneratedImage document with result
      await GeneratedImage.findByIdAndUpdate(generatedImageId, {
        status: 'completed',
        'generatedImage.url': uploadResult.url,
        'generatedImage.originalName': `generated_${generatedImageId}.${outputOptions.format || 'png'}`,
        'generatedImage.size': uploadResult.size,
        'processingLog.endTime': new Date(),
        'metadata.generationTime': Date.now() - new Date().getTime()
      });

      console.log(`Image generation completed for ${generatedImageId}`);
      return uploadResult;

    } catch (error) {
      console.error(`Image generation failed for ${generatedImageId}:`, error);

      // Update status to failed
      await GeneratedImage.findByIdAndUpdate(generatedImageId, {
        status: 'failed',
        'processingLog.endTime': new Date(),
        'processingLog.errorMessage': error.message
      });

      throw error;
    }
  }

  /**
   * Merge template elements with custom elements
   * @param {Array} templateElements - Original template elements
   * @param {Array} customElements - Custom element modifications
   * @returns {Array} - Merged elements
   */
  mergeElements(templateElements, customElements) {
    const customElementsMap = new Map();
    customElements.forEach(custom => {
      customElementsMap.set(custom.elementId, custom.customData);
    });

    return templateElements.map(element => {
      const customData = customElementsMap.get(element.id);
      if (customData) {
        return { ...element, ...customData };
      }
      return element;
    });
  }

  /**
   * Draw a single element on Jimp image
   * @param {Jimp} image - Jimp image instance
   * @param {Object} element - Element to draw
   */
  async drawElement(image, element) {
    try {
      switch (element.type) {
        case 'text':
          await this.drawTextElement(image, element);
          break;
        case 'image':
        case 'logo':
          await this.drawImageElement(image, element);
          break;
        case 'shape':
          await this.drawShapeElement(image, element);
          break;
        default:
          console.warn(`Unknown element type: ${element.type}`);
      }
    } catch (error) {
      console.error(`Failed to draw element ${element.id}:`, error);
      // Continue with other elements even if one fails
    }
  }

  /**
   * Draw text element using Jimp
   * @param {Jimp} image - Jimp image instance
   * @param {Object} element - Text element
   */
  async drawTextElement(image, element) {
    if (!element.content) return;

    try {
      // Find closest font size
      const fontSize = element.fontSize || 16;
      let closestFontSize = 16;
      const availableSizes = Object.keys(this.fonts).map(Number).sort((a, b) => a - b);

      for (const size of availableSizes) {
        if (fontSize >= size) {
          closestFontSize = size;
        } else {
          break;
        }
      }

      // Load font
      const font = await Jimp.loadFont(this.fonts[closestFontSize]);

      // Parse color (Jimp uses hex numbers)
      const color = this.parseColor(element.color || '#000000');

      // Calculate text position based on alignment
      let x = element.position.x;
      const y = element.position.y;

      if (element.textAlign === 'center') {
        const textWidth = Jimp.measureText(font, element.content);
        x = element.position.x + (element.size.width - textWidth) / 2;
      } else if (element.textAlign === 'right') {
        const textWidth = Jimp.measureText(font, element.content);
        x = element.position.x + element.size.width - textWidth;
      }

      // Handle multi-line text
      const lines = element.content.split('\n');
      const lineHeight = closestFontSize * 1.2;

      lines.forEach((line, index) => {
        const lineY = y + (index * lineHeight);
        if (lineY < image.getHeight()) {
          image.print(font, Math.max(0, x), Math.max(0, lineY), {
            text: line,
            alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
          }, element.size.width, element.size.height);
        }
      });

    } catch (error) {
      console.error(`Error drawing text element:`, error);
    }
  }

  /**
   * Draw image element using Jimp
   * @param {Jimp} image - Jimp image instance
   * @param {Object} element - Image element
   */
  async drawImageElement(image, element) {
    if (!element.imageUrl) return;

    try {
      // Load image element
      const elementImage = await Jimp.read(element.imageUrl);

      // Resize to element size
      elementImage.resize(element.size.width, element.size.height);

      // Apply opacity if specified
      if (element.opacity && element.opacity < 1) {
        elementImage.opacity(element.opacity);
      }

      // Composite onto main image
      image.composite(elementImage, element.position.x, element.position.y);

    } catch (error) {
      console.error(`Failed to load image for element ${element.id}:`, error);
      // Draw placeholder rectangle
      this.drawRectangle(image, element.position.x, element.position.y,
                        element.size.width, element.size.height, 0xf0f0f0ff);
    }
  }

  /**
   * Draw shape element using Jimp
   * @param {Jimp} image - Jimp image instance
   * @param {Object} element - Shape element
   */
  async drawShapeElement(image, element) {
    const { position, size } = element;
    const backgroundColor = this.parseColor(element.backgroundColor || 'transparent');

    switch (element.shapeType) {
      case 'rectangle':
        if (backgroundColor !== 'transparent') {
          this.drawRectangle(image, position.x, position.y, size.width, size.height, backgroundColor);
        }
        break;

      case 'circle':
        if (backgroundColor !== 'transparent') {
          this.drawCircle(image,
            position.x + size.width / 2,
            position.y + size.height / 2,
            Math.min(size.width, size.height) / 2,
            backgroundColor
          );
        }
        break;

      case 'line':
        const borderColor = this.parseColor(element.borderColor || '#000000');
        this.drawLine(image, position.x, position.y,
                     position.x + size.width, position.y + size.height, borderColor);
        break;

      default:
        console.warn(`Unknown shape type: ${element.shapeType}`);
    }
  }

  /**
   * Parse color string to Jimp color number
   * @param {string} colorString - Color in hex format
   * @returns {number} - Jimp color number
   */
  parseColor(colorString) {
    if (!colorString || colorString === 'transparent') {
      return 'transparent';
    }

    // Remove # if present
    const hex = colorString.replace('#', '');

    // Convert to Jimp color format (RGBA)
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const a = hex.length === 8 ? parseInt(hex.substr(6, 2), 16) : 255;

    return (r << 24) | (g << 16) | (b << 8) | a;
  }

  /**
   * Draw rectangle on Jimp image
   * @param {Jimp} image - Jimp image instance
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} color - Color
   */
  drawRectangle(image, x, y, width, height, color) {
    for (let px = x; px < x + width && px < image.getWidth(); px++) {
      for (let py = y; py < y + height && py < image.getHeight(); py++) {
        if (px >= 0 && py >= 0) {
          image.setPixelColor(color, px, py);
        }
      }
    }
  }

  /**
   * Draw circle on Jimp image
   * @param {Jimp} image - Jimp image instance
   * @param {number} centerX - Center X
   * @param {number} centerY - Center Y
   * @param {number} radius - Radius
   * @param {number} color - Color
   */
  drawCircle(image, centerX, centerY, radius, color) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius && x >= 0 && y >= 0 && x < image.getWidth() && y < image.getHeight()) {
          image.setPixelColor(color, Math.floor(x), Math.floor(y));
        }
      }
    }
  }

  /**
   * Draw line on Jimp image
   * @param {Jimp} image - Jimp image instance
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {number} color - Color
   */
  drawLine(image, x1, y1, x2, y2, color) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      if (x >= 0 && y >= 0 && x < image.getWidth() && y < image.getHeight()) {
        image.setPixelColor(color, x, y);
      }

      if (x === x2 && y === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Generate thumbnail for template
   * @param {Object} template - Template object
   * @param {string} backgroundUrl - Background image URL (optional)
   * @returns {Promise<Buffer>} - Thumbnail buffer
   */
  async generateThumbnail(template, backgroundUrl = null) {
    try {
      const thumbnailWidth = 300;
      const thumbnailHeight = 200;

      // Create base image
      let thumbnailImage;

      if (backgroundUrl) {
        try {
          thumbnailImage = await Jimp.read(backgroundUrl);
          thumbnailImage.resize(thumbnailWidth, thumbnailHeight);
        } catch (error) {
          console.warn('Failed to load background for thumbnail:', error);
          thumbnailImage = new Jimp(thumbnailWidth, thumbnailHeight, template.defaultBackground || '#ffffff');
        }
      } else {
        const backgroundColor = this.parseColor(template.defaultBackground || '#ffffff');
        thumbnailImage = new Jimp(thumbnailWidth, thumbnailHeight, backgroundColor);
      }

      // Calculate scale to maintain aspect ratio
      const scaleX = thumbnailWidth / template.canvasSize.width;
      const scaleY = thumbnailHeight / template.canvasSize.height;
      const scale = Math.min(scaleX, scaleY);

      // Draw elements (scaled down)
      const scaledElements = template.elements.map(element => ({
        ...element,
        position: {
          x: Math.floor(element.position.x * scale),
          y: Math.floor(element.position.y * scale)
        },
        size: {
          width: Math.floor(element.size.width * scale),
          height: Math.floor(element.size.height * scale)
        },
        fontSize: Math.floor((element.fontSize || 16) * scale)
      }));

      // Sort by zIndex
      scaledElements.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      // Draw elements
      for (const element of scaledElements) {
        await this.drawElement(thumbnailImage, element);
      }

      return await thumbnailImage.getBufferAsync(Jimp.MIME_PNG);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw error;
    }
  }
}

module.exports = new ImageGeneratorService();
