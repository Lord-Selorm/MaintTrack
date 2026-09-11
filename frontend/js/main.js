
const API_URL = '/api';
let authToken = null;
let currentUser = null;
let equipment = [];
let works = [];
let editingEquipId = null;
let currentDetailId = null;
let authMode = 'login';
let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" style="font-size:16px"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, duration);
}

/* ═══════════════════════════════════════════════
   INITIALIZATION
═══════════════════════════════════════════════ */
function init() {
  authToken = localStorage.getItem('auth_token');
  if (authToken) {
    showApp();
    refreshCurrentUser().then(loadData);
  } else {
    showAuthScreen();
  }
}

function setGreeting() {
  const el = document.querySelector('[data-dash-greeting]');
  if (!el) return;
  const h = new Date().getHours();
  const g = h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  el.textContent = window.currentUser && window.currentUser.name ? `${g}, ${window.currentUser.name.split(' ')[0]}` : g + ', welcome';
}

async function refreshCurrentUser() {
  try {
    const user = await apiCall('GET', '/auth/me');
    currentUser = user;
    if (rbacManager) rbacManager.setRole(user.role);
    return user;
  } catch (err) {
    return null;
  }
}

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('sidebar').style.display = 'none';
  switchAuthMode('login');
  // Try to show seed/admin credentials for development convenience, with fallback if backend is still starting
  try { fetchSeedInfo(); } catch(e) { /* ignore */ }
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';
  document.getElementById('sidebar').style.display = 'flex';
  if (sidebarCollapsed) {
    applySidebarCollapsed();
  }
}

/* ═══════════════════════════════════════════════
   SIDEBAR TOGGLE
═══════════════════════════════════════════════ */
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  
  if (sidebarCollapsed) {
    applySidebarCollapsed();
  } else {
    applySidebarExpanded();
  }
}

function applySidebarCollapsed() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('page-main');
  const toggle = document.querySelector('.sidebar-toggle i');
  
  sidebar.classList.add('collapsed');
  main.classList.add('collapsed');
  toggle.classList.remove('fa-chevron-left');
  toggle.classList.add('fa-chevron-right');
}

function applySidebarExpanded() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('page-main');
  const toggle = document.querySelector('.sidebar-toggle i');
  
  sidebar.classList.remove('collapsed');
  main.classList.remove('collapsed');
  toggle.classList.remove('fa-chevron-right');
  toggle.classList.add('fa-chevron-left');
}

/* ═══════════════════════════════════════════════
   AUTHENTICATION
═══════════════════════════════════════════════ */
function switchAuthMode(mode) {
  authMode = mode;
  document.getElementById('auth-login-btn').style.opacity = mode === 'login' ? '1' : '0.5';
  document.getElementById('auth-register-btn').style.opacity = mode === 'register' ? '1' : '0.5';
const form = document.getElementById('auth-form');
  if (mode === 'login') {
    form.innerHTML = `
      <div class="form-group" style="margin-bottom:12px"><label for="auth-email">Email</label><input type="email" id="auth-email" name="email" autocomplete="email" placeholder="your@email.com"></div>
      <div class="form-group" style="margin-bottom:16px"><label for="auth-password">Password</label><input type="password" id="auth-password" name="password" autocomplete="current-password" placeholder="••••••••"></div>
      <button type="button" class="btn btn-primary" onclick="doLogin()" style="width:100%" aria-label="Log in to the system"><i class="fa-solid fa-sign-in"></i> Login</button>
    `;
  } else {
    form.innerHTML = `
      <div class="form-group" style="margin-bottom:12px"><label for="auth-name">Name</label><input type="text" id="auth-name" name="name" autocomplete="name" placeholder="Your Name"></div>
      <div class="form-group" style="margin-bottom:12px"><label for="auth-email">Email</label><input type="email" id="auth-email" name="email" autocomplete="email" placeholder="your@email.com"></div>
      <div class="form-group" style="margin-bottom:16px"><label for="auth-password">Password</label><input type="password" id="auth-password" name="password" autocomplete="new-password" placeholder="••••••••"></div>
      <button type="button" class="btn btn-primary" onclick="doRegister()" style="width:100%" aria-label="Create a new account"><i class="fa-solid fa-user-plus"></i> Create Account</button>
    `;
  }
  const onAuthKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (authMode === 'login') doLogin();
    else doRegister();
  };
  ['auth-email', 'auth-password', 'auth-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onkeydown = onAuthKey;
  });
}

async function doLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showToast('Email and password are required', 'warning'); return; }
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    authToken = data.token;
    localStorage.setItem('auth_token', authToken);
    currentUser = data.user;
    if (rbacManager) rbacManager.setRole(data.user.role);
    showApp();
    loadData();
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
}

async function doRegister() {
  const name = document.getElementById('auth-name').value.trim();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showToast('Email and password are required', 'warning'); return; }
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    authToken = data.token;
    localStorage.setItem('auth_token', authToken);
    currentUser = data.user;
    if (rbacManager) rbacManager.setRole(data.user.role);
    showApp();
    loadData();
  } catch (err) {
    showToast('Registration failed: ' + err.message, 'error');
  }
}

