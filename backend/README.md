# Arena Backend

FastAPI backend untuk Arena AI Debate. Service ini menangani:

- Endpoint debate sinkron: `POST /debate/start`
- Endpoint debate streaming SSE: `POST /debate/start/stream`
- Endpoint history: `/history`
- Database SQLite lokal via SQLAlchemy async
- Integrasi Google Gemini lewat LangChain

## Prasyarat Lokal

- Python 3.11 atau lebih baru
- Google Gemini API key dari Google AI Studio
- Port `8000` kosong

## Menjalankan Backend di Local

Masuk ke folder backend:

```bash
cd backend
```

Buat virtual environment:

```bash
python -m venv .venv
```

Aktifkan virtual environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependency:

```bash
pip install -r requirements.txt
```

Copy env example:

```bash
cp .env.example .env
```

Di Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` minimal:

```env
GOOGLE_API_KEY=isi_api_key_gemini
DATABASE_URL=sqlite+aiosqlite:///./arena.db
API_HOST=0.0.0.0
API_PORT=8000
```

Jalankan server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Cek health check:

```bash
curl http://127.0.0.1:8000/health
```

Dokumentasi Swagger tersedia di:

```text
http://127.0.0.1:8000/docs
```

## Test Backend

```bash
pytest -q
```

## Endpoint Penting

Start debate biasa:

```bash
curl -X POST http://127.0.0.1:8000/debate/start \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"Should AI be regulated by governments?\"}"
```

Start debate streaming SSE:

```bash
curl -N -X POST http://127.0.0.1:8000/debate/start/stream \
  -H "Content-Type: application/json" \
  -d "{\"topic\":\"Should AI be regulated by governments?\"}"
```

## Deploy Backend ke VPS Ubuntu via aaPanel

Panduan ini memakai Terminal/SSH dari aaPanel agar tetap stabil walaupun tampilan aaPanel berubah.

### 1. Persiapan di aaPanel

Di aaPanel:

1. Install Nginx dari App Store aaPanel.
2. Pastikan Python 3 dan pip tersedia di server.
3. Buka menu Terminal di aaPanel atau login via SSH.
4. Arahkan domain API, misalnya `api.domainanda.com`, ke IP VPS.

### 2. Upload atau Clone Project

Contoh lokasi project:

```bash
cd /www/wwwroot
git clone <url-repository-anda> arena-debate
cd /www/wwwroot/arena-debate/backend
```

Jika tidak memakai Git, upload folder project lewat File Manager aaPanel ke:

```text
/www/wwwroot/arena-debate
```

### 3. Setup Python Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Buat file `.env`:

```bash
cp .env.example .env
nano .env
```

Isi minimal:

```env
GOOGLE_API_KEY=isi_api_key_gemini
DATABASE_URL=sqlite+aiosqlite:///./arena.db
API_HOST=127.0.0.1
API_PORT=8000
```

Untuk SQLite, pastikan file `arena.db` berada di folder backend dan foldernya bisa ditulis oleh user service.

### 4. Test Manual di VPS

```bash
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Dari terminal lain:

```bash
curl http://127.0.0.1:8000/health
```

Jika hasilnya sehat, hentikan uvicorn dengan `Ctrl+C`.

### 5. Buat Service systemd

Buat file service:

```bash
sudo nano /etc/systemd/system/arena-backend.service
```

Isi:

```ini
[Unit]
Description=Arena FastAPI Backend
After=network.target

[Service]
WorkingDirectory=/www/wwwroot/arena-debate/backend
EnvironmentFile=/www/wwwroot/arena-debate/backend/.env
ExecStart=/www/wwwroot/arena-debate/backend/.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5
User=www
Group=www

[Install]
WantedBy=multi-user.target
```

Jika user `www` tidak punya akses ke folder project, jalankan:

```bash
sudo chown -R www:www /www/wwwroot/arena-debate
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable arena-backend
sudo systemctl start arena-backend
sudo systemctl status arena-backend
```

Log backend:

```bash
journalctl -u arena-backend -f
```

### 6. Reverse Proxy Nginx dari aaPanel

Di aaPanel:

1. Buka Website.
2. Tambahkan site untuk domain API, misalnya `api.domainanda.com`.
3. Buka konfigurasi Nginx site tersebut.
4. Tambahkan atau sesuaikan blok reverse proxy:

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /debate/start/stream {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600;
}
```

Simpan lalu reload Nginx dari aaPanel.

### 7. SSL

Di aaPanel Website, aktifkan SSL untuk `api.domainanda.com` memakai Let's Encrypt.

### 8. CORS

Backend saat ini mengizinkan origin di `backend/main.py`. Untuk production, tambahkan domain frontend Anda ke `allow_origins`, misalnya:

```python
allow_origins=[
    "http://localhost:3000",
    "https://domainanda.com",
]
```

Restart backend setelah mengubah konfigurasi:

```bash
sudo systemctl restart arena-backend
```

## Checklist Production Backend

- `GOOGLE_API_KEY` sudah benar.
- `curl https://api.domainanda.com/health` mengembalikan status sehat.
- Domain frontend sudah masuk CORS.
- Nginx SSE route memakai `proxy_buffering off`.
- `arena-backend.service` aktif dan auto-start.
- File database SQLite dibackup secara berkala jika masih memakai SQLite.
