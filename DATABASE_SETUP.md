# Setup Database - MongoDB

## Pilihan 1: MongoDB Atlas (Cloud - Recommended)
Ikuti instruksi di file `MONGODB_ATLAS_SETUP.md`

## Pilihan 2: MongoDB Local (Development)

### Windows:
1. Download MongoDB Community Edition dari [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install dengan default settings
3. MongoDB akan berjalan di `mongodb://localhost:27017`
4. File .env sudah dikonfigurasi untuk local MongoDB

### Alternatif: MongoDB dengan Docker
```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run --name mongodb -d -p 27017:27017 mongo:latest

# Stop container
docker stop mongodb

# Start container
docker start mongodb
```

## Setup Cloudinary (Required untuk image storage)

1. Kunjungi [cloudinary.com](https://cloudinary.com)
2. Buat account gratis
3. Di Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
4. Update .env file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Test Setup

1. Start MongoDB (local atau Atlas)
2. Update .env dengan credentials yang benar
3. Run server: `npm run dev`
4. Test health endpoint: `GET http://localhost:3000/health`
5. Create admin user: `npm run seed`

Server siap digunakan!
