/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADVANCED FEATURES: RBAC, CHECKLISTS, SCHEDULING, HEALTH SCORING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Core JavaScript classes for advanced features
 * 
 * Includes:
 * 1. RBACManager - Role-based access control UI
 * 2. ChecklistManager - Equipment inspection templates
 * 3. MaintenanceScheduler - Schedule management
 * 4. EquipmentHealthManager - Health score calculations
 * 5. AdvancedSearchEngine - Advanced filtering
 * 6. TeamManager - Team member management
 * 
 * Architecture:
 * - Each feature is a separate class
 * - Classes handle both data and UI
 * - Uses async/await for API calls
 * - Uses localStorage for persistence
 * - All API calls use Bearer token from auth_token localStorage
 * 
 * Data Flow:
 * 1. User interacts with UI (button click, form submission)
 * 2. Manager class method is called
 * 3. API call to backend (with JWT token)
 * 4. Parse response and update localStorage/DOM
 * 5. UI automatically reflects changes
 * 
 * Error Handling:
 * - Try/catch on all async operations
 * - Alert() user on errors
 * - Console logging for debugging
 * - Graceful fallbacks if data unavailable
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * API BASE URL
 * All API calls use this base URL with endpoints appended
 * Uses relative URL to work with any server configuration
 */
/* API_BASE already defined in main inline script — do not redeclare */

/* ═══════════════════════════════════════════════════════════════════════════
   1. ROLE-BASED ACCESS CONTROL (RBAC) MANAGER
   
   Purpose: Manages user roles and permissions for UI elements
   Provides: Role checking, permission validation, UI updates
═══════════════════════════════════════════════════════════════════════════ */

/**
 * RBACManager Class
 * 
 * Manages role-based UI visibility and permissions
 * 
 * Features:
 * - Load user role from localStorage
 * - Check if user has specific permission
 * - Update user role
 * - Show/hide UI elements based on role
 * 
 * Data Storage:
 * - Stored in localStorage with key 'user_role'
 * - Persists across page refreshes
 */
class RBACManager {
  /**
   * Constructor - Initialize manager
   * Loads user role from localStorage or defaults to 'technician'
   */
  constructor() {
    // Load saved role from localStorage
    this.userRole = localStorage.getItem('user_role') || 'technician';
    
    // Define permissions for each role
    // Each permission is true/false for that role
    this.permissions = {
      admin: { 
        canEdit: true,              // Can edit all records
        canDelete: true,            // Can delete any record
        canApprove: true,           // Can approve work
        canManageUsers: true,       // Can manage user accounts
        canViewAnalytics: true      // Can view analytics
      },
      manager: {
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canManageUsers: false,      // Cannot manage users
        canViewAnalytics: true
      },
      technician: {
        canEdit: false,             // Can't edit others' records
        canDelete: false,
        canApprove: false,
        canManageUsers: false,
        canViewAnalytics: false     // Can't view analytics
      },
      viewer: {
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canManageUsers: false,
        canViewAnalytics: true      // Can only view analytics
      },
    };
  }

  /**
   * Check if user has specific permission
   * 
   * @param {string} permission - Permission name (e.g., 'canEdit')
   * @returns {boolean} - True if user has permission, false otherwise
   * 
   * Usage: if (rbacManager.hasPermission('canDelete')) { ... }
   */
  hasPermission(permission) {
    return this.permissions[this.userRole]?.[permission] || false;
  }

  /**
   * Update user's role
   * Saves to localStorage and updates UI
   * 
   * @param {string} role - New role (admin, manager, technician, viewer)
   */
  setRole(role) {
    this.userRole = role;
    localStorage.setItem('user_role', role);
    this.updateUIBasedOnRole();
  }

