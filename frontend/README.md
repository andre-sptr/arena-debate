# Arena Frontend

Next.js frontend untuk Arena AI Debate. Aplikasi ini menampilkan form topik debat, live streaming argument SSE, detail debat, dan history debat.

## Prasyarat Lokal

- Node.js 20 atau lebih baru
- npm
- Backend berjalan di `http://localhost:8000`
- Port `3000` kosong

## Menjalankan Frontend di Local

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Buat file `.env.local`:

```bash
touch .env.local
```

Di Windows PowerShell:

```powershell
New-Item -ItemType File -Force .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_PATH=
```

Jalankan dev server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Script Penting

Type check:

```bash
npm run type-check
```

Build production:

```bash
npm run build
```

Run production build:

```bash
npm run start
```

## Flow Local Lengkap

Terminal 1, backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Di Windows PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2, frontend:

```bash
cd frontend
npm run dev
```

Buka `http://localhost:3000`, input topik debat, lalu aplikasi akan masuk ke halaman live stream.

## Deploy Frontend ke VPS Ubuntu via aaPanel

Panduan ini memakai aaPanel untuk Nginx/domain/SSL dan PM2 untuk menjalankan Next.js.

### 1. Persiapan di aaPanel

Di aaPanel:

1. Install Nginx dari App Store aaPanel.
2. Install Node.js lewat Node Version Manager atau terminal.
3. Arahkan domain frontend, misalnya `domainanda.com`, ke IP VPS.
4. Pastikan backend sudah deploy dan bisa diakses, misalnya `https://api.domainanda.com`.

### 2. Install Node.js dan PM2

Jika Node belum tersedia, install Node.js LTS dari terminal. Contoh dengan NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2:

```bash
sudo npm install -g pm2
```

### 3. Upload atau Clone Project

Contoh lokasi project:

```bash
cd /www/wwwroot
git clone <url-repository-anda> arena-debate
cd /www/wwwroot/arena-debate/frontend
```

Jika tidak memakai Git, upload folder project lewat File Manager aaPanel ke:

```text
/www/wwwroot/arena-debate
```

### 4. Setup Environment Frontend

Buat `.env.local`:

```bash
nano .env.local
```

Isi:

```env
NEXT_PUBLIC_API_URL=https://api.domainanda.com
NEXT_PUBLIC_API_BASE_PATH=
```

Nilai `NEXT_PUBLIC_API_URL` harus mengarah ke domain backend yang sudah diproxy Nginx dan memakai SSL.

### 5. Install dan Build

```bash
npm install
npm run type-check
npm run build
```

### 6. Jalankan dengan PM2

```bash
pm2 start npm --name arena-frontend -- start -- -p 3000
pm2 save
pm2 startup
```

Ikuti command tambahan yang dicetak oleh `pm2 startup`, biasanya berupa `sudo env PATH=... pm2 startup ...`.

Cek status:

```bash
pm2 status
pm2 logs arena-frontend
```

### 7. Reverse Proxy Nginx dari aaPanel

Di aaPanel:

1. Buka Website.
2. Tambahkan site untuk domain frontend, misalnya `domainanda.com`.
3. Buka konfigurasi Nginx site tersebut.
4. Tambahkan atau sesuaikan reverse proxy:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Simpan lalu reload Nginx dari aaPanel.

### 8. SSL

Di aaPanel Website, aktifkan SSL untuk `domainanda.com` memakai Let's Encrypt.

### 9. Hubungkan Frontend dan Backend

Pastikan:

- Frontend `.env.local` memakai `NEXT_PUBLIC_API_URL=https://api.domainanda.com`.
- Backend CORS mengizinkan `https://domainanda.com`.
- Backend Nginx SSE route memakai `proxy_buffering off`.
- Browser bisa membuka `https://api.domainanda.com/health`.

Setelah mengubah `.env.local`, rebuild dan restart:

```bash
npm run build
pm2 restart arena-frontend
```

Setelah mengubah CORS backend:

```bash
sudo systemctl restart arena-backend
```

## Update Deployment

Jika memakai Git:

```bash
cd /www/wwwroot/arena-debate
git pull
cd frontend
npm install
npm run build
pm2 restart arena-frontend
```

Jika backend juga berubah:

```bash
cd /www/wwwroot/arena-debate/backend
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart arena-backend
```

## Checklist Production Frontend

- `npm run build` sukses.
- `pm2 status` menunjukkan `arena-frontend` online.
- `https://domainanda.com` bisa dibuka.
- `NEXT_PUBLIC_API_URL` mengarah ke backend production.
- Backend CORS mengizinkan domain frontend.
- Live debate stream berjalan sampai consensus.
