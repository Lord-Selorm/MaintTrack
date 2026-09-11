/* ═══════════════════════════════════════════════════════════════════════════
   NEW PAGE RENDERERS: Health, Schedules, Checklists, Team
═══════════════════════════════════════════════════════════════════════════ */

let healthPage = 1;
let schedPage = 1;
let clPage = 1;
let _schedFilterKey = '';

function goHealthPage(p) { healthPage = p; renderHealthPage(); }
function goSchedPage(p) { schedPage = p; renderSchedules(); }
function goClPage(p) { clPage = p; renderChecklists(); }

// ─ Health Page ─
async function renderHealthPage() {
  try {
    const healths = await apiCall('GET', '/health');
    
    // Stats
    const excellent = healths.filter(h => h.status === 'Excellent').length;
    const healthy = healths.filter(h => h.status === 'Healthy').length;
    const fair = healths.filter(h => h.status === 'Fair').length;
    const poor = healths.filter(h => h.status === 'Poor').length;
    const critical = healths.filter(h => h.status === 'Critical').length;
    const avgScore = healths.length > 0 ? Math.round(healths.reduce((s, h) => s + h.healthScore, 0) / healths.length) : 0;

    document.getElementById('health-stats').innerHTML = `
      <div class="metric-card"><div class="metric-label">Average Health</div><div class="metric-value blue">${avgScore}</div></div>
      <div class="metric-card"><div class="metric-label">Excellent (90+)</div><div class="metric-value green">${excellent}</div></div>
      <div class="metric-card"><div class="metric-label">Healthy (75-90)</div><div class="metric-value blue">${healthy}</div></div>
      <div class="metric-card"><div class="metric-label">Fair (60-75)</div><div class="metric-value amber">${fair}</div></div>
      <div class="metric-card"><div class="metric-label">Poor (40-60)</div><div class="metric-value red" style="color:var(--red);">${poor}</div></div>
      <div class="metric-card"><div class="metric-label">Critical (&lt;40)</div><div class="metric-value red" style="color:var(--red);">${critical}</div></div>
    `;

    // Table
    const tbody = document.getElementById('health-table-body');
    const countEl = document.getElementById('health-count');
    if (countEl) countEl.innerHTML = `<i class="fa-solid fa-heart-pulse"></i> ${healths.length} asset${healths.length === 1 ? '' : 's'}`;
    const hp = document.getElementById('health-pager');
    if (!healths.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">No health data available</td></tr>';
      if (hp) hp.innerHTML = '';
      return;
    }

    const p = slicePage(healths, healthPage, 10);
    healthPage = p.page;

    tbody.innerHTML = p.items.map(h => {
      const eq = equipment.find(e => e.id === h.equipId) || {};
      const statusColors = {
        'Excellent': '#16a34a',
        'Healthy': '#6d28d9',
        'Fair': '#d97706',
        'Poor': '#dc2626',
        'Critical': '#b91c1c',
        'Offline': '#64748b'
      };
      return `<tr>
        <td><strong>${escapeHtml(eq.name) || '—'}</strong></td>
        <td><div style="display:flex;align-items:center;gap:8px">
          <div style="width:50px;height:6px;background:var(--surface2);border-radius:3px">
            <div style="width:${h.healthScore}%;height:100%;background:${statusColors[h.status]};border-radius:3px"></div>
          </div>
          <span style="font-weight:600">${h.healthScore}</span>
        </div></td>
        <td><span class="badge" style="background:${statusColors[h.status]}22;color:${statusColors[h.status]}">${h.status}</span></td>
        <td>${h.agePercentage}%</td>
        <td><span class="badge" style="background:${h.failureRiskLevel === 'Low' ? 'var(--green-light)' : h.failureRiskLevel === 'Medium' ? 'var(--amber-light)' : h.failureRiskLevel === 'High' ? 'var(--amber-light)' : 'var(--red-light)'};color:${h.failureRiskLevel === 'Low' ? 'var(--green)' : h.failureRiskLevel === 'Medium' ? 'var(--amber)' : h.failureRiskLevel === 'High' ? 'var(--amber)' : 'var(--red)'}">${h.failureRiskLevel}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="viewHealthRecommendations('${h.equipId}')"><i class="fa-solid fa-lightbulb"></i> View</button>
            <button class="btn btn-primary btn-sm" onclick="adminPanel.scheduleFromHealth('${h.equipId}')" ${(typeof adminPanel !== 'undefined' && adminPanel.canSchedule()) ? '' : 'style="display:none"'}><i class="fa-solid fa-calendar-plus"></i> Schedule</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    renderPager(hp, p.page, p.pages, p.from, p.to, p.total, 'goHealthPage');
  } catch (err) {
    console.error('Error rendering health:', err);
    showToast('Failed to load health data: ' + err.message, 'error');
  }
}

async function viewHealthRecommendations(equipId) {
  try {
    const recommendations = await apiCall('GET', `/health/${equipId}/recommendations`);
    const eq = equipment.find(e => e.id === equipId);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'recommendations-modal';
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-lightbulb"></i> Health Recommendations - ${escapeHtml(eq.name)}</h3>
          <button class="modal-close" onclick="document.getElementById('recommendations-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div style="max-height:600px;overflow-y:auto">
          ${recommendations.length ? recommendations.map(r => `
            <div style="padding:12px;border-left:4px solid ${r.priority === 'Critical' ? 'var(--red)' : r.priority === 'High' ? 'var(--amber)' : 'var(--blue)'};background:${r.priority === 'Critical' ? 'var(--red-light)' : r.priority === 'High' ? 'var(--amber-light)' : 'var(--blue-light)'};margin-bottom:10px;border-radius:var(--radius-sm)">
              <div style="font-weight:600;margin-bottom:4px"><span class="badge" style="background:${r.priority === 'Critical' ? 'var(--red)' : r.priority === 'High' ? 'var(--amber)' : 'var(--blue)'};color:white">${r.priority}</span></div>
              <div style="font-weight:600;margin-bottom:4px">${escapeHtml(r.action)}</div>
              <div style="font-size:12px;color:var(--text2)">${escapeHtml(r.reason)}</div>
            </div>
          `).join('') : '<div class="empty-state"><i class="fa-solid fa-check-circle"></i><p>Equipment is in good condition</p></div>'}
          <div style="margin-top:16px;text-align:center">
            <button class="btn btn-primary" onclick="document.getElementById('recommendations-modal').remove(); adminPanel.scheduleFromHealth('${equipId}')"><i class="fa-solid fa-calendar-plus"></i> Schedule Maintenance</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (err) {
    showToast('Error loading recommendations: ' + err.message, 'error');
  }
}

// ─ Schedules Page ─
async function renderSchedules() {
  try {
    const statusFilter = document.getElementById('schedule-filter-status')?.value || '';
    if (statusFilter !== _schedFilterKey) { _schedFilterKey = statusFilter; schedPage = 1; }
    const schedules = await apiCall('GET', '/schedules' + (statusFilter ? `?status=${statusFilter}` : ''));
    
    const list = document.getElementById('schedules-list');
    const countEl = document.getElementById('sched-count');
    if (countEl) countEl.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${schedules.length} schedule${schedules.length === 1 ? '' : 's'}`;
    const sp = document.getElementById('sched-pager');
    if (!schedules.length) {
      list.innerHTML = '<div class="card"><div class="empty-state"><i class="fa-solid fa-calendar"></i><p>No maintenance schedules</p></div></div>';
      if (sp) sp.innerHTML = '';
      return;
    }

    const p = slicePage(schedules, schedPage, 8);
    schedPage = p.page;

    list.innerHTML = p.items.map(s => {
      const eq = equipment.find(e => e.id === s.equipId) || {};
      const statusColors = { 'Scheduled': '#6d28d9', 'In Progress': '#d97706', 'Completed': '#16a34a', 'Postponed': '#64748b', 'Cancelled': '#dc2626' };
      return `<div class="card" style="margin-bottom:12px;border-left:4px solid ${statusColors[s.status]}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px;margin-bottom:2px">${escapeHtml(eq.name) || 'Unknown'}</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:6px">${escapeHtml(s.description) || 'No description'}</div>
            <div style="display:flex;gap:14px;font-size:12px;color:var(--text3);flex-wrap:wrap">
              <span><i class="fa-solid fa-calendar" style="margin-right:4px"></i>${new Date(s.scheduledDate).toLocaleDateString()}</span>
              <span><i class="fa-solid fa-tag" style="margin-right:4px"></i>${escapeHtml(s.maintenanceType)}</span>
              <span><i class="fa-solid fa-flag" style="margin-right:4px"></i>${escapeHtml(s.priority)}</span>
              ${s.estimatedCost ? `<span><i class="fa-solid fa-coins" style="margin-right:4px"></i>GHS ${Number(s.estimatedCost).toLocaleString('en-GH', {minimumFractionDigits: 2})}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
            <span class="badge" style="background:${statusColors[s.status]}22;color:${statusColors[s.status]}">${s.status}</span>
            <div style="display:flex;gap:6px">
              ${s.status !== 'Completed' ? `<button class="btn btn-primary btn-sm" onclick="maintenanceScheduler.markAsComplete(${s.id})"><i class="fa-solid fa-check"></i></button>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="editSchedule(${s.id})"><i class="fa-solid fa-pencil"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteSchedule(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    renderPager(sp, p.page, p.pages, p.from, p.to, p.total, 'goSchedPage');
  } catch (err) {
    console.error('Error rendering schedules:', err);
    showToast('Failed to load schedules: ' + err.message, 'error');
  }
}

function showScheduleModal() {
  maintenanceScheduler.openScheduleModal(null, 'Select Equipment');
}

async function editSchedule(id) {
  try {
    const schedules = await apiCall('GET', '/schedules');
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) { showToast('Schedule not found', 'error'); return; }
    
    const eq = equipment.find(e => e.id === schedule.equipId) || {};
    maintenanceScheduler.openScheduleModal(schedule.equipId, eq.name || 'Unknown');
    
    setTimeout(() => {
      const dateEl = document.getElementById('schedule-date');
      const typeEl = document.getElementById('schedule-type');
      const priorityEl = document.getElementById('schedule-priority');
      const costEl = document.getElementById('schedule-cost');
      const descEl = document.getElementById('schedule-description');
      if (dateEl) dateEl.value = schedule.scheduledDate ? new Date(schedule.scheduledDate).toISOString().slice(0,10) : '';
      if (typeEl) typeEl.value = schedule.maintenanceType || 'Maintenance';
      if (priorityEl) priorityEl.value = schedule.priority || 'Normal';
      if (costEl) costEl.value = schedule.estimatedCost || '';
      if (descEl) descEl.value = schedule.description || '';
    }, 100);
  } catch (err) {
    showToast('Error loading schedule: ' + err.message, 'error');
  }
}

async function deleteSchedule(id) {
  if (!confirm('Delete this schedule?')) return;
  try {
    await apiCall('DELETE', `/schedules/${id}`);
    renderSchedules();
  } catch (err) {
    showToast('Error deleting schedule: ' + err.message, 'error');
  }
}

// ─ Checklists Page ─
async function renderChecklists() {
  try {
    const checklists = await apiCall('GET', '/checklists');
    
    const list = document.getElementById('checklists-list');
    const countEl = document.getElementById('cl-count');
    if (countEl) countEl.innerHTML = `<i class="fa-solid fa-clipboard-check"></i> ${checklists.length} checklist${checklists.length === 1 ? '' : 's'}`;
    const cp = document.getElementById('cl-pager');
    if (!checklists.length) {
      list.innerHTML = '<div class="card"><div class="empty-state"><i class="fa-solid fa-list-check"></i><p>No checklists created yet</p></div></div>';
      if (cp) cp.innerHTML = '';
      return;
    }

    const p = slicePage(checklists, clPage, 8);
    clPage = p.page;

    list.innerHTML = p.items.map(c => `<div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px"><i class="fa-solid fa-clipboard-check"></i> ${escapeHtml(c.name)}</div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:6px">${escapeHtml(c.description) || 'Equipment Type: ' + escapeHtml(c.equipmentType)}</div>
          <div style="display:flex;gap:14px;font-size:12px;color:var(--text3)">
            <span><i class="fa-solid fa-list" style="margin-right:4px"></i>${c.items?.length || 0} items</span>
            <span>${c.isTemplate ? '<i class="fa-solid fa-check-circle" style="margin-right:4px"></i>Template' : '<i class="fa-solid fa-check-circle" style="margin-right:4px"></i>Checklist'}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
          <button class="btn btn-primary btn-sm" onclick="useChecklist(${c.id})"><i class="fa-solid fa-check"></i> Use Now</button>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="editChecklist(${c.id})"><i class="fa-solid fa-pencil"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteChecklist(${c.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>`).join('');

    renderPager(cp, p.page, p.pages, p.from, p.to, p.total, 'goClPage');
  } catch (err) {
    console.error('Error rendering checklists:', err);
    showToast('Failed to load checklists: ' + err.message, 'error');
  }
}

function showCreateChecklistModal() {
  const equipmentTypes = [...new Set(equipment.map(e => e.type))];
  const typeOptions = equipmentTypes.map(t => `<option value="${t}">${t}</option>`).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'create-checklist-modal';
  
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3><i class="fa-solid fa-plus"></i> Create Checklist</h3>
        <button class="modal-close" onclick="document.getElementById('create-checklist-modal').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Equipment Type</label>
          <select id="new-checklist-type">${typeOptions}</select>
        </div>
        <div class="form-group">
          <label>Checklist Name</label>
          <input type="text" id="new-checklist-name" placeholder="e.g. AC Unit Monthly Inspection">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="new-checklist-desc" placeholder="Describe this checklist..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('create-checklist-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="createChecklistFromTemplate()"><i class="fa-solid fa-check"></i> Create</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function createChecklistFromTemplate() {
  const type = document.getElementById('new-checklist-type')?.value;
  const name = document.getElementById('new-checklist-name')?.value;
  
  if (!type || !name) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  const result = await checklistManager.createChecklistFromTemplate(type, name);
  if (result) {
    showToast('Checklist created successfully!', 'success');
    document.getElementById('create-checklist-modal')?.remove();
    renderChecklists();
  }
}

async function useChecklist(checklistId) {
  const equipmentOptions = equipment.map(e => `<option value="${e.id}">${e.name} (${e.serial})</option>`).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'use-checklist-modal';
  
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3><i class="fa-solid fa-check"></i> Use Checklist</h3>
        <button class="modal-close" onclick="document.getElementById('use-checklist-modal').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Select Equipment</label>
          <select id="checklist-equipment">${equipmentOptions}</select>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('use-checklist-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="launchChecklistInspection(${checklistId})"><i class="fa-solid fa-check"></i> Start Inspection</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function launchChecklistInspection(checklistId) {
  const equipId = document.getElementById('checklist-equipment')?.value;
  if (!equipId) {
    showToast('Please select equipment', 'warning');
    return;
  }

  const eq = equipment.find(e => e.id === equipId);
  checklistManager.openChecklistModal(equipId, eq.type);
  document.getElementById('use-checklist-modal')?.remove();
}

async function deleteChecklist(id) {
  if (!confirm('Delete this checklist?')) return;
  try {
    await apiCall('DELETE', `/checklists/${id}`);
    renderChecklists();
  } catch (err) {
    showToast('Error deleting checklist: ' + err.message, 'error');
  }
}

async function editChecklist(id) {
  try {
    const checklists = await apiCall('GET', '/checklists');
    const checklist = checklists.find(c => c.id === id);
    if (!checklist) { showToast('Checklist not found', 'error'); return; }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'edit-checklist-modal';
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-pencil"></i> Edit Checklist</h3>
          <button class="modal-close" onclick="document.getElementById('edit-checklist-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Checklist Name</label>
            <input type="text" id="edit-checklist-name" value="${escapeHtml(checklist.name)}">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="edit-checklist-desc">${escapeHtml(checklist.description || '')}</textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('edit-checklist-modal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="saveEditChecklist(${id})"><i class="fa-solid fa-check"></i> Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (err) {
    showToast('Error loading checklist: ' + err.message, 'error');
  }
}

async function saveEditChecklist(id) {
  const name = document.getElementById('edit-checklist-name')?.value;
  const description = document.getElementById('edit-checklist-desc')?.value;
  if (!name) { showToast('Name is required', 'error'); return; }
  try {
    await apiCall('PUT', `/checklists/${id}`, { name, description });
    document.getElementById('edit-checklist-modal')?.remove();
    renderChecklists();
  } catch (err) {
    showToast('Error saving checklist: ' + err.message, 'error');
  }
}

// ─ Team Page ─
async function renderTeam() {
  // Placeholder for team rendering
  // In a real app, this would fetch team members from the API
  const tbody = document.getElementById('team-table-body');
  tbody.innerHTML = `<tr>
    <td>${currentUser?.name || 'You'}</td>
    <td>${currentUser?.email || '—'}</td>
    <td><span class="badge" style="background:var(--blue-light);color:var(--blue)">${currentUser?.role || 'technician'}</span></td>
    <td>${currentUser?.department || '—'}</td>
    <td><span class="badge badge-active">Active</span></td>
    <td><span style="font-size:12px;color:var(--text3)">Owner</span></td>
  </tr>`;
}

// ─ Settings Modal ─
function openSettings() {
  const roles = ['admin', 'manager', 'technician', 'viewer'];
  const roleOptions = roles.map(r => `<option value="${r}" ${rbacManager.userRole === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'settings-modal';
  
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3><i class="fa-solid fa-gear"></i> Settings</h3>
        <button class="modal-close" onclick="document.getElementById('settings-modal').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="form-grid">
        <h4 style="margin-top:10px;margin-bottom:10px">Account Settings</h4>
        <div class="form-group">
          <label>Name</label>
          <input type="text" value="${currentUser?.name || ''}" readonly style="background:var(--surface2);cursor:not-allowed">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" value="${currentUser?.email || ''}" readonly style="background:var(--surface2);cursor:not-allowed">
        </div>
        <div class="form-group">
          <label>Role</label>
          <select id="settings-role" disabled style="background:var(--surface2);cursor:not-allowed">${roleOptions}</select>
          <div style="font-size:11px;color:var(--text3);margin-top:4px"><i class="fa-solid fa-info-circle" style="margin-right:4px"></i>Role is set by administrator</div>
        </div>
        
        <h4 style="margin-top:20px;margin-bottom:10px">Display Preferences</h4>
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
            <input type="checkbox" id="settings-dark-mode" ${darkMode?.isDark ? 'checked' : ''} onchange="darkMode?.toggle()">
            <span>Dark Mode</span>
          </label>
        </div>
        <div class="form-group">
          <label>Sidebar Position</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
            <input type="radio" name="sidebar" value="expanded" ${!sidebarCollapsed ? 'checked' : ''} onchange="if (sidebarCollapsed) toggleSidebar()">
            <span>Expanded</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
            <input type="radio" name="sidebar" value="collapsed" ${sidebarCollapsed ? 'checked' : ''} onchange="if (!sidebarCollapsed) toggleSidebar()">
            <span>Collapsed</span>
          </label>
        </div>
        
        <div class="form-actions" style="margin-top:20px">
          <button class="btn btn-secondary" onclick="document.getElementById('settings-modal').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ─ Initialize new pages on showPage call ─
const originalShowPage = window.showPage;
window.showPage = function(name, skipRender) {
  originalShowPage(name, skipRender);
  if (!skipRender) {
    if (name === 'health') renderHealthPage();
    if (name === 'schedules') renderSchedules();
    if (name === 'checklists') renderChecklists();
    if (name === 'team') renderTeam();
  }
};

// Add new page titles
PAGE_TITLES['health'] = 'Equipment Health Scores';
PAGE_TITLES['schedules'] = 'Maintenance Schedules';
PAGE_TITLES['checklists'] = 'Inspection Checklists';
PAGE_TITLES['team'] = 'Team Management';
