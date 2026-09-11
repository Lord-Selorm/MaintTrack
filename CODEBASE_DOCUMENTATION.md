# Equipment Maintenance Tracker - Complete Code Documentation

**Last Updated**: June 2, 2026  
**Version**: 2.0.0  
**Status**: Production Ready

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Structure](#backend-structure)
4. [Frontend Structure](#frontend-structure)
5. [Key Features](#key-features)
6. [Code Navigation Guide](#code-navigation-guide)
7. [How to Read & Modify Code](#how-to-read--modify-code)
8. [Common Tasks](#common-tasks)
9. [Debugging Tips](#debugging-tips)
10. [Contributing Guidelines](#contributing-guidelines)

---

## Overview

The Equipment Maintenance Tracker is a complete web application for managing maintenance of equipment and assets. It features:

- **User authentication** with JWT tokens
- **Role-based access control** (Admin, Manager, Technician, Viewer)
- **Equipment tracking** with detailed information
- **Work logging** with photo attachments
- **Maintenance scheduling** with calendar
- **Health scoring** of equipment
- **Inspection checklists** with templates
- **Analytics & reporting** with export options
- **Alert system** for maintenance needs
- **Advanced search** and filtering

---

## Architecture

### High-Level Data Flow

```
Frontend (HTML/JavaScript)
    ↓
Browser LocalStorage (Auth Token, User Data)
    ↓
REST API (Express/Node.js)
    ↓
Database (SQLite)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | User interface |
| **Backend** | Node.js, Express.js | REST API server |
| **Database** | SQLite + Sequelize ORM | Data persistence |
| **Auth** | JWT (JSON Web Tokens) | Session management |
| **Charts** | Chart.js | Data visualization |
| **Icons** | Font Awesome | UI icons |

---

## Backend Structure

### Directory Layout

```
backend/
├── server.js                 # Express server setup & route registration
├── db.js                     # Database configuration
├── models/                   # Database models (ORM definitions)
│   ├── User.js              # User accounts with roles
│   ├── Equipment.js         # Equipment/assets
│   ├── Work.js              # Work records/logs
│   ├── Alert.js             # Alert system
│   ├── AuditLog.js          # Activity audit trail
│   ├── Checklist.js         # Inspection templates
│   ├── ChecklistCompletion.js # Completed inspections
│   ├── MaintenanceSchedule.js # Scheduled maintenance
│   ├── EquipmentHealth.js   # Health scores
│   ├── WorkAttachment.js    # File attachments
│   └── index.js             # Model associations
├── routes/                   # API endpoint handlers
│   ├── auth.js              # Login/Register/Profile
│   ├── equipment.js         # Equipment CRUD
│   ├── work.js              # Work log operations
│   ├── alerts.js            # Alert management
│   ├── analytics.js         # Statistics & data
│   ├── reports.js           # PDF/Excel export
│   ├── checklists.js        # Checklist operations
│   ├── schedules.js         # Schedule management
│   ├── health.js            # Health scoring
│   └── imports.js           # Import/export
├── middleware/              # Request processing
│   ├── auth.js              # JWT verification
│   └── rbac.js              # Role-based access control
├── utils/                   # Helper functions
│   ├── alertService.js      # Alert generation
│   ├── analyticsService.js  # Data aggregation
│   └── searchFilters.js     # Advanced search
└── uploads/                 # Stored files
    ├── attachments/         # Work attachments
    ├── manuals/            # Equipment manuals
    └── tmp/                # Temporary files
```

### Key Backend Files Explained

#### server.js - Application Entry Point
**Purpose**: Initialize Express app, register routes, connect database  
**Key Sections**:
- CORS configuration
- JSON middleware setup
- Database authentication
- Route registration
- Error handling

**When to modify**: Adding new routes, changing middleware, adjusting CORS

#### models/User.js - User Account Model
**Purpose**: Define user structure with authentication  
**Key Fields**:
- email: Login identifier
- password: Hashed with bcrypt
- role: admin/manager/technician/viewer
- department: Optional team info
- isActive: Account status

**Key Methods**:
- beforeCreate: Hash password before saving
- comparePassword(): Verify login password

#### models/index.js - Database Relationships
**Purpose**: Define how models relate to each other  
**Associations Defined**:
- User → Equipment (one-to-many)
- User → Work (one-to-many)
- Equipment → Work (one-to-many)
- Equipment → MaintenanceSchedule (one-to-many)
- Equipment ↔ EquipmentHealth (one-to-one)

**How to read**: Each association creates query methods  
Example: `user.getEquipment()` or `equipment.setHealth(healthObj)`

#### middleware/auth.js - Authentication
**Purpose**: Verify JWT tokens on protected routes  
**How it works**:
1. Extract token from Authorization header
2. Verify signature with JWT_SECRET
3. Decode to get userId and role
4. Attach to req object

**When to modify**: Changing token format, adding new token claims

#### middleware/rbac.js - Role-Based Access Control
**Purpose**: Check user permissions for endpoints  
**Key Functions**:
- checkRole(role): Verify user has required role
- checkPermission(permission): Check specific permission
- checkOwnershipOrAdmin(): Allow user to modify own resources

**Usage on routes**:
```javascript
router.delete('/equipment/:id', auth, checkPermission('canDeleteAll'), deleteHandler)
```

#### routes/auth.js - Authentication Endpoints
**Endpoints**:
- POST /auth/register - Create new account
- POST /auth/login - Get JWT token
- GET /auth/me - Get current user profile

**Key Logic**:
- Validates email uniqueness
- Hashes passwords with bcrypt
- Creates JWT token (30 day expiration)
- Includes role in token payload

#### routes/equipment.js - Equipment Management
**Endpoints**:
- GET /equipment - List all user's equipment
- GET /equipment/:id - Get one equipment
- POST /equipment - Create new
- PUT /equipment/:id - Update
- DELETE /equipment/:id - Remove

**Important Fields**:
- name: Equipment identifier
- type: Category (AC Unit, Generator, etc.)
- serial: Unique serial number
- purchaseDate: When acquired
- status: Active/Under Repair/Inactive

#### routes/health.js - Equipment Health Scoring
**Endpoints**:
- GET /health - All equipment health scores
- GET /health/:id - Single equipment health
- GET /health/:id/recommendations - Maintenance suggestions

**Health Score Calculation**:
```
Base: 100
- Age penalty: 10-40 points
- Repair penalty: 10-20 points
- Cost penalty: 8-15 points
- Status penalty: 30-50 points
Result: 0-100 score
```

**Status Mapping**:
- 90+: Excellent
- 75-90: Healthy
- 60-75: Fair
- 40-60: Poor
- <40: Critical

#### routes/checklists.js - Inspection Checklists
**Endpoints**:
- GET /checklists - List templates
- GET /checklists/templates/:type - Get template by equipment type
- POST /checklists - Create new checklist
- POST /checklists/:id/complete - Submit inspection results
- PUT/DELETE - Update/remove checklists

**Pre-built Templates**: AC Unit, Generator, Elevator, HVAC, Pump

#### routes/schedules.js - Maintenance Scheduling
**Endpoints**:
- GET /schedules - All schedules
- GET /schedules/upcoming - Next 30 days
- POST /schedules - Create schedule
- PUT /schedules/:id - Update status/date
- POST /schedules/:id/complete - Mark completed

**Status Types**: Scheduled, In Progress, Completed, Postponed, Cancelled

---

## Frontend Structure

### Directory Layout

```
frontend/
├── maintenance_tracker.html      # Main HTML file (Single Page App)
├── all-improvements.js           # Core features
├── advanced-features.js          # RBAC, Checklists, Scheduling, Health
├── new-pages.js                 # Page renderers (Health, Schedules, etc.)
├── api-service.js               # Optional: Backend API helper
└── [Other feature files]        # Additional functionality
```

### Key Frontend Files

#### maintenance_tracker.html - Main Application
**Structure**:
```html
<body>
  .app-shell
    ├── .sidebar (navigation)
    └── .main-content
         ├── .header (top bar)
         └── .section (pages: dashboard, equipment, etc.)
</body>
```

**CSS Sections**:
- Layout (flexbox, grid)
- Colors (CSS custom properties for theming)
- Components (buttons, modals, cards)
- Responsive design (mobile-first)

**JavaScript Sections**:
- Page navigation
- Data loading from API
- Form handling
- Modal management
- Dark mode toggle

**Key Global Variables**:
- `currentUser`: Logged-in user info
- `equipment`: Array of all equipment
- `work`: Array of work records
- `alerts`: Array of system alerts
- `authToken`: JWT token for API calls

#### advanced-features.js - Feature Manager Classes

**Class: RBACManager**
- Purpose: Manage user roles and permissions
- Methods:
  - `hasPermission(perm)`: Check if user has permission
  - `setRole(role)`: Update user role
  - `updateUIBasedOnRole()`: Show/hide UI elements

**Class: ChecklistManager**
- Purpose: Manage inspection checklists
- Templates: 5 pre-built equipment types
- Methods:
  - `loadChecklists()`: Fetch from API
  - `createChecklistFromTemplate()`: Create new
  - `openChecklistModal()`: Show inspection UI
  - `submitChecklistCompletion()`: Save results

**Class: MaintenanceScheduler**
- Purpose: Schedule maintenance tasks
- Methods:
  - `loadSchedules()`: Get all schedules
  - `scheduleMaintenance()`: Create new
  - `markAsComplete()`: Finish schedule
  - `getUpcomingSchedules()`: Next 30 days

**Class: EquipmentHealthManager**
- Purpose: Calculate and display health scores
- Methods:
  - `loadEquipmentHealth()`: Fetch health data
  - `getAllHealthScores()`: Get all scores
  - `getRecommendations()`: Get maintenance suggestions
  - `getHealthBadge()`: Generate color-coded badge

**Class: AdvancedSearchEngine**
- Purpose: Advanced filtering and search
- Filters:
  - By health score range
  - By date range
  - By status
  - By priority
  - Full-text search

**Class: TeamManager**
- Purpose: Manage team members
- Methods:
  - `openTeamModal()`: Show team UI
  - `inviteTeamMember()`: Add new member

#### new-pages.js - Page Renderers

**Functions**:
- `renderHealthPage()`: Display equipment health dashboard
- `renderSchedules()`: Show maintenance schedules
- `renderChecklists()`: List inspection templates
- `renderTeam()`: Team member management
- `openSettings()`: User preferences and account

**Pattern Used**:
```javascript
async function renderPageName() {
  try {
    // Fetch data from API
    const data = await apiCall('GET', '/endpoint');
    
    // Generate HTML
    const html = data.map(item => `<div>...</div>`).join('');
    
    // Update DOM
    document.getElementById('container').innerHTML = html;
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
```

---

## Key Features

### 1. Authentication System
**How It Works**:
1. User enters email/password on login
2. Sent to `/auth/login` endpoint
3. Backend verifies password (bcrypt comparison)
4. Returns JWT token with userId and role
5. Token stored in localStorage
6. All subsequent API calls include token in Authorization header

**Token Format**:
```javascript
{
  userId: 123,
  role: "technician",
  iat: 1234567890,
  exp: 1234654290
}
```

**Security**:
- Passwords hashed with bcrypt (salt: 10 rounds)
- Tokens verified on every request
- CORS restricted to approved origins
- Role included in token (no extra lookup needed)

### 2. Role-Based Access Control
**Four Roles with Different Permissions**:

| Permission | Admin | Manager | Technician | Viewer |
|-----------|-------|---------|-----------|--------|
| View All Data | ✓ | ✓ | ✗ | ✓ |
| Edit All | ✓ | ✓ | ✗ | ✗ |
| Delete All | ✓ | ✓ | ✗ | ✗ |
| Approve Work | ✓ | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✗ | ✓ |
| Create Templates | ✓ | ✓ | ✗ | ✗ |
| Assign Work | ✓ | ✓ | ✗ | ✗ |

**Implementation**:
- Backend: RBAC middleware checks on sensitive routes
- Frontend: RBACManager class controls UI visibility
- Storage: Role stored in JWT token

### 3. Equipment Health Scoring
**Calculation**:
```javascript
function calculateHealthScore(equipment, repairs, avgCost) {
  let score = 100;
  const agePercent = (equipment.age / equipment.lifespan) * 100;
  
  if (agePercent > 80) score -= 40;
  else if (agePercent > 60) score -= 25;
  else if (agePercent > 40) score -= 10;
  
  if (repairs > 5) score -= 20;
  else if (repairs > 3) score -= 10;
  
  if (avgCost > 500) score -= 15;
  else if (avgCost > 250) score -= 8;
  
  if (equipment.status === 'Under Repair') score -= 30;
  
  return Math.max(0, Math.min(100, score));
}
```

### 4. Inspection Checklists
**How to Use**:
1. Navigate to Checklists page
2. Select equipment type (AC Unit, Generator, etc.)
3. System loads pre-built template
4. Inspector checks off items during inspection
5. Document any issues found
6. Add maintenance recommendations
7. Submit with timestamp

**Data Stored**:
- Items completed/not completed
- Issues found with descriptions
- Recommendations for maintenance
- Photo URLs for documentation
- Inspector notes
- Completion timestamp

### 5. Maintenance Scheduling
**Features**:
- Schedule maintenance by date
- Set priority (Low/Normal/High/Critical)
- Select maintenance type (Routine/Repair/Emergency)
- Estimate cost
- Assign to technician
- Track completion status
- View upcoming 30-day schedule

### 6. Advanced Search & Filtering
**Filter By**:
- Equipment type
- Status (Active/Repair/Inactive)
- Health score range
- Date range
- Priority level
- Search keyword (full-text)

---

## Code Navigation Guide

### For Beginners

**Understanding the Login Flow**:
1. Read: `maintenance_tracker.html` - Search for "Login Form"
2. Read: `backend/routes/auth.js` - POST /login route
3. Read: `backend/models/User.js` - Password comparison
4. Read: `backend/middleware/auth.js` - Token verification

**Understanding Equipment Display**:
1. Read: `all-improvements.js` - `renderEquipment()` function
2. Read: `backend/routes/equipment.js` - GET /equipment
3. Read: `backend/models/Equipment.js` - Equipment structure
4. Look at: `maintenance_tracker.html` - Search for "page-equipment"

**Understanding Role-Based Access**:
1. Read: `advanced-features.js` - RBACManager class
2. Read: `backend/middleware/rbac.js` - Permission checks
3. Search: `data-require="can"` in `maintenance_tracker.html`

### For Intermediate Users

**Adding a New Feature**:
1. Create database model in `backend/models/`
2. Add associations in `backend/models/index.js`
3. Create routes in `backend/routes/`
4. Create frontend class in appropriate JS file
5. Create page renderer in `new-pages.js`
6. Add navigation in `maintenance_tracker.html`

**Modifying API Response**:
1. Find route in `backend/routes/`
2. Modify the data query/transformation
3. Update corresponding frontend class to handle new format
4. Test in browser (check console for errors)

**Changing Permission Rules**:
1. Edit `PERMISSIONS` object in `backend/middleware/rbac.js`
2. Update role descriptions in this documentation
3. Test with different user roles

### For Advanced Users

**Optimizing Database Queries**:
1. Check `backend/routes/` for N+1 queries
2. Add `include` clauses to Sequelize queries
3. Use specific field selection to reduce data transfer

**Adding Real-Time Features**:
1. Install Socket.io in `package.json`
2. Import in `server.js`
3. Create handlers for events
4. Update frontend to connect and listen

**Scaling to Production**:
1. Change `force: false` in `server.js` database sync
2. Move JWT_SECRET to `.env` file
3. Enable query logging for performance analysis
4. Add database indexing for frequently queried fields
5. Implement caching for analytics

---

## How to Read & Modify Code

### Code Reading Tips

1. **Start with the comment headers**
   - Each file has a multi-line comment explaining its purpose
   - This gives you the "why" before diving into "how"

2. **Follow the data flow**
   - Frontend button click → JavaScript function
   - JavaScript function → API call to backend
   - Backend API call → Database query
   - Database returns data → Backend returns response → Frontend updates UI

3. **Look for patterns**
   - Most routes follow: Get data → Validate → Query DB → Return response
   - Most frontend functions follow: Fetch → Process → Render HTML → Insert into DOM

4. **Read the inline comments**
   - Comments explain why decisions were made
   - Comments explain complex logic
   - Comments show expected data formats

### Code Modification Tips

1. **Always work in small increments**
   - Make one change
   - Test it
   - Move to next change
   - This makes debugging easier

2. **Maintain consistency**
   - Follow existing naming conventions
   - Follow existing code structure
   - Use similar error handling patterns

3. **Add comments for complex code**
   - Explain the "why", not the "what"
   - Bad: `// Add 10 to score`
   - Good: `// Bonus for recent maintenance (within 1 year)`

4. **Test in multiple scenarios**
   - Test with different user roles
   - Test with empty data
   - Test with large datasets
   - Test error cases

### Debugging Guide

**Frontend Issues**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Check Elements tab for DOM issues
5. Use `console.log()` to debug JavaScript

**Backend Issues**:
1. Check terminal where server is running
2. Enable SQL logging: Change `logging: false` to `logging: console.log` in db.js
3. Add console.log() in route handlers
4. Check API response format in Network tab

**Database Issues**:
1. Check if database file exists: `backend/maintenance_tracker.db`
2. Check model definitions for type mismatches
3. Verify associations are correct
4. Try deleting DB file to force resync

---

## Common Tasks

### Adding a New Field to Equipment

**Step 1: Update Database Model**
```javascript
// backend/models/Equipment.js
const Equipment = sequelize.define('Equipment', {
  // ... existing fields ...
  warrantyExpiration: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});
```

**Step 2: Update Frontend Display**
```javascript
// In equipment rendering function
<tr>
  <td>${eq.name}</td>
  <td>${new Date(eq.warrantyExpiration).toLocaleDateString()}</td>
</tr>
```

**Step 3: Update API Response**
- Sequelize automatically includes new field in responses
- No changes needed if using `findAll()` or `findByPk()`

### Adding a New Role

**Step 1: Update User Model**
```javascript
// backend/models/User.js
role: {
  validate: {
    isIn: [['admin', 'manager', 'technician', 'viewer', 'inspector']],  // Add 'inspector'
  },
}
```

**Step 2: Add Role to RBAC**
```javascript
// backend/middleware/rbac.js
const PERMISSIONS = {
  inspector: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canApproveWork: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canCreateTemplates: false,
    canAssignWork: false,
    canGenerateReports: false,
  },
};
```

**Step 3: Update Frontend**
```javascript
// advanced-features.js
this.permissions = {
  // ... existing roles ...
  inspector: {
    canEdit: false,
    canDelete: false,
    // ... etc
  },
};
```

### Creating a New API Endpoint

**Step 1: Create Route Handler**
```javascript
// backend/routes/custom.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { Equipment } = require('../models');

// GET /api/custom/endpoint
router.get('/endpoint', auth, checkPermission('canViewAll'), async (req, res) => {
  try {
    const data = await Equipment.findAll({ where: { userId: req.userId } });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

**Step 2: Register Route**
```javascript
// backend/server.js
const customRoutes = require('./routes/custom');
app.use('/api/custom', customRoutes);
```

**Step 3: Call from Frontend**
```javascript
// In JavaScript function
const data = await apiCall('GET', '/custom/endpoint');
```

---

## Contributing Guidelines

### Code Style

- **Naming**: camelCase for functions/variables, PascalCase for classes
- **Indentation**: 2 spaces (not tabs)
- **Line Length**: Keep under 100 characters
- **Comments**: Use for "why", not "what"

### Commit Messages

- Format: `[Type] Description`
- Types: `[Feature]`, `[Fix]`, `[Improve]`, `[Docs]`
- Examples:
  - `[Feature] Add email notification system`
  - `[Fix] Correct health score calculation`
  - `[Improve] Optimize equipment list query`

### Testing Checklist

Before committing code:
- [ ] Works in all 4 user roles
- [ ] Handles empty data gracefully
- [ ] Shows appropriate error messages
- [ ] Follows existing code patterns
- [ ] Includes inline comments for complex logic
- [ ] Tested with different browsers

---

## Quick Reference

### Important File Locations

| What | Where |
|------|-------|
| User authentication | `backend/routes/auth.js` |
| Role permissions | `backend/middleware/rbac.js` |
| Equipment data | `backend/models/Equipment.js` |
| Equipment display | `all-improvements.js` - renderEquipment() |
| Health scores | `backend/routes/health.js` |
| Checklists | `backend/routes/checklists.js` |
| Schedules | `backend/routes/schedules.js` |
| Frontend pages | `new-pages.js` |
| Main HTML | `maintenance_tracker.html` |

### Key Database Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| User | User accounts | email, password, role, department |
| Equipment | Assets | name, type, serial, status |
| Work | Maintenance records | equipId, description, cost, date |
| MaintenanceSchedule | Scheduled tasks | equipId, scheduledDate, priority |
| ChecklistCompletion | Inspection results | checklistId, equipId, issues |
| EquipmentHealth | Health scores | equipId, healthScore, status |
| Alert | System alerts | userId, message, type, isRead |

### API Base URL
```
http://localhost:5000/api
```

### Environment Variables
```
PORT=5000                           # Server port
JWT_SECRET=your_secret_key         # Token signing secret
NODE_ENV=development               # Environment mode
```

---

## Support & Resources

- **Need Help?** Check the comments in the specific file
- **Database Issues?** See Debugging Guide → Database Issues
- **Performance Problems?** Check SQL queries by enabling logging
- **Want to Contribute?** Follow Contributing Guidelines section

---

**Happy Coding! 🚀**

*For questions about specific code, refer to the inline comments in the source files.*