async function fetchSeedInfo(attempt = 0) {
  const box = document.getElementById('seed-info');
  const fallbackInfo = {
    adminEmail: 'admin@example.com',
    adminPassword: 'admin123'
  };

  const renderSeedInfo = (info) => {
    box.style.display = 'block';
    box.innerHTML = `<div style="background:#f7fbff;border:1px solid #dfeeff;padding:10px;border-radius:8px;display:inline-block;text-align:left;">
      <div style="font-weight:600;margin-bottom:6px;color:#1a6fd4">Development admin account</div>
      <div style="font-size:13px;color:#333">Email: <strong>${info.adminEmail}</strong></div>
      <div style="font-size:13px;color:#333;margin-bottom:8px">Password: <strong>${info.adminPassword}</strong></div>
      <div style="font-size:12px;color:#5a6070;margin-bottom:8px">${info.source === 'fallback' ? 'Using default local credentials while the backend is starting.' : 'Credentials loaded from the backend seed data.'}</div>
      <button class="btn btn-secondary btn-sm" onclick="copyAdminCreds('${info.adminEmail}','${info.adminPassword}')">Copy credentials</button>
    </div>`;
  };

try {
    const res = await fetch(`${API_URL}/auth/seed-info`, { cache: 'no-store' });
    if (res.status === 404) return;
    if (!res.ok) throw new Error('Seed info unavailable');
    const info = await res.json();
    if (info?.adminEmail || info?.adminPassword) {
      renderSeedInfo({ ...fallbackInfo, ...info, source: 'backend' });
      return;
    }
    throw new Error('Seed info missing');
  } catch (err) {
    if (attempt < 4) {
      setTimeout(() => fetchSeedInfo(attempt + 1), 1200);
      return;
    }
    renderSeedInfo({ ...fallbackInfo, source: 'fallback' });
  }
}

function copyAdminCreds(email, password) {
  const text = `Email: ${email}\nPassword: ${password}`;
  navigator.clipboard?.writeText(text).then(() => {
    showToast('Credentials copied to clipboard', 'success');
  }).catch(() => {
    showToast('Copy failed — select and copy manually', 'warning', 6000);
  });
}

function logout() {
  confirmDialog('Log out?', 'You will be returned to the login screen.', 'Log out').then(ok => {
    if (!ok) return;
    authToken = null;
    currentUser = null;
    localStorage.removeItem('auth_token');
    location.reload();
  });
}

/* ═══════════════════════════════════════════════
   API FUNCTIONS
═══════════════════════════════════════════════ */
async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

async function loadData() {
  try {
    equipment = await apiCall('GET', '/equipment');
    works = await apiCall('GET', '/work');
    setGreeting();
    renderDashboard();
  } catch (err) {
    console.error('Load failed:', err);
    showToast('Failed to load data: ' + err.message, 'error');
  }
}

async function saveEquipment(data, isNew) {
  try {
    if (isNew) {
      const result = await apiCall('POST', '/equipment', data);
      equipment.push(result);
    } else {
      const result = await apiCall('PUT', `/equipment/${editingEquipId}`, data);
      const idx = equipment.findIndex(e => e.id == editingEquipId);
      if (idx >= 0) equipment[idx] = result;
    }
    renderEquipTable();
    renderDashboard();
  } catch (err) {
    showToast('Failed to save equipment: ' + err.message, 'error');
  }
}

async function deleteEquipment(id) {
  try {
    await apiCall('DELETE', `/equipment/${id}`);
    equipment = equipment.filter(e => e.id !== id);
    works = works.filter(w => w.equipId !== id);
    renderEquipTable();
    renderDashboard();
  } catch (err) {
    showToast('Failed to delete equipment: ' + err.message, 'error');
  }
}

async function saveWork(data) {
  try {
    const result = await apiCall('POST', '/work', data);
    works.push(result);
    if (currentDetailId) viewDetail(currentDetailId);
    else { renderWorkLog(); renderDashboard(); }
  } catch (err) {
    showToast('Failed to save work: ' + err.message, 'error');
  }
}

async function deleteWork(id) {
  try {
    await apiCall('DELETE', `/work/${id}`);
    works = works.filter(w => w.id !== id);
    if (currentDetailId) viewDetail(currentDetailId);
    else renderWorkLog();
  } catch (err) {
    showToast('Failed to delete work: ' + err.message, 'error');
  }
}

/* ═══════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════ */
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  equipment: 'Equipment Registry',
  detail: '',
  worklog: 'Work Log',
  team: 'Team Management',
  audit: 'Audit Log',
  'checklist-history': 'Checklist History',
};