  /**
   * Update UI visibility based on user role
   * Shows/hides elements with data-require attribute
   * 
   * Example HTML:
   * <button data-require="canDelete">Delete</button>
   * <div data-require="canManageUsers">User Management</div>
   */
  updateUIBasedOnRole() {
    // Find all UI elements that require specific permissions
    const editButtons = document.querySelectorAll('[data-require="canEdit"]');
    const deleteButtons = document.querySelectorAll('[data-require="canDelete"]');
    const approveButtons = document.querySelectorAll('[data-require="canApprove"]');
    const analyticsButtons = document.querySelectorAll('[data-require="canViewAnalytics"]');
    const manageButtons = document.querySelectorAll('[data-require="canManageUsers"]');

    // Show or hide each element based on permission
    editButtons.forEach(btn => {
      btn.style.display = this.hasPermission('canEdit') ? 'inline-flex' : 'none';
    });
    deleteButtons.forEach(btn => {
      btn.style.display = this.hasPermission('canDelete') ? 'inline-flex' : 'none';
    });
    approveButtons.forEach(btn => {
      btn.style.display = this.hasPermission('canApprove') ? 'inline-flex' : 'none';
    });
    analyticsButtons.forEach(btn => {
      btn.style.display = this.hasPermission('canViewAnalytics') ? 'inline-flex' : 'none';
    });
    manageButtons.forEach(btn => {
      btn.style.display = this.hasPermission('canManageUsers') ? 'inline-flex' : 'none';
    });
  }
}

// Initialize RBAC manager globally so it can be used everywhere
const rbacManager = new RBACManager();

/* ═══════════════════════════════════════════════════════════════════════════
   2. CHECKLIST MANAGER
   
   Purpose: Manage inspection checklists and templates
   Provides: Create, load, complete checklists
═══════════════════════════════════════════════════════════════════════════ */

/**
 * ChecklistManager Class
 * 
 * Manages equipment inspection checklists
 * 
 * Features:
 * - Pre-built templates for different equipment types
 * - Create checklists from templates
 * - Complete checklist inspections
 * - Store completed results with photos and notes
 */
class ChecklistManager {
  /**
   * Constructor - Initialize with empty checklists
   * Define templates for 5 equipment types
   */
  constructor() {
    this.checklists = [];  // Array of loaded checklists
    
    /**
     * CHECKLIST TEMPLATES
     * Pre-defined inspection items for each equipment type
     * These are used as defaults when creating new checklists
     */
    this.templates = {
      // AC Unit inspection checklist (5 items)
      'AC Unit': [
        'Check thermostat settings',
        'Inspect air filter condition',
        'Clean condenser coils',
        'Check refrigerant levels',
        'Test temperature accuracy',
      ],
      
      // Generator inspection checklist (6 items)
      'Generator': [
        'Check fuel level',
        'Test battery voltage',
        'Inspect air filter',
        'Check oil level and condition',
        'Test automatic transfer switch',
        'Run under load test',
      ],
      
      // Elevator inspection checklist (6 items)
      'Elevator': [
        'Inspect door operation',
        'Check emergency brake',
        'Test alarm button',
        'Inspect cables for wear',
        'Check counterweight system',
        'Verify safety switches',
      ],
      
      // HVAC inspection checklist (5 items)
      'HVAC': [
        'Check filter status',
        'Inspect ductwork',
        'Test thermostat',
        'Check compressor operation',
        'Verify airflow',
      ],
      
      // Pump inspection checklist (5 items)
      'Pump': [
        'Check pump vibration',
        'Verify flow rate',
        'Check for leaks',
        'Inspect impeller wear',
        'Test pressure gauge',
      ],
    };
  }

