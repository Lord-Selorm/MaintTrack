# Project Files Reference

## Root Level Files (for frontend)

| File | Purpose |
|------|---------|
| `maintenance_tracker.html` | Original frontend application (unchanged) |
| `api-service.js` | **NEW** - JavaScript API client for frontend |
| `BUILD_SUMMARY.md` | **NEW** - Overview of entire backend |
| `QUICKSTART.md` | **NEW** - 5-minute quick start guide |
| `BACKEND_SETUP.md` | **NEW** - Detailed setup instructions |
| `MIGRATION_GUIDE.md` | **NEW** - Frontend integration guide |

## Backend Directory Files

### Configuration & Entry Point

| File | Purpose |
|------|---------|
| `backend/server.js` | Main Express server, routes setup, MongoDB connection |
| `backend/package.json` | NPM dependencies and scripts |
| `backend/.env.example` | Environment variables template |
| `backend/.env` | **CREATE THIS** - Your actual environment variables |
| `backend/.gitignore` | Git ignore rules |
| `backend/README.md` | Complete API documentation |
| `backend/Dockerfile` | Docker containerization |
| `backend/docker-compose.yml` | Docker Compose for MongoDB + API |

### Data Models (`backend/models/`)

| File | Purpose |
|------|---------|
| `backend/models/User.js` | User schema with password hashing |
| `backend/models/Equipment.js` | Equipment schema |
| `backend/models/Work.js` | Work records schema |

### API Routes (`backend/routes/`)

| File | Purpose |
|------|---------|
| `backend/routes/auth.js` | Authentication endpoints (register, login, me) |
| `backend/routes/equipment.js` | Equipment CRUD + dashboard metrics |
| `backend/routes/work.js` | Work log CRUD + recent work |

### Middleware (`backend/middleware/`)

| File | Purpose |
|------|---------|
| `backend/middleware/auth.js` | JWT authentication middleware |

## File Relationships

```
maintenance_tracker.html
    ↓ (includes)
api-service.js
    ↓ (makes API calls to)
backend/server.js
    ├─→ backend/routes/auth.js
    ├─→ backend/routes/equipment.js
    ├─→ backend/routes/work.js
    │
    ├─→ backend/middleware/auth.js (checks JWT)
    │
    └─→ MongoDB
        ├─ User collection (backend/models/User.js)
        ├─ Equipment collection (backend/models/Equipment.js)
        └─ Work collection (backend/models/Work.js)
```

## Setup Checklist

- [ ] Read `BUILD_SUMMARY.md` for overview
- [ ] Read `QUICKSTART.md` for fastest setup
- [ ] Run `cd backend && npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Edit `.env` with MongoDB URI and JWT secret
- [ ] Install MongoDB or use Docker
- [ ] Run `npm run dev` to start backend
- [ ] Test with `curl` or Postman
- [ ] Include `api-service.js` in frontend HTML
- [ ] Follow `MIGRATION_GUIDE.md` to update JavaScript

## Commands Reference

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Using Docker
docker-compose up
docker-compose down
```

### Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Environment Variables

### Required

```
MONGODB_URI=mongodb://localhost:27017/maintenance_tracker
JWT_SECRET=your_super_secret_key_here
```

### Optional

```
PORT=5000                    # Default: 5000
NODE_ENV=development        # Or: production
```

### Examples

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/maintenance_tracker
```

**MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/maintenance_tracker
```

**Docker MongoDB:**
```
MONGODB_URI=mongodb://mongodb:27017/maintenance_tracker
```

## API Response Format

All responses are JSON:

### Success (200)
```json
{
  "field": "value",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

### Created (201)
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "field": "value"
}
```

### Error (400/401/500)
```json
{
  "error": "Description of what went wrong"
}
```

## Key Concepts

### Authentication
- Users register with email/password
- Backend returns JWT token
- Token sent in `Authorization: Bearer <token>` header
- Token expires after 30 days

### Multi-Tenancy
- Equipment and work records are private to each user
- User ID automatically added to all database records
- User can only access their own data

### CRUD Operations
- **C**reate: POST request with data
- **R**ead: GET request
- **U**pdate: PUT request with changes
- **D**elete: DELETE request with ID

### Filtering & Search
- Query parameters: `?search=value&type=type&status=status`
- Backend handles partial matching for search
- Enum validation for type/status

## Troubleshooting

### Backend won't start
1. Check Node.js installed: `node --version`
2. Check dependencies: `npm install`
3. Check MongoDB running
4. Check port 5000 not in use
5. Check .env file exists

### API calls failing
1. Check backend running: `curl http://localhost:5000/api/health`
2. Check token valid (not expired)
3. Check headers include `Authorization: Bearer <token>`
4. Check MongoDB connection string
5. Check request body JSON format

### Frontend not connecting
1. Verify `API_BASE` in `api-service.js` correct
2. Check backend running on correct port
3. Check CORS error in browser console
4. Check network tab in DevTools for request details

## Performance Tips

1. **Use search/filters** - Don't load all data
2. **Limit queries** - Use pagination for large datasets
3. **Cache responses** - Store in localStorage if needed
4. **Batch operations** - Group API calls together
5. **Compression** - Enable gzip on production

## Security Notes

1. ✅ Passwords hashed with bcrypt (10 rounds)
2. ✅ JWT tokens expire after 30 days
3. ✅ User data isolated per user ID
4. ✅ Input validation on all endpoints
5. ✅ CORS whitelist (if needed for production)

**To do for production:**
- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS (use reverse proxy like nginx)
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Set up database backups
- [ ] Monitor error logs

## Additional Resources

- **Express.js**: https://expressjs.com/
- **MongoDB**: https://docs.mongodb.com/
- **Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/
- **CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

---

**Everything is ready to go!** 🚀

Start with `npm install` in the backend directory, then `npm run dev`.
