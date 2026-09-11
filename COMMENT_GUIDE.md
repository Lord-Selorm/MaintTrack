# Code Comment Guide & Philosophy

## Overview

Every file in this codebase includes comprehensive comments to make it readable for developers of all skill levels. This guide explains the commenting style and philosophy used throughout the project.

---

## Comment Structure

### 1. File Header Comments

**Purpose**: Explain what the entire file does at a high level

**Format**: Multi-line block comment at the very top of file

**Example**:
```javascript
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USER AUTHENTICATION MODEL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Represents user accounts with password hashing
 * 
 * Key Responsibilities:
 * - Store user credentials securely
 * - Validate email and password
 * - Hash passwords before saving
 * - Provide password comparison method
 * 
 * Fields:
 * - email: Login identifier (unique)
 * - password: Hashed password (bcrypt)
 * - name: User's full name
 * - role: User's permission level (admin, manager, technician, viewer)
 * 
 * Methods:
 * - comparePassword(): Verify login password
 * - beforeCreate(): Hash password before saving
 * - beforeUpdate(): Re-hash if password changed
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
```

**What to include**:
- Title of the file
- Purpose (what it does)
- Key features/responsibilities
- Important fields or methods
- Data models (if applicable)
- Usage notes

### 2. Section Dividers

**Purpose**: Break file into logical sections

**Format**: Repeated dashes with clear labels

**Examples**:
```javascript
// ─────────────────────────────────────────────────────────────────────────
// MIDDLEWARE SETUP
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────
```

**When to use**: 
- When grouping related code
- Between major features in a file
- At least once per 100 lines of code

### 3. Function/Class Comments

**Purpose**: Explain what a function or class does

**Format**: JSDoc-style comment above function/class

**Example**:
```javascript
/**
 * Calculate equipment health score
 * 
 * Takes into account age, repair history, and maintenance costs
 * to determine how healthy the equipment is (0-100 scale)
 * 
 * Factors considered:
 * 1. Age as % of lifespan (-40 pts if >80%)
 * 2. Repair frequency (-20 pts if >5 repairs)
 * 3. Average maintenance cost (-15 pts if >$500)
 * 4. Current status (-30 pts if Under Repair)
 * 
 * @param {Object} equipment - Equipment record with age/lifespan
 * @param {Array} works - Array of work records for this equipment
 * @returns {number} - Health score 0-100
 * 
 * Example:
 * const score = calculateHealthScore(equipment, works)
 * if (score < 40) alert('Equipment critical!')
 */
function calculateHealthScore(equipment, works) {
  // Implementation
}
```

**What to include**:
- One-line description of what it does
- More detailed explanation
- Parameters with types
- Return value with type
- Example usage (if not obvious)
- Any side effects (modifies global state, etc.)

### 4. Inline Comments

**Purpose**: Explain WHY code does something, not WHAT it does

**Format**: Comment on same line or line above

**GOOD examples** (explain WHY):
```javascript
// Subtract 30 points for equipment that's currently broken
// because we can't assess full condition until repair is complete
if (equipment.status === 'Under Repair') score -= 30;

// Use 10 rounds for bcrypt salt - balances security vs speed
// Higher values (>12) are too slow for web app logins
const salt = await bcrypt.genSalt(10);
```

**BAD examples** (just repeat what code does):
```javascript
// Check if status equals Under Repair
if (equipment.status === 'Under Repair') score -= 30;

// Create salt
const salt = await bcrypt.genSalt(10);
```

**When to use**:
- Complex algorithms or business logic
- Non-obvious decisions
- Performance optimizations
- Workarounds or hacks
- Anything that might confuse future readers

**When NOT to use**:
- Simple assignments (`const x = 5;`)
- Self-evident code (`const email = user.email`)
- Standard library usage that's obvious

### 5. Console.log Comments

**Purpose**: Explain what debug output is being printed

**Format**: Comment explaining the output

**Example**:
```javascript
// Print current equipment health score for debugging
console.log(`Equipment health score: ${score} (Status: ${status})`);

// Show all equipment owned by user for troubleshooting
console.log('User equipment:', equipment);
```

---

## Commenting Best Practices

### 1. Explain the "Why", Not the "What"

**Good**:
```javascript
// Users might not have permission to delete important records,
// so we check RBAC before allowing deletion
router.delete('/:id', auth, checkPermission('canDeleteAll'), deleteHandler);
```