function showPage(name, skipRender) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-' + (name === 'detail' ? 'equipment' : name));
  if (nb) nb.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[name] || 'Detail';
  if (!skipRender) {
    if (name === 'dashboard') renderDashboard();
    if (name === 'equipment') renderEquipTable();
    if (name === 'worklog') { populateWorkLogFilters(); renderWorkLog(); }
  }
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function lifespanPct(eq) {
  const start = new Date(eq.installed);
  const end = new Date(start); end.setFullYear(end.getFullYear() + Number(eq.lifespan));
  const now = new Date();
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

function endDate(eq) {
  const d = new Date(eq.installed); d.setFullYear(d.getFullYear() + Number(eq.lifespan));
  return d.toISOString().slice(0, 10);
}

function equipWorks(id) {
  return works.filter(w => w.equipId === id || w.equipId === Number(id)).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function totalCost(id) {
  return works.filter(w => w.equipId === id || w.equipId === Number(id)).reduce((s, w) => s + Number(w.cost || 0), 0);
}

function fmt(n) { return Number(n).toLocaleString('en-GH', { minimumFractionDigits: 0 }); }

function statusBadge(s) {
  const cls = { Active: 'badge-active', 'Under Repair': 'badge-repair', Inactive: 'badge-inactive' };
  return `<span class="badge ${cls[s] || 'badge-inactive'}">${escapeHtml(s)}</span>`;
}

function workBadge(t) {
  const cls = { Maintenance: 'badge-blue', Repair: 'badge-red', Inspection: 'badge-active' };
  return `<span class="badge ${cls[t] || 'badge-inactive'}">${escapeHtml(t)}</span>`;
}

function progBar(pct) {
  const color = pct >= 85 ? 'var(--red)' : pct >= 60 ? 'var(--amber)' : 'var(--blue)';
  return `<div style="font-size:10px;color:var(--text3);margin-bottom:3px">${pct}%</div>
          <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%;background:${color}"></div></div>`;
}

/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
var dashSpendChart = null;

/* ---------- Pagination helpers ---------- */
function slicePage(list, page, size) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const pg = Math.min(Math.max(1, page), pages);
  return {
    items: list.slice((pg - 1) * size, pg * size),
    page: pg, pages, total,
    from: total ? (pg - 1) * size + 1 : 0,
    to: Math.min(pg * size, total)
  };
}

function renderPager(el, pg, pages, from, to, total, onGo) {
  if (!el) return;
  if (!total || pages <= 0) { el.innerHTML = ''; return; }
  const info = `<span class="pager-info">Showing ${from}\u2013${to} of ${total} ${total === 1 ? 'entry' : 'entries'}</span>`;
  if (pages <= 1) { el.innerHTML = info; return; }
  const goBtn = (p, label, extra) => `<button class="pg-btn ${extra || ''}" ${p < 1 || p > pages ? 'disabled' : ''} onclick="${onGo}(${p})">${label}</button>`;
  const nums = [];
  const push = (p) => { if (p >= 1 && p <= pages && nums.indexOf(p) < 0) nums.push(p); };
  push(1);
  if (pages > 6) {
    if (pg > 3) push(pg - 1);
    push(pg);
    if (pg < pages - 2) push(pg + 1);
    push(pages);
  } else {
    for (let p = 1; p <= pages; p++) push(p);
  }
  let inner = '';
  let last = 0;
  for (const p of nums) {
    if (p - last > 1) inner += '<span class="pg-btn ellipsis">\u2026</span>';
    inner += goBtn(p, p, p === pg ? 'active' : '');
    last = p;
  }
  el.innerHTML = info + '<div class="pager-btns">' + goBtn(pg - 1, '\u2039') + inner + goBtn(pg + 1, '\u203a') + '</div>';
}

var eqPage = 1, wlPage = 1;
var _eqFilterKey = '', _wlFilterKey = '';
function goEqPage(p) { eqPage = p; renderEquipTable(); }
function goWlPage(p) { wlPage = p; renderWorkLog(); }

function renderDashboard() {
  const total = equipment.length;
  const active = equipment.filter(e => e.status === 'Active').length;
  const repair = equipment.filter(e => e.status === 'Under Repair').length;
  const allCost = works.reduce((s, w) => s + Number(w.cost || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthWorks = works.filter(w => (w.date || '').startsWith(thisMonth)).length;
  const avgCost = works.length ? Math.round(allCost / works.length) : 0;
  const typeCount = new Set(equipment.map(e => e.type)).size;
  const pctActive = total ? Math.round(active * 100 / total) : 0;

  document.getElementById('dash-metrics').innerHTML = `
    <div class="metric-card">
      <div class="metric-chip-row"><span class="metric-chip chip-violet"><i class="fa-solid fa-cubes"></i></span></div>
      <div class="metric-label">Total Equipment</div>
      <div class="metric-value">${total}</div>
      <div class="metric-foot"><i class="fa-solid fa-layer-group"></i> ${typeCount} equipment types</div>
    </div>
    <div class="metric-card">
      <div class="metric-chip-row"><span class="metric-chip chip-green"><i class="fa-solid fa-circle-check"></i></span></div>
      <div class="metric-label">Active</div>
      <div class="metric-value green">${active}</div>
      <div class="metric-foot"><i class="fa-solid fa-chart-simple"></i> ${pctActive}% of fleet running</div>
    </div>
    <div class="metric-card">
      <div class="metric-chip-row"><span class="metric-chip chip-amber"><i class="fa-solid fa-triangle-exclamation"></i></span></div>
      <div class="metric-label">Under Repair</div>
      <div class="metric-value amber">${repair}</div>
      <div class="metric-foot"><i class="fa-solid fa-screwdriver-wrench"></i> Currently in the shop</div>
    </div>
    <div class="metric-card">
      <div class="metric-chip-row"><span class="metric-chip chip-blue"><i class="fa-solid fa-clipboard-list"></i></span></div>
      <div class="metric-label">Work Records</div>
      <div class="metric-value">${works.length}</div>
      <div class="metric-foot"><i class="fa-solid fa-calendar-check"></i> ${monthWorks} logged this month</div>
    </div>
    <div class="metric-card">
      <div class="metric-chip-row"><span class="metric-chip chip-red"><i class="fa-solid fa-coins"></i></span></div>
      <div class="metric-label">Total Maint. Cost</div>
      <div class="metric-value sm">GHS ${fmt(allCost)}</div>
      <div class="metric-foot"><i class="fa-solid fa-divide"></i> Avg GHS ${fmt(avgCost)} per record</div>
    </div>
  `;

  const recent = works.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  document.getElementById('dash-recent').innerHTML = recent.length
    ? recent.map((w, idx) => {
        const eq = equipment.find(e => e.id === w.equipId) || {};
        const isLast = idx === recent.length - 1;
        return `<div class="tl-item">
          <div class="tl-rail">
            <div class="tl-dot" style="background:${isLast ? 'var(--blue)' : 'var(--text3)'};box-shadow:0 0 0 3px ${isLast ? 'var(--blue-light)' : 'transparent'}"></div>
            ${isLast ? '' : '<div class="tl-line"></div>'}
          </div>
          <div class="tl-body">
            <div class="tl-title">${escapeHtml(eq.name) || 'Unknown'} ${workBadge(w.type)}</div>
            <div class="tl-sub">${w.desc ? escapeHtml(w.desc.slice(0, 80)) : 'No description'}${w.desc && w.desc.length > 80 ? '&hellip;' : ''}</div>
            <div class="tl-meta">
              <span><i class="fa-solid fa-calendar"></i>${w.date.slice(0, 10)}</span>
              ${w.tech ? `<span><i class="fa-solid fa-user"></i>${escapeHtml(w.tech)}</span>` : ''}
              ${w.cost ? `<span><i class="fa-solid fa-coins"></i>GHS ${fmt(w.cost)}</span>` : ''}
            </div>
          </div>
        </div>`;
      }).join('')
    : '<div class="empty-state"><i class="fa-solid fa-clipboard"></i><p>No work records yet</p></div>';

  const aging = equipment.map(e => ({ ...e, pct: lifespanPct(e) })).sort((a, b) => b.pct - a.pct).slice(0, 5);
  document.getElementById('dash-aging').innerHTML = aging.length
    ? aging.map(e => `<div class="tl-item" style="padding:8px 0">
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <span style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(e.name)}</span>
            <span style="font-size:11.5px;color:var(--text2);flex-shrink:0">${e.pct}% of ${e.lifespan}yr</span>
          </div>
          <div class="prog-wrap" style="margin-top:6px"><div class="prog-bar" style="width:${e.pct}%;background:${e.pct>=85?'var(--red)':e.pct>=60?'var(--amber)':'var(--blue)'}"></div></div>
        </div>
      </div>`).join('')
    : '<div class="empty-state"><i class="fa-solid fa-cubes"></i><p>No equipment added</p></div>';

  const attn = equipment
    .map(e => ({ e, pct: lifespanPct(e), risk: e.status === 'Under Repair' ? 'Under Repair' : (e.pct >= 85 ? 'Aging' : (e.status === 'Inactive' ? 'Inactive' : null)) }))
    .filter(x => x.risk)
    .sort((a, b) => (a.risk === 'Under Repair' ? 0 : 1) - (b.risk === 'Under Repair' ? 0 : 1) || b.pct - a.pct)
    .slice(0, 6);

  document.getElementById('dash-attn').innerHTML = attn.length
    ? attn.map(x => {
        const level = x.risk === 'Under Repair' ? 'var(--amber)' : 'var(--red)';
        return `<div class="attn-item">
          <div class="attn-level" style="background:${level}"></div>
          <div class="attn-body">
            <div class="attn-name">${escapeHtml(x.e.name)}</div>
            <div class="attn-reason"><span class="badge" style="background:${level};color:#fff">${x.risk}</span>${x.e.serial ? `<code style="font-size:10.5px;color:var(--text3)">${escapeHtml(x.e.serial)}</code>` : ''}</div>
          </div>
          <div class="attn-action"><button class="btn btn-secondary btn-sm" onclick="viewDetail('${x.e.id}')">View</button></div>
        </div>`;
      }).join('')
    : '<div class="empty-state"><i class="fa-solid fa-shield-check"></i><p>No urgent issues. Fleet looks healthy.</p></div>';

  const dateChip = document.getElementById('dash-date-chip');
  if (dateChip) dateChip.innerHTML = `<i class="fa-solid fa-calendar-days"></i>${new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;

  const pill = document.getElementById('dash-status-pill');
  if (pill) {
    if (attn.length) {
      pill.className = 'dash-chip ' + (repair ? 'dash-chip-amber' : 'dash-chip-red');
      pill.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>${attn.length} need${attn.length > 1 ? ' attention' : 's attention'}`;
    } else {
      pill.className = 'dash-chip dash-chip-green';
      pill.innerHTML = '<i class="fa-solid fa-circle-check"></i>All systems operational';
    }
  }

  const box = document.getElementById('dash-spend-box');
  if (box) {
    if (dashSpendChart) { dashSpendChart.destroy(); dashSpendChart = null; }
    const months = {};
    works.forEach(w => {
      const m = (w.date || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(m)) return;
      months[m] = (months[m] || 0) + Number(w.cost || 0);
    });
    const keys = Object.keys(months).sort().slice(-6);
    if (!keys.length) {
      box.innerHTML = '<div class="empty-state"><i class="fa-solid fa-chart-line"></i><p>No spend data yet</p></div>';
    } else {
      box.innerHTML = '<canvas id="dash-spend-canvas"></canvas>';
      const labels = keys.map(k => {
        const [y, mo] = k.split('-');
        return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, { month: 'short' }) + " '" + y.slice(2);
      });
      const data = keys.map(k => months[k]);
      const ctx = document.getElementById('dash-spend-canvas');
      dashSpendChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Maintenance spend', data, borderColor: '#6d28d9', backgroundColor: 'rgba(109,40,217,0.12)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#6d28d9' }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#e3e5ea' }, ticks: { color: '#98a0ad', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#98a0ad', font: { size: 10 } } }
          }
        }
      });
    }
  }
}

