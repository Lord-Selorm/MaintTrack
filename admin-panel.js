/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL MODULE
   ═══════════════════════════════════════════════════════════════════════════
   Features added:
   - Work record approval workflow (approve/reject)
   - Team management (real user CRUD against /api/users)
   - Audit log page with filters
   - Checklist completion history page
   - Editable profile & password settings
   - Favorite equipment toggle
   - Per-equipment QR codes
   - Auto-schedule maintenance from health recommendations
   - Full system backup (JSON download)
   ═══════════════════════════════════════════════════════════════════════════ */

const adminPanel = {

  // ── PAGINATION STATE ───────────────────────────────────────────────────────
  _teamPage: 1,
  _auditPage: 1,
  _auditFilterKey: '',
  _histPage: 1,

  goTeamPage(p) { adminPanel._teamPage = p; adminPanel.renderTeam(); },
  goAuditPage(p) { adminPanel._auditPage = p; adminPanel.renderAuditLog(); },
  goHistPage(p) { adminPanel._histPage = p; adminPanel.renderChecklistHistory(); },

  // ── WORK APPROVAL ──────────────────────────────────────────────────────────
  approvalBadge(status) {
    if (!status || status === 'Pending') return '';
    const cls = status === 'Approved' ? 'badge-approved' : status === 'Rejected' ? 'badge-rejected' : 'badge-plain';
    const icon = status === 'Approved' ? 'fa-circle-check' : status === 'Rejected' ? 'fa-circle-xmark' : '';
    return `<span class="badge ${cls}"><i class="fa-solid ${icon}" style="margin-right:3px"></i>${escapeHtml(status)}</span>`;
  },

  canApprove() {
    return typeof rbacManager !== 'undefined' && rbacManager.hasPermission('canApprove');
  },

  canSchedule() {
    const role = rbacManager?.userRole;
    return role === 'admin' || role === 'manager';
  },

  approveButtons(w) {
    if (!this.canApprove() || !w || (w.approvalStatus && w.approvalStatus !== 'Pending')) return '';
    return `
      <button class="btn btn-primary btn-sm" onclick="adminPanel.setApproval('${w.id}','Approved')" style="padding:2px 8px;font-size:11px;background:var(--green);border:none" title="Approve work"><i class="fa-solid fa-check"></i></button>
      <button class="btn btn-danger btn-sm" onclick="adminPanel.setApproval('${w.id}','Rejected')" style="padding:2px 8px;font-size:11px" title="Reject work"><i class="fa-solid fa-xmark"></i></button>`;
  },

  async setApproval(id, status) {
    try {
      await apiCall('PUT', `/work/${id}/${status === 'Approved' ? 'approve' : 'reject'}`);
      const w = works.find(x => x.id == id);
      if (w) w.approvalStatus = status;
      if (currentDetailId) viewDetail(currentDetailId);
      else renderWorkLog();
      showToast(`Work record ${status.toLowerCase()}`, 'success');
    } catch (err) {
      showToast('Approval failed: ' + err.message, 'error');
    }
  },

  // ── FAVORITES ──────────────────────────────────────────────────────────────
  async toggleFavorite(id, btn) {
    const eq = equipment.find(e => e.id == id);
    if (!eq) return;
    const next = !eq.isFavorite;
    try {
      const updated = await apiCall('PUT', `/equipment/${id}`, { isFavorite: next });
      const idx = equipment.findIndex(e => e.id == id);
      if (idx !== -1) equipment[idx].isFavorite = !!updated.isFavorite;
      if (currentDetailId) viewDetail(currentDetailId);
      else renderEquipTable();
      showToast(next ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  },

  // ── QR CODES ───────────────────────────────────────────────────────────────
  showQR(id, btn) {
    const eq = equipment.find(e => e.id == id);
    if (!eq) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'qr-modal';

    const content = `${window.location.origin}${location.pathname}#equipment/${eq.id}`;

    modal.innerHTML = `
      <div class="modal" style="width:min(360px,90vw);text-align:center">
        <div class="modal-header">
          <h3><i class="fa-solid fa-qrcode"></i> QR Code</h3>
          <button class="modal-close" onclick="document.getElementById('qr-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="padding:20px">
          <div id="qr-canvas" style="display:inline-block;padding:10px;background:white;border-radius:8px"></div>
          <div style="font-weight:600;margin-top:12px">${escapeHtml(eq.name)}</div>
          <div style="font-family:monospace;font-size:12px;color:var(--text3);margin-top:4px">${escapeHtml(eq.serial)}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:16px" onclick="document.getElementById('qr-modal').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById('qr-canvas'), { text: content, width: 180, height: 180 });
      } else {
        document.getElementById('qr-canvas').innerHTML = '<div style="font-size:12px;color:var(--text2)">QR library unavailable</div>';
      }
    } catch (e) {
      document.getElementById('qr-canvas').innerHTML = '<div style="font-size:12px;color:var(--text2)">' + escapeHtml(e.message) + '</div>';
    }
  },

  // ── TEAM MANAGEMENT ────────────────────────────────────────────────────────
  async renderTeam() {
    const tbody = document.getElementById('team-table-body');
    if (!tbody) return;
    try {
      const users = await apiCall('GET', '/users');
      const countEl = document.getElementById('team-count');
      if (countEl) countEl.innerHTML = `<i class="fa-solid fa-users"></i> ${users ? users.length : 0} member${users && users.length === 1 ? '' : 's'}`;
      if (!users || !users.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3)">No team members yet</td></tr>';
        const tp = document.getElementById('team-pager');
        if (tp) tp.innerHTML = '';
        return;
      }
      const { items: pageUsers, page, pages, from, to, total } = slicePage(users, adminPanel._teamPage, 10);
      adminPanel._teamPage = page;
      const roles = ['admin', 'manager', 'technician', 'viewer'];
      tbody.innerHTML = pageUsers.map(u => {
        const roleOptions = roles.map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('');
        const isSelf = currentUser && Number(u.id) === Number(currentUser.id);
        return `<tr>
          <td><strong>${escapeHtml(u.name) || '—'}</strong>${isSelf ? ' <span style="font-size:11px;color:var(--text3)">(you)</span>' : ''}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>
            <select onchange="adminPanel.updateMember('${u.id}','role',this.value)" style="padding:5px 8px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;font-family:inherit" ${isSelf ? 'disabled title="You cannot change your own role"' : ''}>${roleOptions}</select>
          </td>
          <td>${escapeHtml(u.department) || '—'}</td>
          <td>${escapeHtml(u.phone) || '—'}</td>
          <td>
            ${u.isActive
              ? '<span class="badge badge-active">Active</span>'
              : '<span class="badge" style="background:var(--surface2);color:var(--text2)">Disabled</span>'}
          </td>
          <td style="white-space:nowrap">
            ${isSelf ? '<span style="font-size:11px;color:var(--text3)">—</span>' : `
              <button class="btn btn-secondary btn-sm" onclick="adminPanel.openMemberModal('${u.id}')" title="Edit"><i class="fa-solid fa-pencil"></i></button>
              <button class="btn btn-secondary btn-sm" onclick="adminPanel.resetPasswordModal('${u.id}', '${escapeHtml(u.name)}')" title="Reset password"><i class="fa-solid fa-key"></i></button>
              <button class="btn btn-secondary btn-sm" onclick="adminPanel.toggleActive('${u.id}')" title="${u.isActive ? 'Disable account' : 'Enable account'}"><i class="fa-solid ${u.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i></button>
              <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteMember('${u.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `}
</td>
        </tr>`;
      }).join('');

      renderPager(document.getElementById('team-pager'), page, pages, from, to, total, 'goTeamPage');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
    }
  },

  openMemberModal(userId = null) {
    let existing = null;
    if (userId) {
      existing = adminPanel._users?.find(u => u.id == userId) || null;
    }
    const isEdit = !!existing;
    const roles = ['admin', 'manager', 'technician', 'viewer'];
    const roleOptions = roles.map(r => `<option value="${r}" ${existing && existing.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'member-modal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fa-solid fa-users"></i> ${isEdit ? 'Edit Team Member' : 'Add Team Member'}</h3>
          <button class="modal-close" onclick="document.getElementById('member-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="form-grid">
          <div class="form-row-2">
            <div class="form-group"><label>Full Name</label><input id="mem-name" value="${existing ? escapeHtml(existing.name) : ''}" placeholder="e.g. Jane Doe"></div>
            <div class="form-group"><label>Email</label><input id="mem-email" type="email" value="${existing ? escapeHtml(existing.email) : ''}" ${isEdit ? 'readonly style="background:var(--surface2);cursor:not-allowed"' : ''} placeholder="user@company.com"></div>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>Role</label><select id="mem-role">${roleOptions}</select></div>
            <div class="form-group"><label>Department</label><input id="mem-dept" value="${existing ? escapeHtml(existing.department || '') : ''}" placeholder="e.g. Operations"></div>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>Phone</label><input id="mem-phone" value="${existing ? escapeHtml(existing.phone || '') : ''}" placeholder="e.g. +233..."></div>
            <div class="form-group"><label>${isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label><input id="mem-password" type="password" placeholder="${isEdit ? '••••••••' : 'Min 6 characters'}"></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('member-modal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="adminPanel.saveMember(${isEdit ? "'" + existing.id + "'" : 'null'})"><i class="fa-solid fa-floppy-disk"></i> Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async saveMember(id) {
    const name = document.getElementById('mem-name')?.value.trim();
    const email = document.getElementById('mem-email')?.value.trim();
    const role = document.getElementById('mem-role')?.value;
    const department = document.getElementById('mem-dept')?.value.trim();
    const phone = document.getElementById('mem-phone')?.value.trim();
    const password = document.getElementById('mem-password')?.value;

    try {
      if (id) {
        await apiCall('PUT', `/users/${id}`, { name, role, department, phone });
        showToast('Team member updated', 'success');
      } else {
        if (!email || !password) {
          showToast('Email and password are required', 'warning');
          return;
        }
        await apiCall('POST', '/users', { email, password, name, role, department, phone });
        showToast('Team member added', 'success');
      }
      document.getElementById('member-modal')?.remove();
      this.renderTeam();
      this._loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async updateMember(id, field, value) {
    try {
      if (field === 'role') await apiCall('PUT', `/users/${id}`, { role: value });
      showToast('Team member updated', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      this.renderTeam();
    }
  },

  async toggleActive(id) {
    const u = this._users?.find(x => x.id == id);
    if (!u) return;
    try {
      await apiCall('PUT', `/users/${id}`, { isActive: !u.isActive });
      showToast(u.isActive ? 'Account disabled' : 'Account enabled', 'success');
      this.renderTeam();
      this._loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  resetPasswordModal(id, name) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'reset-pw-modal';
    modal.innerHTML = `
      <div class="modal" style="width:min(360px,90vw)">
        <div class="modal-header">
          <h3><i class="fa-solid fa-key"></i> Reset Password</h3>
          <button class="modal-close" onclick="document.getElementById('reset-pw-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="form-grid">
          <div class="form-group"><label>Reset password for ${escapeHtml(name)}</label><input id="reset-pw-input" type="password" placeholder="New password (min 6 chars)"></div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('reset-pw-modal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="adminPanel.resetPassword('${id}')"><i class="fa-solid fa-check"></i> Reset</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async resetPassword(id) {
    const password = document.getElementById('reset-pw-input')?.value;
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    try {
      await apiCall('PUT', `/users/${id}/password`, { password });
      document.getElementById('reset-pw-modal')?.remove();
      showToast('Password reset successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteMember(id) {
    if (!confirm('Delete this team member? This cannot be undone.')) return;
    try {
      await apiCall('DELETE', `/users/${id}`);
      showToast('Team member deleted', 'success');
      this.renderTeam();
      this._loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async _loadUsers() {
    try { this._users = await apiCall('GET', '/users'); } catch (e) { this._users = []; }
  },

  // ── AUDIT LOG ──────────────────────────────────────────────────────────────
  async renderAuditLog() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;
    const action = document.getElementById('audit-filter-action')?.value || '';
    const entity = document.getElementById('audit-filter-entity')?.value || '';
    try {
      const qs = new URLSearchParams();
      if (action) qs.set('action', action);
      if (entity) qs.set('entityType', entity);
      const fkey = action + '|' + entity;
      if (fkey !== adminPanel._auditFilterKey) { adminPanel._auditFilterKey = fkey; adminPanel._auditPage = 1; }
      const logs = await apiCall('GET', '/audit' + (qs.toString() ? `?${qs.toString()}` : ''));
      const countEl = document.getElementById('audit-count');
      if (countEl) countEl.innerHTML = `<i class="fa-solid fa-user-shield"></i> ${logs ? logs.length : 0} entr${logs && logs.length === 1 ? 'y' : 'ies'}`;
      const ap = document.getElementById('audit-pager');
      if (!logs || !logs.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">No audit entries found</td></tr>';
        if (ap) ap.innerHTML = '';
        return;
      }
      const { items: pageLogs, page, pages, from, to, total } = slicePage(logs, adminPanel._auditPage, 15);
      adminPanel._auditPage = page;
      const actionBadges = {
        CREATE: 'badge-approved', UPDATE: 'badge-blue', DELETE: 'badge-rejected', VIEW: 'badge-plain',
      };
      tbody.innerHTML = pageLogs.map(l => {
        let detail = '';
        const newVal = l.newValues || {};
        if (l.entityType === 'EQUIPMENT') detail = newVal.name ? `Name: ${escapeHtml(newVal.name)}` : (l.entityId ? `#${l.entityId}` : '');
        else if (l.entityType === 'WORK') detail = newVal.desc ? escapeHtml(String(newVal.desc).slice(0, 60)) : (l.entityId ? `#${l.entityId}` : '');
        else if (l.entityType === 'USER') detail = newVal.email ? escapeHtml(newVal.email) : (newVal.passwordReset ? 'Password reset' : (l.entityId ? `#${l.entityId}` : ''));
        else detail = l.entityId ? `#${l.entityId}` : '';
        return `<tr>
          <td style="white-space:nowrap;font-size:12px">${new Date(l.createdAt).toLocaleString()}</td>
          <td>${escapeHtml(l.userName) || escapeHtml(l.user?.name) || escapeHtml(l.user?.email) || 'System'}</td>
          <td><span class="badge ${actionBadges[l.action] || 'badge-plain'}">${escapeHtml(l.action)}</span></td>
          <td><span class="badge badge-plain">${escapeHtml(l.entityType)}</span></td>
          <td>${l.entityId || '—'}</td>
          <td style="font-size:12px;color:var(--text2);max-width:280px">${detail || '<span style="color:var(--text3)">—</span>'}</td>
        </tr>`;
}).join('');
      renderPager(ap, page, pages, from, to, total, 'goAuditPage');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
    }
  },

  // ── CHECKLIST HISTORY ──────────────────────────────────────────────────────
  async renderChecklistHistory() {
    const tbody = document.getElementById('checklist-history-body');
    if (!tbody) return;
    try {
      const completions = await apiCall('GET', '/checklists/completions/list');
      const countEl = document.getElementById('hist-count');
      if (countEl) countEl.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${completions ? completions.length : 0} completion${completions && completions.length === 1 ? '' : 's'}`;
      const hp = document.getElementById('hist-pager');
      if (!completions || !completions.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3)">No checklist completions yet</td></tr>';
        if (hp) hp.innerHTML = '';
        return;
      }
      const { items: pageItems, page, pages, from, to, total } = slicePage(completions, adminPanel._histPage, 8);
      adminPanel._histPage = page;
      tbody.innerHTML = pageItems.map(c => {
        const eq = equipment.find(e => e.id == c.equipId) || {};
        let issues = '';
        if (Array.isArray(c.issuesFound) && c.issuesFound.length) {
          issues = c.issuesFound.map(i => escapeHtml(typeof i === 'string' ? i : (i?.name || i?.label || ''))).filter(Boolean).slice(0, 3).join(', ');
        }
        return `<tr>
          <td style="white-space:nowrap;font-size:12px">${c.completedDate ? String(c.completedDate).slice(0, 16).replace('T', ' ') : '—'}</td>
          <td>${escapeHtml(c.name) || `Checklist #${c.checklistId}`}</td>
          <td>${escapeHtml(eq.name) || ('#' + c.equipId)}</td>
          <td>${escapeHtml(c.completedBy) || (c.userId ? '#' + c.userId : '—')}</td>
          <td>${c.itemsCompleted || 0}/${c.totalItems || 0}</td>
          <td>${c.completionPercentage || 0}%</td>
          <td style="font-size:12px;color:var(--text2);max-width:200px">${issues || '<span style="color:var(--text3)">None</span>'}</td>
        </tr>`;
      }).join('');

      renderPager(hp, page, pages, from, to, total, 'goHistPage');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red)">${escapeHtml(err.message)}</td></tr>`;
    }
  },

  // ── BACKUP ─────────────────────────────────────────────────────────────────
  async downloadBackup() {
    try {
      const response = await fetch(`${API_URL}/backup/download`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Backup failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Backup downloaded', 'success');
    } catch (err) {
      showToast('Backup failed: ' + err.message, 'error');
    }
  },

  // ── AUTO-SCHEDULE FROM HEALTH ──────────────────────────────────────────────
  async scheduleFromHealth(equipId) {
    const eq = equipment.find(e => e.id == equipId);
    if (!eq) return;
    if (!this.canSchedule()) {
      showToast('You do not have permission to schedule maintenance', 'warning');
      return;
    }
    try {
      const recommendations = await apiCall('GET', `/health/${equipId}/recommendations`).catch(() => []);
      const health = await apiCall('GET', `/health/${equipId}`).catch(() => null);
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const priority = health?.failureRiskLevel === 'Critical' || health?.failureRiskLevel === 'High' ? 'High' : 'Normal';

      const modal = document.createElement('div');
      modal.className = 'modal-overlay open';
      modal.id = 'hs-modal';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fa-solid fa-calendar-plus"></i> Schedule Maintenance</h3>
            <button class="modal-close" onclick="document.getElementById('hs-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Equipment</label>
              <input value="${escapeHtml(eq.name)} (${escapeHtml(eq.serial)})" readonly style="background:var(--surface2);cursor:not-allowed">
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Date *</label><input type="date" id="hs-date" value="${defaultDate}"></div>
              <div class="form-group"><label>Type</label>
                <select id="hs-type"><option>Preventive</option><option>Maintenance</option><option>Inspection</option><option>Repair</option></select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Priority</label>
                <select id="hs-priority"><option>Low</option><option>Normal</option><option value="High" ${priority === 'High' ? 'selected' : ''}>High</option><option>Critical</option></select>
              </div>
              <div class="form-group"><label>Estimated Cost (GHS)</label><input type="number" id="hs-cost" value="0" min="0"></div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="hs-desc" placeholder="What needs to be done?">${recommendations.length ? escapeHtml(recommendations[0].action) : ''}</textarea>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" onclick="document.getElementById('hs-modal').remove()">Cancel</button>
              <button class="btn btn-primary" onclick="adminPanel.createScheduleFromHealth('${equipId}')"><i class="fa-solid fa-check"></i> Create Schedule</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async createScheduleFromHealth(equipId) {
    const date = document.getElementById('hs-date')?.value;
    const type = document.getElementById('hs-type')?.value;
    const priority = document.getElementById('hs-priority')?.value;
    const cost = document.getElementById('hs-cost')?.value;
    const desc = document.getElementById('hs-desc')?.value;

    if (!date) {
      showToast('Please select a date', 'warning');
      return;
    }
    try {
      await apiCall('POST', '/schedules', {
        equipId,
        scheduledDate: date,
        maintenanceType: type,
        priority,
        description: desc || 'Scheduled from health recommendation',
        estimatedCost: Number(cost) || 0,
      });
      document.getElementById('hs-modal')?.remove();
      showToast('Maintenance scheduled successfully', 'success');
      if (currentDetailId) viewDetail(currentDetailId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS MODAL (editable profile + password change)
// ═══════════════════════════════════════════════════════════════════════════
function openSettings() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'settings-modal';

  modal.innerHTML = `
    <div class="modal" style="width:min(720px,94vw)">
      <div class="modal-header">
        <h3><i class="fa-solid fa-gear"></i> Settings</h3>
        <button class="modal-close" onclick="document.getElementById('settings-modal').remove()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div style="max-height:70vh;overflow:auto">
        <div class="settings-group">
          <h4><i class="fa-solid fa-user"></i> Profile</h4>
          <div class="form-row-2">
            <div class="form-group"><label>Name</label><input type="text" id="set-name" value="${currentUser?.name ? escapeHtml(currentUser.name) : ''}"></div>
            <div class="form-group"><label>Email</label><input type="email" value="${currentUser?.email ? escapeHtml(currentUser.email) : ''}" readonly style="background:var(--surface2);cursor:not-allowed"></div>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>Department</label><input type="text" id="set-dept" value="${currentUser?.department ? escapeHtml(currentUser.department) : ''}" placeholder="e.g. Operations"></div>
            <div class="form-group"><label>Phone</label><input type="text" id="set-phone" value="${currentUser?.phone ? escapeHtml(currentUser.phone) : ''}" placeholder="e.g. +233..."></div>
          </div>
          <div class="form-group">
            <label>Role</label>
            <input value="${currentUser?.role ? escapeHtml(currentUser.role) : ''}" readonly style="background:var(--surface2);cursor:not-allowed">
            <div class="field-hint"><i class="fa-solid fa-info-circle"></i>Role is set by administrator</div>
          </div>
          <div class="set-actions">
            <button class="btn btn-primary btn-sm" onclick="adminPanel.saveProfile()"><i class="fa-solid fa-floppy-disk"></i> Save Profile</button>
          </div>
        </div>

        <div class="settings-group">
          <h4><i class="fa-solid fa-lock"></i> Password</h4>
          <div class="form-row-2">
            <div class="form-group"><label>Current Password</label><input type="password" id="set-cur-pw" autocomplete="current-password"></div>
            <div class="form-group"><label>New Password</label><input type="password" id="set-new-pw" autocomplete="new-password" placeholder="Min 6 characters"></div>
          </div>
          <div class="set-actions">
            <button class="btn btn-secondary btn-sm" onclick="adminPanel.changePassword()"><i class="fa-solid fa-key"></i> Update Password</button>
          </div>
        </div>

        <div class="settings-group">
          <h4><i class="fa-solid fa-sliders"></i> Display</h4>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
              <input type="checkbox" id="settings-dark-mode" ${darkMode?.isDark ? 'checked' : ''} onchange="darkMode?.toggle()">
              <span>Dark Mode</span>
            </label>
          </div>
          <div class="form-group">
            <label style="margin-bottom:6px">Sidebar Position</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
              <input type="radio" name="sidebar" value="expanded" ${!sidebarCollapsed ? 'checked' : ''} onchange="if (sidebarCollapsed) toggleSidebar()">
              <span>Expanded</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
              <input type="radio" name="sidebar" value="collapsed" ${sidebarCollapsed ? 'checked' : ''} onchange="if (!sidebarCollapsed) toggleSidebar()">
              <span>Collapsed</span>
            </label>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:18px">
          <button class="btn btn-secondary" onclick="document.getElementById('settings-modal').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

adminPanel.saveProfile = async function () {
  const name = document.getElementById('set-name')?.value.trim();
  const department = document.getElementById('set-dept')?.value.trim();
  const phone = document.getElementById('set-phone')?.value.trim();
  try {
    const updated = await apiCall('PUT', '/auth/me', { name, department, phone });
    if (currentUser) Object.assign(currentUser, updated);
    showToast('Profile updated', 'success');
    document.getElementById('settings-modal')?.remove();
  } catch (err) {
    showToast('Profile update failed: ' + err.message, 'error');
  }
};

adminPanel.changePassword = async function () {
  const currentPassword = document.getElementById('set-cur-pw')?.value;
  const newPassword = document.getElementById('set-new-pw')?.value;
  if (!currentPassword || !newPassword) {
    showToast('Fill in both password fields', 'warning');
    return;
  }
  try {
    await apiCall('PUT', '/auth/me/password', { currentPassword, newPassword });
    document.getElementById('set-cur-pw').value = '';
    document.getElementById('set-new-pw').value = '';
    showToast('Password updated', 'success');
  } catch (err) {
    showToast('Password change failed: ' + err.message, 'error');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WIRE NEW PAGES INTO showPage
// ═══════════════════════════════════════════════════════════════════════════
function renderTeam() { adminPanel.renderTeam(); }

const _prevShowPage = window.showPage;
window.showPage = function (name, skipRender) {
  _prevShowPage(name, skipRender);
  if (!skipRender) {
    if (name === 'audit') adminPanel.renderAuditLog();
    if (name === 'checklist-history') adminPanel.renderChecklistHistory();
  }
};

// Load team members when app starts (for admin cross-reference)
try {
  if (typeof rbacManager !== 'undefined' && rbacManager.hasPermission('canManageUsers')) {
    adminPanel._loadUsers();
  }
} catch (e) { /* ignore */ }

window.adminPanel = adminPanel;