**Bad**:
```javascript
// Apply auth middleware
router.delete('/:id', auth, checkPermission('canDeleteAll'), deleteHandler);
```

### 2. Keep Comments Up to Date

If you change code, update the comments too!

**Example of outdated comment**:
```javascript
// Calculate health as 50% age + 50% repairs
// WRONG! Actually uses 40% age + 10% repairs + other factors
const score = calculateHealthScore(equipment, works);
```

### 3. Use Clear Language

**Good**: 
```javascript
// Ensure score stays within valid range (0-100)
return Math.max(0, Math.min(100, score));
```

**Bad**:
```javascript
// Do math thing
return Math.max(0, Math.min(100, score));
```

### 4. Explain Unusual Patterns

**Example**:
```javascript
// Use optional chaining (?.) because role might not be in token
// for older tokens. Default to 'technician' if missing.
req.role = decoded.role || 'technician';
```

### 5. Explain Complex Formulas

**Example**:
```javascript
// Health Score Calculation:
// Base: 100 points
// Age penalty: -10 to -40 based on age percentage
// Repair penalty: -10 to -20 based on repair count
// Cost penalty: -8 to -15 based on avg maintenance cost
// Status penalty: -30 (broken) or -50 (inactive)
// Final: Clamp to 0-100 range
const score = Math.max(0, Math.min(100, ...));
```

---

## Comment Examples by File Type

### Backend Models (database structure)

```javascript
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EQUIPMENT MODEL - Database Structure
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Represents physical equipment/assets that need maintenance
 * 
 * Database Table: equipment
 * 
 * Fields Explained:
 * - id: Auto-incrementing primary key
 * - userId: Foreign key to User (owner)
 * - name: Display name for equipment
 * - type: Category (AC Unit, Generator, etc.) for grouping
 * - serial: Unique identifier printed on equipment
 * - status: Lifecycle state (Active, Under Repair, Inactive)
 * - installationDate: When equipment was put into service
 * - lifespan: Expected years of use for age calculation
 * - location: Physical location in facility
 * - notes: Additional information about equipment
 * 
 * Relationships:
 * - User: One user owns many equipment
 * - Work: One equipment has many work records
 * - MaintenanceSchedule: One equipment has many schedules
 * - EquipmentHealth: One equipment has one health record
 * 
 * Common Queries:
 * - Equipment.findAll({ where: { userId } }): Get all equipment for user
 * - Equipment.findByPk(id, { include: 'work' }): Get with all work records
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
```

### Backend Routes (API endpoints)

```javascript
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EQUIPMENT ROUTES - REST API Endpoints
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Endpoints:
 * - GET    /equipment              List all equipment for authenticated user
 * - GET    /equipment/:id          Get single equipment details
 * - POST   /equipment              Create new equipment
 * - PUT    /equipment/:id          Update equipment properties
 * - DELETE /equipment/:id          Remove equipment from system
 * 
 * Authentication: All endpoints require JWT token in Authorization header
 * 
 * Authorization: Users can only access their own equipment
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * GET /equipment
 * 
 * Retrieve all equipment owned by the authenticated user
 * 
 * Returns:
 * [
 *   {
 *     id: 1,
 *     name: "AC Unit - Building A",
 *     type: "AC Unit",
 *     status: "Active",
 *     location: "3rd Floor",
 *     ...
 *   },
 *   ...
 * ]
 */
router.get('/', auth, async (req, res) => {
  // Get all equipment for this user
  const equipment = await Equipment.findAll({ where: { userId: req.userId } });
  res.json(equipment);
});
```

### Frontend JavaScript Classes

```javascript
/**
 * RBACManager Class
 * 
 * Purpose: Manage user roles and permissions on frontend
 * 
 * Responsibilities:
 * - Store user's role (admin, manager, technician, viewer)
 * - Check if user has specific permission
 * - Show/hide UI elements based on permissions
 * - Update role when changed
 * 
 * Properties:
 * - userRole: Current user's role
 * - permissions: Matrix of role → permissions
 * 
 * Methods:
 * - hasPermission(permission): Check single permission
 * - setRole(role): Update user role
 * - updateUIBasedOnRole(): Refresh UI visibility
 * 
 * Usage:
 * if (rbacManager.hasPermission('canDelete')) {
 *   deleteButton.style.display = 'block';
 * }
 */
class RBACManager {
  /**
   * Constructor
   * 
   * Initializes role from localStorage or defaults to 'technician'
   * Loads permission matrix for all 4 roles
   */
  constructor() {
    this.userRole = localStorage.getItem('user_role') || 'technician';
    this.permissions = { /* ... */ };
  }
  
  /**
   * Check if user has specific permission
   * 
   * @param {string} permission - Permission name
   * @returns {boolean} - True if user has permission
   */
  hasPermission(permission) {
    return this.permissions[this.userRole]?.[permission] || false;
  }
}
```