/* ═══════════════════════════════════════════════
   EQUIPMENT TABLE
═══════════════════════════════════════════════ */
function renderEquipTable() {
  const search = (document.getElementById('eq-search').value || '').toLowerCase();
  const typeF = document.getElementById('eq-filter-type').value;
  const statF = document.getElementById('eq-filter-status').value;

  const fkey = [search, typeF, statF].join('|');
  if (fkey !== _eqFilterKey) { _eqFilterKey = fkey; eqPage = 1; }

  let list = equipment.filter(e => {
    if (typeF && e.type !== typeF) return false;
    if (statF && e.status !== statF) return false;
    if (search && !e.name.toLowerCase().includes(search) && !e.serial.toLowerCase().includes(search)) return false;
    return true;
  });

  const tbody = document.getElementById('equip-tbody');
  const countEl = document.getElementById('eq-count');
  if (countEl) countEl.innerHTML = `<i class="fa-solid fa-cubes"></i> ${list.length} equipment record${list.length === 1 ? '' : 's'}`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>No equipment found</p></div></td></tr>`;
    const ep = document.getElementById('eq-pager');
    if (ep) ep.innerHTML = '';
    return;
  }

  const p = slicePage(list, eqPage, 9);
  eqPage = p.page;

  tbody.innerHTML = p.items.map(eq => {
    const ws = equipWorks(eq.id);
    const pct = lifespanPct(eq);
    return `<tr class="clickable" onclick="viewDetail('${eq.id}')">
      <td style="font-weight:600"><button class="fav-btn ${eq.isFavorite ? 'fav-on' : ''}" onclick="event.stopPropagation(); adminPanel.toggleFavorite('${eq.id}', this)" title="${eq.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"><i class="fa-${eq.isFavorite ? 'solid' : 'regular'} fa-star"></i></button> ${escapeHtml(eq.name)}</td>
      <td style="font-family:monospace;font-size:12px;color:var(--text2)">${escapeHtml(eq.serial)}</td>
      <td>${escapeHtml(eq.type)}</td>
      <td style="color:var(--text2)">${escapeHtml(eq.location) || '—'}</td>
      <td style="color:var(--text2)">${escapeHtml(eq.installed)}</td>
      <td>${statusBadge(eq.status)}</td>
      <td style="font-weight:600;text-align:center">${ws.length}</td>
      <td style="min-width:100px">${progBar(pct)}</td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="downloadEquipmentReport('${eq.id}')" title="Download PDF Report"><i class="fa-solid fa-file-pdf"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="downloadEquipmentReportWord('${eq.id}')" title="Download Word Report"><i class="fa-solid fa-file-word"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="uploadManual('${eq.id}')" title="Upload Manual"><i class="fa-solid fa-file-upload"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="downloadManual('${eq.id}')" title="Download Manual"><i class="fa-solid fa-file-download"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="openEditEquipModal('${eq.id}')" title="Edit"><i class="fa-solid fa-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('equip','${eq.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
  renderPager(document.getElementById('eq-pager'), p.page, p.pages, p.from, p.to, p.total, 'goEqPage');
}

