# Code Navigation Quick Reference

## 🚀 Quick Start - Where to Look

### "I need to understand how..."

| Need | File | Section |
|------|------|---------|
| **Login works** | `backend/routes/auth.js` | POST /login endpoint |
| **User roles are checked** | `backend/middleware/rbac.js` | PERMISSIONS object |
| **Equipment list displays** | `all-improvements.js` | renderEquipment() function |
| **Health scores calculate** | `backend/routes/health.js` | calculateHealthScore function |
| **Checklists work** | `backend/routes/checklists.js` | POST /complete endpoint |
| **Schedules are created** | `backend/routes/schedules.js` | POST / endpoint |
| **Frontend calls backend** | `all-improvements.js` | apiCall() function |
| **Database connects** | `backend/db.js` | Sequelize initialization |
| **Models relate** | `backend/models/index.js` | Association definitions |

---

## 📂 File Tree with Functions

```
backend/
├── server.js
│   └── Express app setup, CORS, route registration
│
├── db.js
│   └── SQLite connection via Sequelize
│
├── models/
│   ├── User.js: beforeCreate (password hashing), comparePassword()
│   ├── Equipment.js: -
│   ├── Work.js: -
│   ├── MaintenanceSchedule.js: -
│   ├── ChecklistCompletion.js: -
│   ├── EquipmentHealth.js: -
│   └── index.js: Model.associate() definitions
│
├── middleware/
│   ├── auth.js: auth() middleware
│   └── rbac.js: checkRole(), checkPermission(), checkOwnershipOrAdmin()
│
└── routes/
    ├── auth.js: POST /register, POST /login, GET /me
    ├── equipment.js: GET /, POST /, PUT /:id, DELETE /:id
    ├── work.js: GET /, POST /, PUT /:id, DELETE /:id
    ├── checklists.js: GET /, POST /, POST /:id/complete
    ├── schedules.js: GET /, POST /, PUT /:id, POST /:id/complete
    ├── health.js: GET /, GET /:id, GET /:id/recommendations
    ├── alerts.js: GET /, POST /, PUT /:id/read
    ├── analytics.js: GET /stats, GET /trend
    ├── reports.js: POST /pdf, POST /excel, POST /word
    └── imports.js: POST /import-equipment, POST /import-work

frontend/
├── maintenance_tracker.html
│   ├── <head>: CSS variables, styling
│   └── <body>: .app-shell structure with all pages
│
├── all-improvements.js
│   ├── apiCall(): Makes API requests
│   ├── renderDashboard()
│   ├── renderEquipment()
│   ├── renderWorkLog()
│   ├── addEquipment()
│   ├── logWork()
│   ├── showAlert()
│   └── Many feature classes
│
├── advanced-features.js
│   ├── class RBACManager: hasPermission(), setRole(), updateUIBasedOnRole()
│   ├── class ChecklistManager: loadChecklists(), createFromTemplate()
│   ├── class MaintenanceScheduler: loadSchedules(), scheduleMaintenance()
│   ├── class EquipmentHealthManager: loadEquipmentHealth(), getRecommendations()
│   ├── class AdvancedSearchEngine: Various filter methods
│   └── class TeamManager: openTeamModal(), inviteTeamMember()
│
└── new-pages.js
    ├── renderHealthPage()
    ├── renderSchedules()
    ├── renderChecklists()
    ├── renderTeam()
    └── openSettings()
```

---

## 🔍 Finding Specific Code

### Frontend Functions

**Show a page:**
```javascript
// Look in: maintenance_tracker.html
showPage('dashboard')
showPage('equipment')
showPage('health')
showPage('schedules')
```

**Get data from API:**
```javascript
// Look in: all-improvements.js
const data = await apiCall('GET', '/endpoint')
const data = await apiCall('POST', '/endpoint', { body })
```

**Check if user has permission:**
```javascript
// Look in: advanced-features.js
rbacManager.hasPermission('canDelete')
rbacManager.hasPermission('canViewAnalytics')
```

