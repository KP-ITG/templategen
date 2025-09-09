# Template Image Generator Backend

Backend API untuk aplikasi mobile yang dapat membuat gambar dari template dengan kemampuan admin mengelola template.

## Fitur Utama

### 1. **Autentikasi & Otorisasi**
- Registrasi dan login user
- Role-based access (User, Admin)
- JWT token authentication
- Password change functionality

### 2. **Template Management (Admin Only)**
- CRUD operations untuk template
- Upload thumbnail template
- Kategorisasi template
- Search dan filter template
- Template versioning

### 3. **Image Generation**
- Generate gambar dari template
- Upload background custom
- Customize posisi text dan elemen
- Multiple output format (PNG, JPEG, WebP)
- Async processing dengan status tracking

### 4. **User Management (Admin Only)**
- Manage user accounts
- Update user roles
- Activate/deactivate users

## Teknologi yang Digunakan

- **Runtime**: Node.js dengan Express.js
- **Database**: MongoDB dengan Mongoose ODM
- **Image Processing**: Canvas API untuk manipulasi gambar
- **File Storage**: Cloudinary untuk penyimpanan file
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi untuk validasi input
- **Security**: Helmet, CORS, Rate limiting

## Alur Sistem

### 1. **Template Creation (Admin)**
```
Admin Login → Create Template → Upload Thumbnail → Define Elements → Save Template
```

### 2. **Image Generation (User)**
```
User Login → Select Template → Upload Background → Customize Elements → Generate Image → Download
```

### 3. **Template Structure**
```json
{
  "name": "Event Announcement",
  "category": "event",
  "canvasSize": { "width": 1080, "height": 1080 },
  "elements": [
    {
      "id": "title",
      "type": "text",
      "position": { "x": 100, "y": 200 },
      "size": { "width": 800, "height": 100 },
      "content": "Event Title",
      "fontSize": 48,
      "color": "#000000",
      "isEditable": true
    },
    {
      "id": "logo",
      "type": "image",
      "position": { "x": 50, "y": 50 },
      "size": { "width": 150, "height": 150 },
      "imageUrl": "https://...",
      "isLocked": true
    }
  ]
}
```

## Setup dan Instalasi

### Prerequisites
- Node.js (v16 atau lebih baru)
- MongoDB (local atau cloud)
- Cloudinary account

### Environment Variables
Copy `.env.example` ke `.env` dan sesuaikan:
```bash
cp .env.example .env
```

### Instalasi Dependencies
```bash
npm install
```

### Database Setup
```bash
# Jalankan seeder untuk membuat admin user
npm run seed
```

### Menjalankan Aplikasi
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Ganti password

### Templates
- `GET /api/templates` - List semua template
- `GET /api/templates/:id` - Detail template
- `POST /api/templates` - Create template (Admin)
- `PUT /api/templates/:id` - Update template (Admin)
- `DELETE /api/templates/:id` - Delete template (Admin)
- `GET /api/templates/categories/list` - List kategori

### Image Generation
- `POST /api/images/generate` - Generate gambar dari template
- `GET /api/images/status/:id` - Check generation status
- `GET /api/images/my-images` - List gambar user
- `GET /api/images/:id` - Detail gambar
- `POST /api/images/:id/download` - Download gambar
- `PUT /api/images/:id/share` - Toggle sharing status
- `DELETE /api/images/:id` - Delete gambar

### User Management (Admin)
- `GET /api/users` - List semua user
- `GET /api/users/:id` - Detail user
- `PUT /api/users/:id/role` - Update role user
- `PUT /api/users/:id/status` - Update status user
- `DELETE /api/users/:id` - Delete user

## Database Models

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: ['user', 'admin'],
  isActive: Boolean,
  profileImage: String,
  lastLogin: Date
}
```

### Template Model
```javascript
{
  name: String,
  description: String,
  category: String,
  canvasSize: { width: Number, height: Number },
  defaultBackground: String,
  elements: [ElementSchema],
  thumbnail: String,
  tags: [String],
  isActive: Boolean,
  isPublic: Boolean,
  createdBy: ObjectId,
  usageCount: Number,
  version: String
}
```

### Generated Image Model
```javascript
{
  title: String,
  templateId: ObjectId,
  userId: ObjectId,
  backgroundImage: { url: String, originalName: String, size: Number },
  customElements: [Object],
  generatedImage: { url: String, format: String, quality: Number },
  status: ['pending', 'processing', 'completed', 'failed'],
  isPublic: Boolean,
  shareUrl: String
}
```

## Security Features

- **Rate Limiting**: 100 requests per 15 menit per IP
- **CORS**: Configured untuk frontend URLs
- **Helmet**: Security headers
- **Input Validation**: Joi validation untuk semua input
- **File Upload**: Validasi tipe file dan ukuran
- **JWT**: Secure token dengan expiration

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Testing

```bash
npm test
```

## Error Handling

- Centralized error handling middleware
- Structured error responses
- Logging untuk debugging
- Graceful failure handling

## Performance Optimization

- Image processing dengan Canvas API
- Cloudinary untuk CDN dan optimization
- Database indexing untuk query performance
- Async processing untuk image generation

## Monitoring & Logging

- Console logging untuk development
- Error tracking
- Performance monitoring
- Health check endpoint: `GET /health`

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