/* ═══════════════════════════════════════════════
   EQUIPMENT DETAIL
═══════════════════════════════════════════════ */
function viewDetail(id) {
  currentDetailId = id;
  const eq = equipment.find(e => e.id == id);
  if (!eq) { showPage('equipment'); return; }
  const ws = equipWorks(id);
  const pct = lifespanPct(eq);
  const cost = totalCost(id);

  document.getElementById('page-title').textContent = eq.name;

  document.getElementById('detail-content').innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="detail-hero">
        <div class="detail-icon"><i class="fa-solid fa-gear"></i></div>
        <div class="detail-meta">
          <div class="detail-name">${escapeHtml(eq.name)}</div>
          <div class="detail-sub">${escapeHtml(eq.type)} &nbsp;·&nbsp; <code style="font-size:12px">${escapeHtml(eq.serial)}</code></div>
          <div class="detail-sub" style="margin-top:3px">${escapeHtml(eq.location || '')}${eq.notes ? ' · ' + escapeHtml(eq.notes) : ''}</div>
        </div>
        <div class="detail-actions">
          ${statusBadge(eq.status)}
          <button class="btn btn-secondary btn-sm" onclick="adminPanel.toggleFavorite(${eq.id}, this)" title="Favorite">
            <i class="fa-${eq.isFavorite ? 'solid' : 'regular'} fa-star" style="color:${eq.isFavorite ? 'var(--amber)' : 'inherit'}"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="adminPanel.showQR(${eq.id}, this)" title="Show QR Code">
            <i class="fa-solid fa-qrcode"></i>
          </button>
          <button class="btn btn-primary btn-sm" onclick="openAddWorkModal('${id}')">
            <i class="fa-solid fa-plus"></i> Log Work
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openEditEquipModal('${id}')">
            <i class="fa-solid fa-pencil"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="uploadManual('${id}')" title="Upload Manual">
            <i class="fa-solid fa-file-upload"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ExcelManager.importFromExcel()" title="Import CSV">
            <i class="fa-solid fa-file-import"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="metrics-grid" style="margin-bottom:16px">
      <div class="metric-card"><div class="metric-label">Installed</div><div class="metric-value sm">${eq.installed}</div></div>
      <div class="metric-card"><div class="metric-label">Warranty Expires</div><div class="metric-value sm">${eq.warrantyExpiration ? eq.warrantyExpiration.slice(0,10) : 'N/A'}</div></div>
      <div class="metric-card"><div class="metric-label">Warranty Terms</div><div class="metric-value blue">${eq.warrantyTerms || 'None'}</div></div>
      <div class="metric-card"><div class="metric-label">Purchase Price</div><div class="metric-value sm">${eq.purchasePrice ? 'GHS ' + fmt(eq.purchasePrice) : 'N/A'}</div></div>
      <div class="metric-card"><div class="metric-label">Work Records</div><div class="metric-value blue">${ws.length}</div></div>
      <div class="metric-card"><div class="metric-label">Total Cost</div><div class="metric-value sm">GHS ${fmt(cost)}</div></div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:13px"><i class="fa-solid fa-hourglass-half" style="color:var(--blue);margin-right:6px"></i>Lifespan Usage — ${pct}% of ${eq.lifespan} years</span>
        <span style="font-size:12px;color:var(--text3)">${eq.installed} → ${endDate(eq)}</span>
      </div>
      <div class="prog-wrap" style="height:14px"><div class="prog-bar" style="width:${pct}%;background:${pct>=85?'var(--red)':pct>=60?'var(--amber)':'var(--blue)'}"></div></div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <span style="font-weight:600;font-size:13px"><i class="fa-solid fa-timeline" style="color:var(--blue);margin-right:6px"></i>Work History (${ws.length} records)</span>
        <button class="btn btn-primary btn-sm" onclick="openAddWorkModal('${id}')"><i class="fa-solid fa-plus"></i> Add</button>
      </div>
      ${ws.length
        ? `<div class="timeline">${ws.slice().reverse().map(w => `
            <div class="tl-item">
              <div class="tl-dot ${w.type}"></div>
              <div class="tl-date">${w.date.slice(0,10)}</div>
              <div class="tl-title">${escapeHtml(w.type)} — ${escapeHtml(w.desc)} ${adminPanel.approvalBadge(w.approvalStatus)}</div>
              <div class="tl-meta">
                ${w.tech ? `<span><i class="fa-solid fa-user" style="margin-right:4px"></i>${escapeHtml(w.tech)}</span>` : ''}
                ${w.dur  ? `<span><i class="fa-solid fa-clock" style="margin-right:4px"></i>${w.dur}h</span>` : ''}
                ${w.cost ? `<span><i class="fa-solid fa-coins" style="margin-right:4px"></i>GHS ${fmt(w.cost)}</span>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); uploadWorkAttachment('${w.id}')" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-paperclip"></i></button>
                ${adminPanel.approveButtons(w)}
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('work','${w.id}')" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-trash"></i></button>
              </div>
              ${w.attachments && w.attachments.length ? `<div style="margin-top:8px;font-size:12px;color:var(--text2)">Attachments: ${w.attachments.map(att => `<a href="#" onclick="event.preventDefault(); event.stopPropagation(); downloadWorkAttachment(${att.id}, ${w.id})">${escapeHtml(att.fileName)}</a>`).join(', ')}</div>` : ''}
            </div>`).join('')}</div>`
        : '<div class="empty-state"><i class="fa-solid fa-clipboard"></i><p>No work records yet — click Add above</p></div>'
      }
    </div>
  `;

  showPage('detail', true);
}

