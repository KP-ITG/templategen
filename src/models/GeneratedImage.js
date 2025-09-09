const mongoose = require('mongoose');

const generatedImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Template yang digunakan
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  // User yang membuat
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Background yang digunakan
  backgroundImage: {
    url: { type: String, required: true },
    originalName: String,
    size: Number
  },
  // Data customization dari user
  customElements: [{
    elementId: String,
    customData: mongoose.Schema.Types.Mixed // Flexible untuk berbagai jenis customization
  }],
  // Hasil gambar yang digenerate
  generatedImage: {
    url: { type: String, required: true },
    originalName: String,
    size: Number,
    format: {
      type: String,
      enum: ['jpeg', 'png', 'webp'],
      default: 'png'
    },
    quality: {
      type: Number,
      min: 1,
      max: 100,
      default: 90
    }
  },
  // Status processing
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingLog: {
    startTime: Date,
    endTime: Date,
    errorMessage: String
  },
  // Metadata tambahan
  metadata: {
    deviceInfo: String,
    appVersion: String,
    generationTime: Number // in milliseconds
  },
  // Sharing dan visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  shareUrl: {
    type: String,
    unique: true,
    sparse: true
  },
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date
}, {
  timestamps: true
});

// Index untuk query optimization
generatedImageSchema.index({ userId: 1, createdAt: -1 });
generatedImageSchema.index({ templateId: 1 });
generatedImageSchema.index({ status: 1 });
generatedImageSchema.index({ shareUrl: 1 });

// Method untuk generate share URL
generatedImageSchema.methods.generateShareUrl = function() {
  if (!this.shareUrl && this.isPublic) {
    this.shareUrl = `${this._id.toString()}-${Date.now()}`;
  }
  return this.shareUrl;
};

module.exports = mongoose.model('GeneratedImage', generatedImageSchema);
