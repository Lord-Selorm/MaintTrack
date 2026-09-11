# Maintenance Tracker - Backend Setup Instructions

## Overview

I've built a complete backend for your Equipment Maintenance Tracker using:
- **Node.js + Express** - Web server framework
- **MongoDB** - Database
- **JWT** - User authentication
- **Mongoose** - Database ORM

## Directory Structure

```
maintenance_tracker/
├── maintenance_tracker.html      (Your original frontend)
├── api-service.js                (New: Frontend API client)
├── MIGRATION_GUIDE.md            (Integration guide)
├── backend/
│   ├── package.json              (Dependencies)
│   ├── server.js                 (Main server file)
│   ├── .env.example              (Environment template)
│   ├── README.md                 (Backend documentation)
│   ├── models/
│   │   ├── User.js               (User schema)
│   │   ├── Equipment.js          (Equipment schema)
│   │   └── Work.js               (Work records schema)
│   ├── routes/
│   │   ├── auth.js               (Auth endpoints)
│   │   ├── equipment.js          (Equipment CRUD + dashboard)
│   │   └── work.js               (Work log CRUD)
│   └── middleware/
│       └── auth.js               (JWT authentication)
```

## Step 1: Install MongoDB

### Option A: Local MongoDB
1. Download from https://www.mongodb.com/try/download/community
2. Install following the installer wizard
3. MongoDB will run on `mongodb://localhost:27017`

### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/maintenance_tracker`

## Step 2: Setup Backend

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Edit .env with your values**
```
MONGODB_URI=mongodb://localhost:27017/maintenance_tracker
# or if using MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/maintenance_tracker

PORT=5000
JWT_SECRET=your_super_secret_key_12345
NODE_ENV=development
```

5. **Start the backend**
```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected
```

## Step 3: Update Frontend (Optional)

The frontend still works with localStorage, but to use the new API:

1. **Include the API service in your HTML**
```html
<!-- Add this before closing </body> -->
<script src="api-service.js"></script>
```

2. **Follow the MIGRATION_GUIDE.md** for updating JavaScript functions

## API Endpoints

### Test the API

1. **Register a user**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

2. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Get Dashboard Metrics** (authenticated)
```bash
curl http://localhost:5000/api/equipment/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Features

✅ **User Authentication**
- Register with email/password
- Login with JWT token
- Secure password hashing

✅ **Equipment Management**
- Create, read, update, delete equipment
- Search by name/serial number
- Filter by type and status
- Automatic timestamps

✅ **Work Logging**
- Create maintenance records
- Track repairs and inspections
- Record technician, duration, cost
- Link to specific equipment

✅ **Dashboard Metrics**
- Total equipment count
- Active vs under repair status
- Work records count
- Total maintenance cost

✅ **Data Validation**
- Required field checks
- Unique serial numbers
- Proper date handling
- Cost and duration validation

## Database Schema

### User
```
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  createdAt: Date
}
```

### Equipment
```
{
  _id: ObjectId,
  name: String,
  serial: String (unique),
  type: String (AC Unit, Generator, etc.),
  status: String (Active, Under Repair, Inactive),
  installed: Date,
  lifespan: Number,
  location: String,
  notes: String,
  userId: ObjectId (reference to User),
  createdAt: Date,
  updatedAt: Date
}
```

### Work
```
{
  _id: ObjectId,
  equipId: ObjectId (reference to Equipment),
  type: String (Maintenance, Repair, Inspection),
  date: Date,
  tech: String,
  dur: Number (hours),
  cost: Number,
  desc: String,
  userId: ObjectId (reference to User),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend JavaScript Service

The `api-service.js` file provides a clean API client:

```javascript
// Available methods:
api.login(email, password)
api.register(email, password, name)
api.getCurrentUser()
api.logout()

api.getEquipment(filters)
api.getEquipmentDetail(id)
api.createEquipment(data)
api.updateEquipment(id, data)
api.deleteEquipment(id)
api.getDashboardMetrics()

api.getWork(filters)
api.createWork(data)
api.updateWork(id, data)
api.deleteWork(id)
api.getRecentWork()
```

## Troubleshooting

**Port 5000 already in use?**
```bash
# Kill the process on port 5000 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
# Or change PORT in .env
```

**MongoDB connection failed?**
- Ensure MongoDB is running (check Services on Windows)
- Verify connection string in .env
- Check firewall/network settings

**CORS errors on frontend?**
- Backend has CORS enabled by default
- Check API_BASE URL in api-service.js matches your backend

**JWT Token errors?**
- Make sure JWT_SECRET is set in .env
- Token expires after 30 days
- Set new secret for security

## Next Steps

1. ✅ Start backend server
2. ✅ Test API endpoints with curl/Postman
3. ✅ Update frontend to use API (optional, but recommended)
4. ✅ Deploy to production when ready

## Deployment

### Local Testing
```bash
npm run dev
```

### Production Build
```bash
NODE_ENV=production npm start
```

### Deploy to Heroku
1. Create Heroku account
2. Install Heroku CLI
3. Create Procfile: `web: node server.js`
4. Deploy: `git push heroku main`

### Deploy to AWS/Azure
Similar steps - set environment variables and start with `npm start`

## Support Files

- `backend/README.md` - Detailed API documentation
- `MIGRATION_GUIDE.md` - Step-by-step frontend integration
- `api-service.js` - Ready-to-use API client for frontend

---

**Backend is ready to use!** 🚀
Start the server and integrate with your frontend.