**Make an API call:**
```javascript
// Look in: all-improvements.js
const response = await fetch(`${API_URL}/endpoint`, { 
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Backend Endpoints

**Authentication:**
```
POST   /api/auth/register          Create account
POST   /api/auth/login             Get JWT token
GET    /api/auth/me                Get current user
```

**Equipment:**
```
GET    /api/equipment              List all
GET    /api/equipment/:id          Get one
POST   /api/equipment              Create
PUT    /api/equipment/:id          Update
DELETE /api/equipment/:id          Delete
```

**Work Logs:**
```
GET    /api/work                   List all
POST   /api/work                   Log new work
PUT    /api/work/:id               Update
DELETE /api/work/:id               Delete
```

**Health Scores:**
```
GET    /api/health                 All equipment health
GET    /api/health/:id             Single equipment
GET    /api/health/:id/recommendations  Maintenance suggestions
```

**Schedules:**
```
GET    /api/schedules              All schedules
GET    /api/schedules/upcoming     Next 30 days
POST   /api/schedules              Create schedule
PUT    /api/schedules/:id          Update schedule
POST   /api/schedules/:id/complete Mark complete
```

**Checklists:**
```
GET    /api/checklists             All templates
GET    /api/checklists/templates/:type  Templates for type
POST   /api/checklists             Create checklist
POST   /api/checklists/:id/complete   Submit inspection
```

---

## 🎯 Common Modifications

### Add a new field to Equipment

1. `backend/models/Equipment.js` - Add field definition
2. `all-improvements.js` - Update renderEquipment() to display field
3. `maintenance_tracker.html` - Update form to include field

### Add a new permission

1. `backend/middleware/rbac.js` - Add to PERMISSIONS object
2. `advanced-features.js` - Update RBACManager permissions
3. `maintenance_tracker.html` - Add data-require attribute to elements

### Create new API endpoint

1. Create function in `backend/routes/file.js`
2. Export route in `backend/server.js`
3. Call from frontend using `apiCall()`

### Add new page

1. Create HTML section in `maintenance_tracker.html` with id="page-name"
2. Create renderPageName() function in `new-pages.js`
3. Add navigation item in sidebar
4. Call renderPageName() in showPage()

---

## 🔐 Security-Related Code

### JWT Token

**Created:**
- File: `backend/routes/auth.js`
- Function: POST /login
- Contains: userId, role, iat, exp

**Verified:**
- File: `backend/middleware/auth.js`
- Function: auth middleware
- Used on: All protected routes

### Password Hashing

**Hashed:**
- File: `backend/models/User.js`
- Function: User.beforeCreate
- Method: bcrypt with salt 10

**Verified:**
- File: `backend/models/User.js`
- Method: comparePassword()
- Called from: POST /login

### Role-Based Access

**Defined:**
- File: `backend/middleware/rbac.js`
- Object: PERMISSIONS
- Contains: 4 roles × 9 permissions

**Enforced:**
- File: `backend/routes/*.js`
- Middleware: checkPermission(), checkRole()
- Used on: Sensitive endpoints

---

## 🐛 Debug Code Locations

### Backend Debugging

**Enable SQL logging:**
```javascript
// backend/db.js line ~8
logging: console.log  // Change from 'false'
```

**Add debug logs:**
```javascript
// backend/routes/*.js
console.log('Variable:', variable)
console.log('Request:', req.body)
```

**Check database:**
```bash
# SQLite file location
backend/maintenance_tracker.db

# Connect with:
sqlite3 maintenance_tracker.db
.tables
.schema User
```

### Frontend Debugging

**Browser console:**
```javascript
// Press F12, go to Console tab
console.log('Test:', variable)

// Common issues:
// - apiCall() returns undefined - check API_URL
// - Modal not showing - check getElementById()
// - Data not loading - check Network tab for failed requests
```

**Common errors:**
```
// localStorage.getItem returns null
// Check: Is auth_token saved after login?

// API returns 401 Unauthorized
// Check: Is JWT token in localStorage?
// Check: Is Authorization header correct?

// API returns 403 Forbidden
// Check: Does user have required permission?
// Check: Is role correct in JWT token?
```

---

## 📊 Data Models Quick Ref

### User
```javascript
{
  id, email, password, name,
  role: 'admin|manager|technician|viewer',
  department, phone, isActive, createdAt
}
```

### Equipment
```javascript
{
  id, userId, name, type, serial,
  installationDate, lifespan, status,
  location, manufacturer, model,
  purchaseDate, warranty
}
```

### MaintenanceSchedule
```javascript
{
  id, userId, equipId,
  scheduledDate, maintenanceType,
  priority: 'Low|Normal|High|Critical',
  status: 'Scheduled|In Progress|Completed|Postponed|Cancelled',
  description, estimatedCost, assignedTo, completedDate
}
```

### EquipmentHealth
```javascript
{
  id, userId, equipId,
  healthScore: 0-100,
  status: 'Excellent|Healthy|Fair|Poor|Critical|Offline',
  agePercentage, failureRiskLevel,
  recommendedAction, nextScheduledMaintenance,
  lastCheckedDate
}
```

### ChecklistCompletion
```javascript
{
  id, userId, equipId, checklistId, workId,
  completedItems, itemsCompleted, totalItems,
  completionPercentage, issuesFound,
  recommendedActions, photoUrls, notes
}
```

---

## ⚡ Performance Tips

### Reduce API Calls
- Combine multiple requests into one endpoint
- Cache data in localStorage when possible
- Load once, display multiple times

### Optimize Queries
- Use SELECT specific fields, not *
- Add WHERE clauses to filter early
- Use include: for related data

### Frontend Performance
- Lazy load modals (create when needed)
- Use event delegation for many items
- Throttle frequent events (search, scroll)

---

## 📚 File Size Reference

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| maintenance_tracker.html | HTML | 2000+ | Main UI |
| all-improvements.js | JS | 1500+ | Core features |
| advanced-features.js | JS | 1000+ | Advanced features |
| new-pages.js | JS | 300+ | Page renderers |
| server.js | Node | 100+ | Server setup |
| auth.js | Node | 100+ | Auth routes |
| checklists.js | Node | 200+ | Checklist routes |
| schedules.js | Node | 200+ | Schedule routes |
| health.js | Node | 200+ | Health routes |

---

## 🎓 Learning Path

### Beginner (Start Here)
1. Read: `CODEBASE_DOCUMENTATION.md`
2. Read: `maintenance_tracker.html` (skim CSS, focus on HTML structure)
3. Read: `all-improvements.js` (look for function names)
4. Try: Add console.log() to track data flow

### Intermediate
1. Read: `backend/routes/auth.js` (understand login flow)
2. Read: `advanced-features.js` (understand class structure)
3. Read: `backend/middleware/rbac.js` (understand permissions)
4. Try: Add a new field to Equipment model

### Advanced
1. Read: `backend/models/index.js` (understand relationships)
2. Read: `backend/routes/health.js` (understand algorithms)
3. Read: Full backend implementation
4. Try: Add new feature (new route + frontend UI)

---

## 🆘 Troubleshooting

| Issue | Check |
|-------|-------|
| Login fails | `backend/routes/auth.js` - POST /login |
| API 401 error | `localStorage.getItem('auth_token')` - Is it set? |
| API 403 error | User role - Check permission required |
| Data not loading | Browser Network tab - Check API response |
| UI not showing | Console errors - Check for JavaScript errors |
| Health score wrong | `health.js` - calculateHealthScore() |
| Modal not closing | Click handler - Check onclick attribute |

---

**Last Updated**: June 2, 2026 | **Version**: 2.0.0
