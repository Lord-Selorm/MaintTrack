# Quick Start Guide

Get the Equipment Maintenance Tracker backend running in 5 minutes.

## Prerequisites

- Node.js (v14+)
- MongoDB OR Docker

## Option 1: Quick Start (Recommended for Development)

### Windows PowerShell

```powershell
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
@"
MONGODB_URI=mongodb://localhost:27017/maintenance_tracker
PORT=5000
JWT_SECRET=super_secret_key_dev_only
NODE_ENV=development
"@ | Out-File -Encoding UTF8 .env

# 4. Start server (requires MongoDB running)
npm run dev
```

### macOS/Linux

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/maintenance_tracker
PORT=5000
JWT_SECRET=super_secret_key_dev_only
NODE_ENV=development
EOF

# 4. Start server (requires MongoDB running)
npm run dev
```

**Note:** You need MongoDB running separately. See "Install MongoDB" section below.

---

## Option 2: Docker (Easiest)

Requires Docker Desktop installed.

```bash
cd backend
docker-compose up
```

This will:
- Download MongoDB image
- Create database container
- Start your backend API
- Expose on http://localhost:5000

To stop: `Ctrl+C` then `docker-compose down`

---

## Install MongoDB Locally (For Option 1)

### Windows
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. Check "Install MongoDB as a Service"
4. MongoDB automatically starts and listens on localhost:27017

Verify:
```powershell
mongosh
> exit
```

### macOS (with Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu)
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

---

## Test the Backend

Once running, test with curl:

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"name\":\"Test User\"}"
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

Copy the returned `token` and use it below.

### Get Dashboard Stats
```bash
curl http://localhost:5000/api/equipment/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Equipment
```bash
curl -X POST http://localhost:5000/api/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "AC Unit A",
    "serial": "AC-2024-001",
    "type": "AC Unit",
    "status": "Active",
    "installed": "2024-01-15",
    "lifespan": 10,
    "location": "Block A",
    "notes": "Main cooling unit"
  }'
```

---

## Use with Frontend

### Method 1: Static Frontend

1. Open `maintenance_tracker.html` in browser
2. Include the API service:
   ```html
   <script src="api-service.js"></script>
   ```
3. Follow `MIGRATION_GUIDE.md` to update JavaScript

### Method 2: Run Frontend Server

```bash
# Simple Python server
python -m http.server 8000

# Or Node.js
npx http-server

# Then visit: http://localhost:8000/maintenance_tracker.html
```

### Method 3: Update API_BASE in api-service.js

If backend is on different machine:
```javascript
const API_BASE = 'http://192.168.1.100:5000/api';
// instead of
const API_BASE = 'http://localhost:5000/api';
```

---

## Environment Variables

### Development
```
MONGODB_URI=mongodb://localhost:27017/maintenance_tracker
PORT=5000
JWT_SECRET=dev_secret_key
NODE_ENV=development
```

### Production
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maintenance_tracker
PORT=5000
JWT_SECRET=strong_random_secret_key_here
NODE_ENV=production
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change `PORT` in .env or kill process |
| MongoDB not found | Install MongoDB or use Docker |
| CORS error | Check `API_BASE` matches backend URL |
| Token invalid | Re-login and get new token |
| Cannot connect to DB | Verify MongoDB running and connection string |

---

## Next Steps

1. ✅ Backend running
2. Update frontend (see MIGRATION_GUIDE.md)
3. Test all endpoints
4. Deploy to production

For detailed API docs, see `backend/README.md`