/* ═══════════════════════════════════════════════
   WORK LOG
═══════════════════════════════════════════════ */
function populateWorkLogFilters() {
  const sel = document.getElementById('wl-filter-equip');
  sel.innerHTML = '<option value="">All equipment</option>' +
    equipment.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${escapeHtml(e.serial)})</option>`).join('');
}

function renderWorkLog() {
  const eF = document.getElementById('wl-filter-equip').value;
  const tF = document.getElementById('wl-filter-type').value;
  const mF = document.getElementById('wl-filter-month').value;

  const fkey = [eF, tF, mF].join('|');
  if (fkey !== _wlFilterKey) { _wlFilterKey = fkey; wlPage = 1; }

  let list = works.filter(w => {
    if (eF && w.equipId !== eF) return false;
    if (tF && w.type !== tF) return false;
    if (mF && !w.date.startsWith(mF)) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const el = document.getElementById('worklog-list');
  const countEl = document.getElementById('wl-count');
  if (countEl) countEl.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> ${list.length} record${list.length === 1 ? '' : 's'}`;

  if (!list.length) {
    el.innerHTML = `<div class="card"><div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>No records match your filters</p></div></div>`;
    const wp = document.getElementById('wl-pager');
    if (wp) wp.innerHTML = '';
    return;
  }

  const p = slicePage(list, wlPage, 8);
  wlPage = p.page;

  el.innerHTML = p.items.map(w => {
    const eq = equipment.find(e => e.id == w.equipId) || {};
    return `<div class="card list-card">
      <div class="list-card-main">
        <div class="list-card-name">${escapeHtml(eq.name) || 'Unknown'} <span class="serial">${escapeHtml(eq.serial) || ''}</span></div>
        <div class="list-card-desc">${escapeHtml(w.desc) || 'No description'}</div>
        <div class="list-card-meta">
          <span><i class="fa-solid fa-calendar"></i>${w.date.slice(0, 10)}</span>
          ${w.tech ? `<span><i class="fa-solid fa-user"></i>${escapeHtml(w.tech)}</span>` : ''}
          ${w.dur ? `<span><i class="fa-solid fa-clock"></i>${w.dur}h</span>` : ''}
          ${w.cost ? `<span><i class="fa-solid fa-coins"></i>GHS ${fmt(w.cost)}</span>` : ''}
        </div>
        ${w.attachments && w.attachments.length ? `<div class="list-card-meta" style="margin-top:6px"><span><i class="fa-solid fa-paperclip"></i>${w.attachments.map(att => `<a href="#" onclick="event.preventDefault(); event.stopPropagation(); downloadWorkAttachment(${att.id}, ${w.id})" style="color:var(--blue)">${att.fileName}</a>`).join(' / ')}</span></div>` : ''}
      </div>
      <div class="list-card-side">
        <div style="display:flex;gap:6px;align-items:center">${workBadge(w.type)}${adminPanel.approvalBadge(w.approvalStatus)}</div>
        <span style="font-size:15px;font-weight:700;color:var(--text)">${w.cost ? 'GHS ' + fmt(w.cost) : '<span style="color:var(--text3);font-weight:400;font-size:12px">No cost</span>'}</span>
        <div class="list-card-actions">
          ${adminPanel.approveButtons(w)}
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); uploadWorkAttachment('${w.id}')"><i class="fa-solid fa-paperclip"></i></button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('work','${w.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');

  renderPager(document.getElementById('wl-pager'), p.page, p.pages, p.from, p.to, p.total, 'goWlPage');
}

/* ═══════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════ */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const staticModals = new Set(['equip-modal', 'work-modal']);
  document.querySelectorAll('.modal-overlay.open').forEach(m => {
    if (staticModals.has(m.id)) m.classList.remove('open');
    else m.remove();
  });
});

function formatWarrantyValue(expiration, terms) {
  const parts = [];
  if (expiration) parts.push(expiration.slice(0, 10));
  if (terms) parts.push(terms);
  return parts.join(' / ');
}

function parseWarrantyValue(value) {
  const text = (value || '').trim();
  if (!text) return { expiration: null, terms: null };

  const expirationMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  const termsMatch = text.match(/\b(?:1yr|3yr|5yr|Lifetime)\b/i);

  return {
    expiration: expirationMatch ? expirationMatch[1] : null,
    terms: termsMatch ? termsMatch[0] : null,
  };
}

document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
});

function openAddEquipModal() {
  editingEquipId = null;
  document.getElementById('equip-modal-title').textContent = 'Add Equipment';
  document.getElementById('f-name').value = '';
  document.getElementById('f-serial').value = '';
  document.getElementById('f-type').value = 'AC Unit';
  document.getElementById('f-status').value = 'Active';
  document.getElementById('f-installed').value = new Date().toISOString().slice(0,10);
  document.getElementById('f-lifespan').value = 10;
  document.getElementById('f-price').value = '';
  document.getElementById('f-warranty').value = '';
  document.getElementById('f-location').value = '';
  document.getElementById('f-notes').value = '';
  document.getElementById('equip-modal').classList.add('open');
}

function openEditEquipModal(id) {
  editingEquipId = id;
  const eq = equipment.find(e => e.id == id);
  document.getElementById('equip-modal-title').textContent = 'Edit Equipment';
  document.getElementById('f-name').value = eq.name;
  document.getElementById('f-serial').value = eq.serial;
  document.getElementById('f-type').value = eq.type;
  document.getElementById('f-status').value = eq.status;
  document.getElementById('f-installed').value = eq.installed;
  document.getElementById('f-lifespan').value = eq.lifespan;
  document.getElementById('f-price').value = eq.purchasePrice || '';
  document.getElementById('f-warranty').value = formatWarrantyValue(eq.warrantyExpiration, eq.warrantyTerms);
  document.getElementById('f-location').value = eq.location || '';
  document.getElementById('f-notes').value = eq.notes || '';
  document.getElementById('equip-modal').classList.add('open');
}

function saveEquip() {
  const name = document.getElementById('f-name').value.trim();
  const serial = document.getElementById('f-serial').value.trim();
  if (!name || !serial) { showToast('Equipment name and serial number are required', 'warning'); return; }
  const warranty = parseWarrantyValue(document.getElementById('f-warranty').value);
  const data = {
    name, serial,
    type: document.getElementById('f-type').value,
    status: document.getElementById('f-status').value,
    installed: document.getElementById('f-installed').value || new Date().toISOString().slice(0,10),
    lifespan: parseInt(document.getElementById('f-lifespan').value) || 10,
    purchasePrice: document.getElementById('f-price').value ? parseFloat(document.getElementById('f-price').value) : null,
    warrantyExpiration: warranty.expiration,
    warrantyTerms: warranty.terms,
    location: document.getElementById('f-location').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
  };
  saveEquipment(data, !editingEquipId);
  closeModal('equip-modal');
}

function openAddWorkModal(equipId) {
  const sel = document.getElementById('w-equip');
  sel.innerHTML = equipment.map(e => `<option value="${e.id}">${e.name} (${e.serial})</option>`).join('');
  if (equipId) sel.value = equipId;
  document.getElementById('w-type').value = 'Maintenance';
  document.getElementById('w-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('w-tech').value = '';
  document.getElementById('w-dur').value = 0;
  document.getElementById('w-cost').value = 0;
  document.getElementById('w-desc').value = '';
  document.getElementById('work-modal').classList.add('open');
}

function submitWorkForm() {
  const equipId = document.getElementById('w-equip').value;
  const desc = document.getElementById('w-desc').value.trim();
if (!equipId) { showToast('Please select equipment', 'warning'); return; }
  if (!desc) { showToast('Description is required', 'warning'); return; }
  const data = {
    equipId,
    type: document.getElementById('w-type').value,
    date: document.getElementById('w-date').value || new Date().toISOString().slice(0,10),
    tech: document.getElementById('w-tech').value.trim(),
    dur:  parseFloat(document.getElementById('w-dur').value) || 0,
    cost: parseFloat(document.getElementById('w-cost').value) || 0,
    desc,
  };
  saveWork(data);
  closeModal('work-modal');
}

/* ═══════════════════════════════════════════════
   DELETE CONFIRM
═══════════════════════════════════════════════ */
function confirmDialog(title, message, okLabel = 'Delete', danger = true) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = message;
    const ok = document.getElementById('confirm-ok');
    ok.textContent = okLabel;
    ok.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    const finish = (val) => {
      closeConfirm();
      ok.onclick = null;
      const cancel = document.getElementById('confirm-cancel');
      cancel.onclick = null;
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onKey = (e) => { if (e.key === 'Escape') finish(false); };
    ok.onclick = () => finish(true);
    document.getElementById('confirm-cancel').onclick = () => finish(false);
    document.addEventListener('keydown', onKey);
    overlay.classList.add('open');
  });
}

async function confirmDelete(type, id) {
  if (type === 'equip') {
    const eq = equipment.find(e => e.id == id);
    const ok = await confirmDialog('Delete Equipment?', `"${eq.name}" and all its work records (${equipWorks(id).length}) will be permanently deleted.`);
    if (!ok) return;
    deleteEquipment(id);
    if (currentDetailId === id) { currentDetailId = null; showPage('equipment'); }
  } else {
    const ok = await confirmDialog('Delete Work Record?', 'This work record will be permanently deleted.');
    if (!ok) return;
    deleteWork(id);
  }
}
function closeConfirm() { document.getElementById('confirm-overlay').classList.remove('open'); }

/* ═══════════════════════════════════════════════
   REPORT GENERATION
═══════════════════════════════════════════════ */
async function downloadEquipmentReport(equipId) {
  try {
    const report = await apiCall('GET', `/reports/${equipId}`);
    generatePDF(report);
  } catch (err) {
    showToast('Failed to generate report: ' + err.message, 'error');
  }
}

async function downloadAllReports() {
  try {
    const report = await apiCall('GET', '/reports/all');
    generatePDF(report);
  } catch (err) {
    showToast('Failed to generate report: ' + err.message, 'error');
  }
}

async function printEquipmentReport(equipId) {
  try {
    const report = await apiCall('GET', `/reports/${equipId}`);
    printReport(report);
  } catch (err) {
    showToast('Failed to generate report: ' + err.message, 'error');
  }
}

function generatePDF(report) {
  const html = generateReportHTML(report);
  const element = document.createElement('div');
  element.innerHTML = html;
  element.style.display = 'none';
  document.body.appendChild(element);
  
  const opt = {
    margin: 10,
    filename: `${report.title.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  // Check if html2pdf is available
  if (typeof html2pdf !== 'undefined') {
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  } else {
    // Fallback: download as HTML
    downloadAsHTML(html, report.title);
    document.body.removeChild(element);
  }
}

function printReport(report) {
  const html = generateReportHTML(report);
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

function generateReportHTML(report) {
  if (report.equipment && Array.isArray(report.equipment)) {
    // All equipment report
    return generateAllEquipmentReportHTML(report);
  } else {
    // Single equipment report
    return generateSingleEquipmentReportHTML(report);
  }
}

function generateSingleEquipmentReportHTML(report) {
  const eq = report.equipment;
  const sum = report.summary;
  const works = report.works || [];
  
  let html = `
    <html>
    <head>
      <meta charset="UTF-8">
<style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { border-bottom: 3px solid #1a6fd4; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { margin: 0; color: #1a6fd4; }
        .subheader { font-size: 12px; color: #666; margin-top: 5px; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; font-size: 14px; background: #f0f2f5; padding: 8px 12px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f2f5; font-weight: bold; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .summary-item { background: #f9f9f9; padding: 12px; border-left: 3px solid #1a6fd4; }
        .summary-label { font-size: 12px; color: #666; font-weight: bold; }
        .summary-value { font-size: 18px; color: #1a6fd4; font-weight: bold; margin-top: 5px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; }
        .badge-active { background: #e6f5ec; color: #1e8a4a; }
        .badge-repair { background: #fef3e0; color: #c47a12; }
        .footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Equipment Maintenance Report</h1>
        <div class="subheader">Generated on ${report.generatedDate}</div>
      </div>

      <div class="section">
        <div class="section-title">Equipment Details</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Equipment Name</div>
            <div class="summary-value">${eq.name}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Serial Number</div>
            <div class="summary-value" style="font-family:monospace;font-size:14px">${eq.serial}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Type</div>
            <div class="summary-value">${eq.type}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Status</div>
            <div class="summary-value"><span class="badge ${eq.status === 'Active' ? 'badge-active' : eq.status === 'Under Repair' ? 'badge-repair' : ''}">${eq.status}</span></div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Location</div>
            <div class="summary-value">${eq.location || 'Not specified'}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Installed Date</div>
            <div class="summary-value">${eq.installed}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Maintenance Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Work Records</div>
            <div class="summary-value">${sum.totalWorks}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Maintenance Cost</div>
            <div class="summary-value">GHS ${Number(sum.totalCost).toLocaleString('en-GH', {minimumFractionDigits: 2})}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Cost per Work</div>
            <div class="summary-value">GHS ${sum.averageCostPerWork}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Lifespan Used</div>
            <div class="summary-value">${report.lifespanPercentage}% of ${eq.lifespan} years</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Estimated End Date</div>
            <div class="summary-value">${report.estimatedEndDate}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Work Breakdown</div>
            <div style="font-size: 12px; margin-top: 5px;">
              Maintenance: ${sum.maintenanceCount} | Repair: ${sum.repairCount} | Inspection: ${sum.inspectionCount}
            </div>
          </div>
        </div>
      </div>

      ${works.length > 0 ? `
      <div class="section">
        <div class="section-title">Recent Work Records</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Technician</th>
              <th>Duration (hrs)</th>
              <th>Cost (GHS)</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${works.slice(0, 20).map(w => `
            <tr>
              <td>${w.date}</td>
              <td>${w.type}</td>
              <td>${w.tech || '—'}</td>
              <td>${w.dur}</td>
              <td>${Number(w.cost || 0).toLocaleString('en-GH', {minimumFractionDigits: 2})}</td>
              <td>${w.desc.substring(0, 50)}${w.desc.length > 50 ? '...' : ''}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <p>This report was automatically generated by MaintTrack Equipment Maintenance System</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

function generateAllEquipmentReportHTML(report) {
  const equipmentList = report.equipment || [];
  const sum = report.summary;
  
  let html = `
    <html>
    <head>
      <meta charset="UTF-8">
<style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { border-bottom: 3px solid #1a6fd4; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { margin: 0; color: #1a6fd4; }
        .subheader { font-size: 12px; color: #666; margin-top: 5px; }
        .section { margin: 20px 0; page-break-inside: avoid; }
        .section-title { font-weight: bold; font-size: 14px; background: #f0f2f5; padding: 8px 12px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #f0f2f5; font-weight: bold; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .summary-item { background: #f9f9f9; padding: 10px; border-left: 3px solid #1a6fd4; text-align: center; }
        .summary-label { font-size: 11px; color: #666; font-weight: bold; }
        .summary-value { font-size: 16px; color: #1a6fd4; font-weight: bold; margin-top: 3px; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; }
        .badge-active { background: #e6f5ec; color: #1e8a4a; }
        .badge-repair { background: #fef3e0; color: #c47a12; }
        .footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 All Equipment Maintenance Report</h1>
        <div class="subheader">Generated on ${report.generatedDate}</div>
      </div>

      <div class="section">
        <div class="section-title">Summary Statistics</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Equipment</div>
            <div class="summary-value">${sum.totalEquipment}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Active</div>
            <div class="summary-value">${sum.active}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Under Repair</div>
            <div class="summary-value">${sum.underRepair}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Work Records</div>
            <div class="summary-value">${sum.totalWorks}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Cost</div>
            <div class="summary-value">GHS ${Number(sum.totalCost).toLocaleString('en-GH', {minimumFractionDigits: 0})}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Equipment Inventory</div>
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Serial</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th>Works</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${equipmentList.map(eq => `
            <tr>
              <td><strong>${eq.name}</strong></td>
              <td style="font-family:monospace;font-size:11px">${eq.serial}</td>
              <td>${eq.type}</td>
              <td>${eq.location || '—'}</td>
              <td><span class="badge ${eq.status === 'Active' ? 'badge-active' : eq.status === 'Under Repair' ? 'badge-repair' : ''}">${eq.status}</span></td>
              <td style="text-align:center">${eq.workCount}</td>
              <td style="text-align:right">GHS ${Number(eq.totalCost).toLocaleString('en-GH', {minimumFractionDigits: 0})}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This report was automatically generated by MaintTrack Equipment Maintenance System</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

function downloadAsHTML(html, filename) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
  element.setAttribute('download', filename.replace(/\s+/g, '_') + '.html');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/* ═══════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════ */
init();
