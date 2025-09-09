const mongoose = require('mongoose');
const Template = require('../models/Template');
const User = require('../models/User');
require('dotenv').config();

const sampleTemplates = [
  {
    name: 'Event Announcement - Corporate',
    description: 'Template untuk pengumuman event corporate dengan layout profesional',
    category: 'event',
    canvasSize: {
      width: 1080,
      height: 1080
    },
    defaultBackground: '#ffffff',
    elements: [
      {
        id: 'header-bg',
        type: 'shape',
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 200 },
        shapeType: 'rectangle',
        backgroundColor: '#2563eb',
        zIndex: 1,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'company-logo',
        type: 'logo',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        imageUrl: 'https://via.placeholder.com/100x100/ffffff/2563eb?text=LOGO',
        zIndex: 2,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'event-title',
        type: 'text',
        position: { x: 180, y: 80 },
        size: { width: 800, height: 80 },
        content: 'JUDUL EVENT',
        fontFamily: 'Arial',
        fontSize: 42,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'left',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'event-subtitle',
        type: 'text',
        position: { x: 180, y: 130 },
        size: { width: 800, height: 40 },
        content: 'Subtitle atau tagline event',
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'normal',
        color: '#e5e7eb',
        textAlign: 'left',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'date-time',
        type: 'text',
        position: { x: 80, y: 250 },
        size: { width: 920, height: 60 },
        content: 'Tanggal: [TANGGAL]\nWaktu: [WAKTU]',
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'location',
        type: 'text',
        position: { x: 80, y: 340 },
        size: { width: 920, height: 40 },
        content: 'Lokasi: [TEMPAT ACARA]',
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        color: '#374151',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'description',
        type: 'text',
        position: { x: 80, y: 420 },
        size: { width: 920, height: 200 },
        content: 'Deskripsi singkat tentang event ini. Jelaskan apa yang akan dibahas, siapa target peserta, dan manfaat yang akan didapat.',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#4b5563',
        textAlign: 'left',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'contact-info',
        type: 'text',
        position: { x: 80, y: 860 },
        size: { width: 920, height: 80 },
        content: 'Informasi Kontak:\nEmail: info@company.com | Phone: +62 123 456 789',
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#6b7280',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      }
    ],
    thumbnail: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Corporate+Event',
    tags: ['event', 'corporate', 'professional', 'announcement'],
    isActive: true,
    isPublic: true,
    version: '1.0.0'
  },
  {
    name: 'Social Media Post - Instagram',
    description: 'Template untuk postingan Instagram dengan format square',
    category: 'social-media',
    canvasSize: {
      width: 1080,
      height: 1080
    },
    defaultBackground: '#f8fafc',
    elements: [
      {
        id: 'main-image',
        type: 'image',
        position: { x: 90, y: 90 },
        size: { width: 900, height: 600 },
        imageUrl: 'https://via.placeholder.com/900x600/64748b/ffffff?text=Main+Image',
        backgroundColor: '#e2e8f0',
        borderWidth: 2,
        borderColor: '#cbd5e1',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'title-overlay',
        type: 'shape',
        position: { x: 90, y: 550 },
        size: { width: 900, height: 140 },
        shapeType: 'rectangle',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 2,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'post-title',
        type: 'text',
        position: { x: 130, y: 580 },
        size: { width: 820, height: 80 },
        content: 'JUDUL POSTINGAN',
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        zIndex: 3,
        isEditable: true
      },
      {
        id: 'caption',
        type: 'text',
        position: { x: 90, y: 720 },
        size: { width: 900, height: 150 },
        content: 'Caption atau deskripsi untuk postingan Instagram. Bisa berisi hashtag dan call-to-action.',
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'normal',
        color: '#1e293b',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'brand-logo',
        type: 'logo',
        position: { x: 900, y: 900 },
        size: { width: 120, height: 120 },
        imageUrl: 'https://via.placeholder.com/120x120/3b82f6/ffffff?text=BRAND',
        zIndex: 4,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'website-url',
        type: 'text',
        position: { x: 90, y: 950 },
        size: { width: 780, height: 30 },
        content: 'www.website.com',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#64748b',
        textAlign: 'left',
        zIndex: 1,
        isEditable: true
      }
    ],
    thumbnail: 'https://via.placeholder.com/300x200/f8fafc/1e293b?text=Instagram+Post',
    tags: ['social-media', 'instagram', 'square', 'post'],
    isActive: true,
    isPublic: true,
    version: '1.0.0'
  },
  {
    name: 'Business Card Modern',
    description: 'Template kartu nama modern dengan desain minimalis',
    category: 'business',
    canvasSize: {
      width: 1050,
      height: 600
    },
    defaultBackground: '#ffffff',
    elements: [
      {
        id: 'left-section',
        type: 'shape',
        position: { x: 0, y: 0 },
        size: { width: 350, height: 600 },
        shapeType: 'rectangle',
        backgroundColor: '#1e40af',
        zIndex: 1,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'person-name',
        type: 'text',
        position: { x: 400, y: 80 },
        size: { width: 600, height: 60 },
        content: 'NAMA LENGKAP',
        fontFamily: 'Arial',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e40af',
        textAlign: 'left',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'job-title',
        type: 'text',
        position: { x: 400, y: 150 },
        size: { width: 600, height: 40 },
        content: 'Jabatan / Posisi',
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'normal',
        color: '#64748b',
        textAlign: 'left',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'company-name',
        type: 'text',
        position: { x: 400, y: 200 },
        size: { width: 600, height: 30 },
        content: 'Nama Perusahaan',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#94a3b8',
        textAlign: 'left',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'contact-details',
        type: 'text',
        position: { x: 400, y: 280 },
        size: { width: 600, height: 200 },
        content: 'Email: nama@email.com\nPhone: +62 812 3456 7890\nWebsite: www.website.com\nAlamat: Jl. Contoh No. 123, Jakarta',
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#475569',
        textAlign: 'left',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'company-logo-card',
        type: 'logo',
        position: { x: 50, y: 50 },
        size: { width: 250, height: 100 },
        imageUrl: 'https://via.placeholder.com/250x100/ffffff/1e40af?text=COMPANY',
        zIndex: 3,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'decorative-line',
        type: 'shape',
        position: { x: 400, y: 240 },
        size: { width: 200, height: 3 },
        shapeType: 'rectangle',
        backgroundColor: '#1e40af',
        zIndex: 1,
        isLocked: true,
        isEditable: false
      }
    ],
    thumbnail: 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Business+Card',
    tags: ['business', 'card', 'modern', 'professional'],
    isActive: true,
    isPublic: true,
    version: '1.0.0'
  },
  {
    name: 'Educational Workshop Flyer',
    description: 'Template flyer untuk workshop atau seminar edukasi',
    category: 'education',
    canvasSize: {
      width: 800,
      height: 1200
    },
    defaultBackground: '#fef3c7',
    elements: [
      {
        id: 'header-section',
        type: 'shape',
        position: { x: 0, y: 0 },
        size: { width: 800, height: 250 },
        shapeType: 'rectangle',
        backgroundColor: '#f59e0b',
        zIndex: 1,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'workshop-title',
        type: 'text',
        position: { x: 50, y: 60 },
        size: { width: 700, height: 80 },
        content: 'WORKSHOP TITLE',
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'workshop-subtitle',
        type: 'text',
        position: { x: 50, y: 150 },
        size: { width: 700, height: 60 },
        content: 'Subtitle atau tema workshop',
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        color: '#fef3c7',
        textAlign: 'center',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'instructor-section',
        type: 'text',
        position: { x: 50, y: 300 },
        size: { width: 700, height: 100 },
        content: 'Pembicara / Instruktur:\nNama Pembicara\nGelar & Keahlian',
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'normal',
        color: '#92400e',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'schedule-info',
        type: 'text',
        position: { x: 50, y: 450 },
        size: { width: 700, height: 150 },
        content: 'JADWAL WORKSHOP\n\nTanggal: [Tanggal]\nWaktu: [Jam] WIB\nDurasi: [Durasi]\nLokasi: [Tempat/Platform]',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#78350f',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'topics-covered',
        type: 'text',
        position: { x: 50, y: 650 },
        size: { width: 700, height: 200 },
        content: 'MATERI YANG AKAN DIBAHAS:\n\n• Topik 1: [Deskripsi]\n• Topik 2: [Deskripsi]\n• Topik 3: [Deskripsi]\n• Topik 4: [Deskripsi]',
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#78350f',
        textAlign: 'left',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'registration-info',
        type: 'text',
        position: { x: 50, y: 900 },
        size: { width: 700, height: 100 },
        content: 'PENDAFTARAN:\nBiaya: [Harga] | Diskon Early Bird: [Diskon]\nDaftar: [Link/Kontak]',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400e',
        textAlign: 'center',
        zIndex: 1,
        isEditable: true
      },
      {
        id: 'organizer-logo',
        type: 'logo',
        position: { x: 300, y: 1050 },
        size: { width: 200, height: 100 },
        imageUrl: 'https://via.placeholder.com/200x100/f59e0b/ffffff?text=ORGANIZER',
        zIndex: 2,
        isLocked: true,
        isEditable: false
      }
    ],
    thumbnail: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Education+Workshop',
    tags: ['education', 'workshop', 'seminar', 'flyer'],
    isActive: true,
    isPublic: true,
    version: '1.0.0'
  },
  {
    name: 'Product Announcement',
    description: 'Template untuk pengumuman produk baru atau launch',
    category: 'announcement',
    canvasSize: {
      width: 1200,
      height: 800
    },
    defaultBackground: '#000000',
    elements: [
      {
        id: 'gradient-bg',
        type: 'shape',
        position: { x: 0, y: 0 },
        size: { width: 1200, height: 800 },
        shapeType: 'rectangle',
        backgroundColor: '#1a1a1a',
        zIndex: 1,
        isLocked: true,
        isEditable: false
      },
      {
        id: 'product-image',
        type: 'image',
        position: { x: 50, y: 100 },
        size: { width: 500, height: 600 },
        imageUrl: 'https://via.placeholder.com/500x600/ffffff/000000?text=PRODUCT',
        backgroundColor: 'transparent',
        zIndex: 2,
        isEditable: true
      },
      {
        id: 'announcement-label',
        type: 'text',
        position: { x: 600, y: 80 },
        size: { width: 550, height: 50 },
        content: 'NEW PRODUCT LAUNCH',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
        textAlign: 'left',
        zIndex: 3,
        isEditable: true
      },
      {
        id: 'product-name',
        type: 'text',
        position: { x: 600, y: 140 },
        size: { width: 550, height: 120 },
        content: 'NAMA PRODUK',
        fontFamily: 'Arial',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'left',
        zIndex: 3,
        isEditable: true
      },
      {
        id: 'product-tagline',
        type: 'text',
        position: { x: 600, y: 280 },
        size: { width: 550, height: 60 },
        content: 'Tagline atau deskripsi singkat produk',
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        color: '#a3a3a3',
        textAlign: 'left',
        zIndex: 3,
        isEditable: true
      },
      {
        id: 'key-features',
        type: 'text',
        position: { x: 600, y: 370 },
        size: { width: 550, height: 200 },
        content: 'FITUR UTAMA:\n\n✓ Fitur 1: [Deskripsi]\n✓ Fitur 2: [Deskripsi]\n✓ Fitur 3: [Deskripsi]\n✓ Fitur 4: [Deskripsi]',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#e5e5e5',
        textAlign: 'left',
        zIndex: 3,
        isEditable: true
      },
      {
        id: 'availability-info',
        type: 'text',
        position: { x: 600, y: 600 },
        size: { width: 550, height: 80 },
        content: 'Tersedia mulai: [Tanggal]\nHarga: [Harga] | Pre-order: [Link]',
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10b981',
        textAlign: 'left',
        zIndex: 3,
        isEditable: true
      },
      {
        id: 'brand-logo-product',
        type: 'logo',
        position: { x: 1000, y: 650 },
        size: { width: 150, height: 100 },
        imageUrl: 'https://via.placeholder.com/150x100/ffffff/000000?text=BRAND',
        zIndex: 4,
        isLocked: true,
        isEditable: false
      }
    ],
    thumbnail: 'https://via.placeholder.com/300x200/1a1a1a/ffffff?text=Product+Launch',
    tags: ['announcement', 'product', 'launch', 'modern'],
    isActive: true,
    isPublic: true,
    version: '1.0.0'
  }
];

