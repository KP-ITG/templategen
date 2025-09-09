const mongoose = require('mongoose');

// Schema untuk elemen dalam template (text, image, shape)
const elementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'shape', 'logo'],
    required: true
  },
  // Posisi dan ukuran
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  size: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  // Untuk text elements
  content: {
    type: String,
    default: ''
  },
  fontFamily: {
    type: String,
    default: 'Arial'
  },
  fontSize: {
    type: Number,
    default: 16
  },
  fontWeight: {
    type: String,
    enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    default: 'normal'
  },
  color: {
    type: String,
    default: '#000000'
  },
  textAlign: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'left'
  },
  // Untuk image elements
  imageUrl: {
    type: String,
    default: null
  },
  // Untuk shape elements
  shapeType: {
    type: String,
    enum: ['rectangle', 'circle', 'line'],
    default: null
  },
  backgroundColor: {
    type: String,
    default: 'transparent'
  },
  borderColor: {
    type: String,
    default: 'transparent'
  },
  borderWidth: {
    type: Number,
    default: 0
  },
  // Properties umum
  rotation: {
    type: Number,
    default: 0
  },
  opacity: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  zIndex: {
    type: Number,
    default: 1
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  }
});

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['event', 'announcement', 'social-media', 'business', 'education', 'other']
  },
  // Dimensi canvas template
  canvasSize: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  // Background default template
  defaultBackground: {
    type: String, // URL atau color
    default: '#ffffff'
  },
  // Elemen-elemen dalam template
  elements: [elementSchema],
  // Template preview thumbnail
  thumbnail: {
    type: String,
    required: true
  },
  // Tag untuk pencarian
  tags: [{
    type: String,
    trim: true
  }],
  // Status template
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Creator info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0
  },
  // Template version
  version: {
    type: String,
    default: '1.0.0'
  }
}, {
  timestamps: true
});

// Index untuk pencarian
templateSchema.index({ name: 'text', description: 'text', tags: 'text' });
templateSchema.index({ category: 1, isActive: 1, isPublic: 1 });
templateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Template', templateSchema);
