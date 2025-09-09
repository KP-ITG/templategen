# Setup MongoDB Atlas

## Langkah-langkah Setup MongoDB Atlas:

### 1. Buat Account MongoDB Atlas
- Kunjungi [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
- Klik "Try Free"
- Daftar dengan email atau Google account

### 2. Buat Cluster Baru
- Pilih "Build a Database"
- Pilih "M0 Sandbox" (gratis)
- Pilih region terdekat (contoh: Singapore untuk Indonesia)
- Klik "Create Cluster"

### 3. Setup Database Access
- Di sidebar kiri, klik "Database Access"
- Klik "Add New Database User"
- Pilih "Password" authentication method
- Masukkan username dan password (catat ini!)
- Pilih "Built-in Role" → "Atlas admin" atau "Read and write to any database"
- Klik "Add User"

### 4. Setup Network Access
- Di sidebar kiri, klik "Network Access"
- Klik "Add IP Address"
- Pilih "Allow Access from Anywhere" (0.0.0.0/0) untuk development
- Untuk production, masukkan IP server yang spesifik
- Klik "Confirm"

### 5. Get Connection String
- Kembali ke "Clusters"
- Klik tombol "Connect" pada cluster Anda
- Pilih "Connect your application"
- Pilih "Node.js" dan versi "4.1 or later"
- Copy connection string yang diberikan

### 6. Update .env File
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/template_generator?retryWrites=true&w=majority
```

Ganti:
- `<username>` dengan username database user yang dibuat
- `<password>` dengan password database user
- `cluster0.xxxxx.mongodb.net` dengan cluster URL yang sebenarnya
- `template_generator` dengan nama database yang diinginkan

### Contoh lengkap:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/template_generator?retryWrites=true&w=majority
```

### 7. Test Connection
Setelah update .env, restart server untuk test koneksi ke MongoDB Atlas.

## Troubleshooting:
- Jika gagal connect, pastikan IP sudah ditambahkan ke Network Access
- Pastikan username/password benar
- Pastikan tidak ada karakter khusus dalam password yang perlu di-encode
- Jika password mengandung @, %, dsb, gunakan URL encoding
