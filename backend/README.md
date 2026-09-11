# Maintenance Tracker Backend

A robust Node.js + Express backend API for the Equipment Maintenance Tracker application.

## Features

- **User Authentication**: Register, login, and JWT-based authorization
- **Equipment Management**: CRUD operations for equipment with filtering and search
- **Work Logging**: Track maintenance, repairs, and inspections
- **Dashboard Metrics**: Get aggregated statistics
- **MongoDB Integration**: Scalable NoSQL database
- **CORS Support**: Full cross-origin resource sharing

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and set:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A strong secret key for JWT signing
- `PORT`: Server port (default: 5000)

## Running the Server

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
Returns: JWT token and user info

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Returns: JWT token and user info

**GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`
- Returns: Current user info

### Equipment

All equipment endpoints require `Authorization: Bearer <token>` header.

**GET** `/api/equipment`
- Query params: `search`, `type`, `status`
- Returns: List of equipment

**GET** `/api/equipment/:id`
- Returns: Single equipment with work records

**POST** `/api/equipment`
```json
{
  "name": "AC Unit A",
  "serial": "AC-2024-001",
  "type": "AC Unit",
  "status": "Active",
  "installed": "2024-01-15",
  "lifespan": 10,
  "location": "Block A",
  "notes": "Main cooling unit"
}
```
Returns: Created equipment

**PUT** `/api/equipment/:id`
- Update any field
- Returns: Updated equipment

**DELETE** `/api/equipment/:id`
- Deletes equipment and all related work records

**GET** `/api/equipment/dashboard/metrics`
- Returns: Total equipment, active count, under repair count, work count, total cost

### Work Records

All work endpoints require `Authorization: Bearer <token>` header.

**GET** `/api/work`
- Query params: `equipId`, `type`, `month`
- Returns: List of work records

**GET** `/api/work/:id`
- Returns: Single work record

**POST** `/api/work`
```json
{
  "equipId": "equipment_id",
  "type": "Maintenance",
  "date": "2024-01-20",
  "tech": "John Smith",
  "dur": 4,
  "cost": 500,
  "desc": "Routine maintenance and filter replacement"
}
```
Returns: Created work record

**PUT** `/api/work/:id`
- Update any field
- Returns: Updated work record

**DELETE** `/api/work/:id`
- Deletes work record

**GET** `/api/work/dashboard/recent`
- Returns: Last 6 work records for dashboard

## Database Schema

### User
- `email` (String, unique)
- `password` (String, hashed)
- `name` (String)
- `createdAt` (Date)

### Equipment
- `name` (String)
- `serial` (String, unique)
- `type` (Enum: AC Unit, Generator, Elevator, HVAC, Pump, Compressor, Vehicle, Other)
- `status` (Enum: Active, Under Repair, Inactive)
- `installed` (Date)
- `lifespan` (Number, years)
- `location` (String)
- `notes` (String)
- `userId` (Reference to User)
- `createdAt` (Date)
- `updatedAt` (Date)

### Work
- `equipId` (Reference to Equipment)
- `type` (Enum: Maintenance, Repair, Inspection)
- `date` (Date)
- `tech` (String)
- `dur` (Number, hours)
- `cost` (Number)
- `desc` (String)
- `userId` (Reference to User)
- `createdAt` (Date)
- `updatedAt` (Date)

## Connecting the Frontend

Update your frontend code to use the API:

```javascript
const API_BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

// Example: Get all equipment
async function getEquipment() {
  const res = await fetch(`${API_BASE}/equipment`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

// Example: Add equipment
async function addEquipment(data) {
  const res = await fetch(`${API_BASE}/equipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

Error responses include an `error` field with a message.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set a strong `JWT_SECRET`
4. Use environment-specific `.env` file
5. Consider using PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "maintenance-tracker"
   ```

## License

MIT