const createTemplateSeeder = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin user exists (templates need to have a creator)
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run admin seeder first: npm run seed');
      process.exit(1);
    }

    // Check if templates already exist
    const existingTemplates = await Template.countDocuments();
    if (existingTemplates > 0) {
      console.log(`📝 Found ${existingTemplates} existing templates in database`);

      // Ask user if they want to continue
      console.log('🤔 Do you want to add more sample templates? (This will not delete existing ones)');
      console.log('💡 If you want to reset templates, delete them manually first.');
    }

    // Add createdBy field to all templates
    const templatesWithCreator = sampleTemplates.map(template => ({
      ...template,
      createdBy: adminUser._id
    }));

    // Insert templates
    console.log('📝 Creating sample templates...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const templateData of templatesWithCreator) {
      try {
        // Check if template with same name already exists
        const existingTemplate = await Template.findOne({ name: templateData.name });
        if (existingTemplate) {
          console.log(`⏭️  Skipped: "${templateData.name}" (already exists)`);
          skippedCount++;
          continue;
        }

        const template = new Template(templateData);
        await template.save();
        console.log(`✅ Created: "${templateData.name}"`);
        createdCount++;
      } catch (error) {
        console.log(`❌ Failed to create "${templateData.name}": ${error.message}`);
      }
    }

    console.log('\n📊 SEEDER SUMMARY:');
    console.log(`✅ Templates created: ${createdCount}`);
    console.log(`⏭️  Templates skipped: ${skippedCount}`);
    console.log(`📝 Total templates in database: ${await Template.countDocuments()}`);

    if (createdCount > 0) {
      console.log('\n🎉 Template seeder completed successfully!');
      console.log('💡 You can now use these templates in your application');
      console.log('🔗 View templates: GET /api/templates');
    }

  } catch (error) {
    console.error('❌ Error running template seeder:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeder if called directly
if (require.main === module) {
  createTemplateSeeder();
}

module.exports = createTemplateSeeder;