### Frontend HTML

```html
<!--
╔════════════════════════════════════════════════════════════════════════════╗
║                  EQUIPMENT MAINTENANCE TRACKER - FRONTEND                  ║
║                      Single Page Application (SPA)                         ║
╚════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
  Web application for tracking equipment maintenance and repairs

ARCHITECTURE:
  - Single HTML file with embedded CSS and JavaScript
  - All pages rendered dynamically via JavaScript
  - No build process needed (plain HTML5)
  - Responsive design works on desktop and tablet

PAGES INCLUDED:
  - Dashboard: Overview and statistics
  - Equipment: Asset management
  - Work Log: Maintenance history
  - Health: Equipment health scores
  - Analytics: Charts and reports

FEATURES:
  ✓ User authentication with JWT
  ✓ Role-based access control
  ✓ Equipment tracking with photos
  ✓ Maintenance scheduling
  ✓ Export to PDF/Excel/Word
  ✓ Dark mode toggle

LOADING ORDER:
  1. HTML structure loads
  2. CSS applied
  3. JavaScript files load:
     - all-improvements.js (core)
     - advanced-features.js (features)
     - new-pages.js (pages)
  4. init() function starts app

-->
```

---

## Comment Standards by Language

### JavaScript
- Use `//` for single-line comments
- Use `/* */` for multi-line comments
- Use `/** */` for JSDoc comments on functions/classes

### SQL (if used)
- Use `--` for comments
- Put data type and constraints in comments
- Explain non-obvious WHERE clauses

### Shell/Bash
- Use `#` for all comments
- Explain any non-standard commands

---

## Checklist: Are Your Comments Good?

- [ ] File has header comment explaining purpose
- [ ] Functions/classes have JSDoc comments
- [ ] Complex logic has inline comments explaining WHY
- [ ] Comments are up-to-date with code
- [ ] Comments explain non-obvious decisions
- [ ] Comments don't just repeat what code does
- [ ] Comments use clear, professional language
- [ ] No outdated commented-out code (delete it)
- [ ] No "TODO" comments without context
- [ ] Comments match actual behavior

---

## Comment Rules

### DO Comment:
- ✓ Complex algorithms or business logic
- ✓ Non-obvious design decisions
- ✓ Performance optimizations
- ✓ Workarounds or temporary solutions
- ✓ Security-sensitive code
- ✓ Expected data formats
- ✓ Error conditions and edge cases
- ✓ Why you chose one approach over another

### DON'T Comment:
- ✗ Obvious code: `x = 5` doesn't need "Set x to 5"
- ✗ Commented-out code: Delete it instead
- ✗ Comments that repeat variable names
- ✗ Jokes or non-professional content
- ✗ "Fixing bug XYZ" without context
- ✗ Vague comments like "Handle stuff here"

---

## Example: Before and After

### BEFORE (Bad Comments)

```javascript
// Get user from database
const user = await User.findByPk(req.userId);

// Check if user exists
if (!user) {
  return res.status(404).json({ error: 'Not found' });
}

// Hash password
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);
```

### AFTER (Good Comments)

```javascript
// Find the user making the request
// (req.userId is set by auth middleware after token validation)
const user = await User.findByPk(req.userId);

// Return 404 if user deleted after token was issued
// This prevents stale tokens from accessing non-existent users
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}

// Use 10 rounds for bcrypt salt
// Balances security (more rounds = more secure) vs speed
// 10 rounds ≈ 10ms on modern hardware (acceptable for web app)
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);
```

---

## Questions to Ask Before Writing a Comment

1. **Will a new developer understand why this code exists?** If no → add comment
2. **Is there a non-obvious design decision?** If yes → explain it
3. **Could this code be replaced with something simpler?** If yes → maybe delete instead
4. **Is the code doing exactly what the name suggests?** If no → clarify in comment
5. **Is there a performance or security tradeoff?** If yes → document it

---

**Remember**: Comments are for humans reading code. Write them clearly, keep them accurate, and delete old ones!

---

*Last Updated: June 2, 2026 | Version: 2.0.0*