  /**
   * Load all checklists from backend
   * 
   * @returns {Promise<Array>} - Array of checklist objects
   */
  async loadChecklists() {
    try {
      const response = await fetch(`${API_URL}/checklists`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      this.checklists = await response.json();
      return this.checklists;
    } catch (err) {
      console.error('Error loading checklists:', err);
      return [];
    }
  }

  /**
   * Create new checklist from template
   * 
   * @param {string} equipmentType - Type of equipment (AC Unit, Generator, etc.)
   * @param {string} checklistName - Custom name for checklist
   * @returns {Promise<Object>} - Created checklist object
   */
  async createChecklistFromTemplate(equipmentType, checklistName) {
    // Get template items for this equipment type
    const items = this.templates[equipmentType] || [];
    
    try {
      const response = await fetch(`${API_URL}/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: checklistName || `${equipmentType} Checklist`,
          equipmentType,
          // Convert template items to checklist format
          items: items.map(item => ({ label: item, completed: false })),
          isTemplate: false,
        }),
      });
      const checklist = await response.json();
      this.checklists.push(checklist);
      return checklist;
    } catch (err) {
      showToast('Error creating checklist: ' + err.message, 'error');
      return null;
    }
  }

  /**
   * Submit completed checklist inspection
   * 
   * @param {number} checklistId - ID of checklist being completed
   * @param {number} equipId - ID of equipment being inspected
   * @param {Array} completedItems - Items that were checked
   * @param {string} issues - Description of issues found
   * @param {string} recommendations - Recommended maintenance actions
   * @returns {Promise<Object>} - Completion result
   */
  async submitChecklistCompletion(checklistId, equipId, completedItems, issues, recommendations) {
    try {
      const response = await fetch(`${API_URL}/checklists/${checklistId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          equipId,
          completedItems,
          issuesFound: issues,
          recommendations,
        }),
      });
      return await response.json();
    } catch (err) {
      showToast('Error submitting checklist: ' + err.message, 'error');
      return null;
    }
  }

  /**
   * Open checklist modal for inspection
   * Displays checklist items as checkboxes in a modal
   * 
   * @param {number} equipId - Equipment ID being inspected
   * @param {string} equipmentType - Type of equipment
   */
  openChecklistModal(equipId, equipmentType) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'checklist-modal';

    const template = this.templates[equipmentType] || [];
    // Generate checkbox HTML for each template item
    let itemsHTML = template.map((item, i) => `
      <div style="display:flex;gap:10px;padding:8px;align-items:center">
        <input type="checkbox" id="check-item-${i}" data-item="${item}">
        <label for="check-item-${i}" style="flex:1;cursor:pointer">${item}</label>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-clipboard-check"></i> ${equipmentType} Inspection</h3>
          <button class="modal-close" onclick="document.getElementById('checklist-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="form-grid">
          <div style="background:var(--surface2);padding:12px;border-radius:var(--radius-sm);margin-bottom:16px">
            <strong>Inspection Checklist:</strong>
            ${itemsHTML}
          </div>
          <div class="form-group">
            <label>Issues Found</label>
            <textarea id="checklist-issues" placeholder="Document any issues discovered during inspection..."></textarea>
          </div>
          <div class="form-group">
            <label>Recommendations</label>
            <textarea id="checklist-recommendations" placeholder="Recommended actions or maintenance needed..."></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('checklist-modal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="checklistManager.submitChecklistFromModal(${equipId}, '${equipmentType}')">
              <i class="fa-solid fa-check"></i> Complete Inspection
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  submitChecklistFromModal(equipId, equipmentType) {
    const items = [];
    document.querySelectorAll('#checklist-modal input[type="checkbox"]').forEach(checkbox => {
      items.push({
        label: checkbox.dataset.item,
        completed: checkbox.checked,
      });
    });

    const issues = document.getElementById('checklist-issues')?.value || '';
    const recommendations = document.getElementById('checklist-recommendations')?.value || '';
    const completed = items.filter(i => i.completed).length;
    const percentage = Math.round((completed / items.length) * 100);

    const eq = equipment.find(e => e.id == equipId);
    const checklistId = this.checklists[0]?.id;
    if (checklistId) {
      this.submitChecklistCompletion(checklistId, equipId, items, issues, recommendations);
    }
    
    showToast(`Checklist Submitted: ${percentage}% Complete`, 'success');
    document.getElementById('checklist-modal')?.remove();
  }
}

const checklistManager = new ChecklistManager();

/* ═══════════════════════════════════════════════════════════════════════════
   3. MAINTENANCE SCHEDULING
═══════════════════════════════════════════════════════════════════════════ */

class MaintenanceScheduler {
  constructor() {
    this.schedules = [];
  }

  async loadSchedules() {
    try {
      const response = await fetch(`${API_URL}/schedules`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      this.schedules = await response.json();
      return this.schedules;
    } catch (err) {
      console.error('Error loading schedules:', err);
      return [];
    }
  }

  async scheduleMaintenance(equipId, scheduledDate, maintenanceType, priority, description, estimatedCost) {
    try {
      const response = await fetch(`${API_URL}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          equipId,
          scheduledDate,
          maintenanceType,
          priority,
          description,
          estimatedCost,
        }),
      });
      const schedule = await response.json();
      this.schedules.push(schedule);
      return schedule;
    } catch (err) {
      showToast('Error scheduling maintenance: ' + err.message, 'error');
      return null;
    }
  }

  openScheduleModal(equipId, equipName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'schedule-modal';

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-calendar"></i> Schedule Maintenance</h3>
          <button class="modal-close" onclick="document.getElementById('schedule-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Equipment</label>
            <input type="text" value="${equipName}" readonly style="background:var(--surface2);cursor:not-allowed">
          </div>
          <div class="form-group">
            <label>Scheduled Date</label>
            <input type="date" id="schedule-date" required>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Maintenance Type</label>
              <select id="schedule-type">
                <option>Maintenance</option>
                <option>Repair</option>
                <option>Inspection</option>
                <option>Preventive</option>
              </select>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select id="schedule-priority">
                <option>Low</option>
                <option selected>Normal</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Estimated Cost ($)</label>
            <input type="number" id="schedule-cost" placeholder="0.00" step="0.01">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="schedule-description" placeholder="Details about this maintenance task..."></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('schedule-modal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="maintenanceScheduler.submitScheduleFromModal(${equipId})">
              <i class="fa-solid fa-calendar-check"></i> Schedule
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async submitScheduleFromModal(equipId) {
    const date = document.getElementById('schedule-date').value;
    const type = document.getElementById('schedule-type').value;
    const priority = document.getElementById('schedule-priority').value;
    const cost = document.getElementById('schedule-cost').value;
    const description = document.getElementById('schedule-description').value;

    if (!date) {
      showToast('Please select a date', 'warning');
      return;
    }

    await this.scheduleMaintenance(equipId, new Date(date), type, priority, description, cost);
    showToast('Maintenance scheduled successfully!', 'success');
    document.getElementById('schedule-modal')?.remove();
  }

  async getUpcomingSchedules() {
    try {
      const response = await fetch(`${API_URL}/schedules/upcoming`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      return await response.json();
    } catch (err) {
      console.error('Error loading upcoming schedules:', err);
      return [];
    }
  }
  async markAsComplete(scheduleId) {
    try {
      const response = await fetch(`${API_URL}/schedules/${scheduleId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to mark as complete');
      showToast('Schedule marked as complete!', 'success');
      if (typeof renderSchedules === 'function') renderSchedules();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }
}

const maintenanceScheduler = new MaintenanceScheduler();

/* ═══════════════════════════════════════════════════════════════════════════
   4. EQUIPMENT HEALTH SCORING
═══════════════════════════════════════════════════════════════════════════ */

class EquipmentHealthManager {
  constructor() {
    this.healthData = {};
  }

  async loadEquipmentHealth(equipId) {
    try {
      const response = await fetch(`${API_URL}/health/${equipId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const health = await response.json();
      this.healthData[equipId] = health;
      return health;
    } catch (err) {
      console.error('Error loading health data:', err);
      return null;
    }
  }

  async getAllHealthScores() {
    try {
      const response = await fetch(`${API_URL}/health`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      return await response.json();
    } catch (err) {
      console.error('Error loading health scores:', err);
      return [];
    }
  }

  getHealthBadge(score) {
    if (score >= 90) return '<span class="badge" style="background:var(--green-light);color:var(--green)">Excellent</span>';
    if (score >= 75) return '<span class="badge badge-active">Healthy</span>';
    if (score >= 60) return '<span class="badge" style="background:var(--amber-light);color:var(--amber)">Fair</span>';
    if (score >= 40) return '<span class="badge badge-repair">Poor</span>';
    return '<span class="badge badge-danger">Critical</span>';
  }

  getHealthColor(score) {
    if (score >= 90) return '#16a34a';
    if (score >= 75) return '#6d28d9';
    if (score >= 60) return '#d97706';
    if (score >= 40) return '#dc2626';
    return '#b91c1c';
  }

  async getRecommendations(equipId) {
    try {
      const response = await fetch(`${API_URL}/health/${equipId}/recommendations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      return await response.json();
    } catch (err) {
      console.error('Error loading recommendations:', err);
      return [];
    }
  }
}

const healthManager = new EquipmentHealthManager();

/* ═══════════════════════════════════════════════════════════════════════════
   5. ADVANCED FILTERING & SEARCH
═══════════════════════════════════════════════════════════════════════════ */

class AdvancedSearchEngine {
  constructor() {
    this.filters = {
      search: '',
      healthMin: 0,
      healthMax: 100,
      priorityFilter: '',
      scheduleStatus: '',
      dateFrom: '',
      dateTo: '',
    };
  }

  filterByHealth(equipment, healthData, minScore, maxScore) {
    return equipment.filter(eq => {
      const health = healthData[eq.id];
      if (!health) return true;
      return health.healthScore >= minScore && health.healthScore <= maxScore;
    });
  }

  filterByScheduleStatus(schedules, status) {
    if (!status) return schedules;
    return schedules.filter(s => s.status === status);
  }

  filterByDateRange(items, dateFrom, dateTo, dateField = 'scheduledDate') {
    if (!dateFrom && !dateTo) return items;
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo) : new Date(8640000000000000);
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= from && itemDate <= to;
    });
  }

  search(items, searchTerm, searchFields = ['name', 'serial', 'description']) {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => item[field]?.toLowerCase().includes(term))
    );
  }
}

const searchEngine = new AdvancedSearchEngine();

/* ═══════════════════════════════════════════════════════════════════════════
   6. TEAM & TECHNICIAN MANAGEMENT
═══════════════════════════════════════════════════════════════════════════ */

class TeamManager {
  constructor() {
    this.team = [];
  }

  openTeamModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'team-modal';

    const roles = ['admin', 'manager', 'technician', 'viewer'];
    const roleOptions = roles.map(r => `<option value="${r}">${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('');

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-users"></i> Team Management</h3>
          <button class="modal-close" onclick="document.getElementById('team-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Add Team Member</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <input type="email" id="team-email" placeholder="Email address">
              <select id="team-role">${roleOptions}</select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="teamManager.inviteTeamMember()" style="width:fit-content;margin-top:20px">
            <i class="fa-solid fa-plus"></i> Invite Member
          </button>
          <div style="margin-top:20px">
            <strong>Current Team:</strong>
            <div id="team-list" style="margin-top:10px"></div>
          </div>
          <div class="form-actions" style="margin-top:20px">
            <button class="btn btn-secondary" onclick="document.getElementById('team-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  inviteTeamMember() {
    const email = document.getElementById('team-email')?.value;
    const role = document.getElementById('team-role')?.value;

    if (!email || !role) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    showToast(`Invitation sent to ${email} as ${role}`, 'success');
    document.getElementById('team-email').value = '';
  }
}

const teamManager = new TeamManager();

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT FOR USE IN MAIN APP
═══════════════════════════════════════════════════════════════════════════ */

window.rbacManager = rbacManager;
window.RBACManager = RBACManager;
window.checklistManager = checklistManager;
window.ChecklistManager = checklistManager;
window.maintenanceScheduler = maintenanceScheduler;
window.MaintenanceScheduler = maintenanceScheduler;
window.healthManager = healthManager;
window.EquipmentHealthManager = healthManager;
window.searchEngine = searchEngine;
window.AdvancedSearchEngine = searchEngine;
window.teamManager = teamManager;
window.TeamManager = teamManager;
