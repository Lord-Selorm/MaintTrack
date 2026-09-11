# Frontend Migration Guide - API Integration

This guide explains how to update the frontend HTML to use the new backend API instead of localStorage.

## Quick Start

1. **Include the API service in your HTML**
```html
<script src="api-service.js"></script>
```

2. **Update your data calls**

Replace localStorage-based operations with API calls.

## Code Changes

### Before (localStorage)
```javascript
function load() {
  try {
    const e = localStorage.getItem(STORE_E);
    const w = localStorage.getItem(STORE_W);
    if (e) equipment = JSON.parse(e);
    if (w) works = JSON.parse(w);
  } catch (_) {}
  if (!equipment.length) seed();
}

function save() {
  localStorage.setItem(STORE_E, JSON.stringify(equipment));
  localStorage.setItem(STORE_W, JSON.stringify(works));
}
```

### After (API)
```javascript
async function load() {
  try {
    equipment = await api.getEquipment();
    works = await api.getWork();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

async function save() {
  // No longer needed - data is saved automatically via API
}
```

## Complete Migration Example

### Getting Equipment

**Before:**
```javascript
function renderEquipTable() {
  let list = equipment; // from localStorage
  // ... render logic
}
```

**After:**
```javascript
async function renderEquipTable() {
  const search = (document.getElementById('eq-search').value || '').toLowerCase();
  const typeF = document.getElementById('eq-filter-type').value;
  const statF = document.getElementById('eq-filter-status').value;

  try {
    let list = await api.getEquipment({
      search: search,
      type: typeF || undefined,
      status: statF || undefined
    });
    // ... render logic remains the same
  } catch (err) {
    console.error('Failed to load equipment:', err);
    alert('Failed to load equipment list');
  }
}
```

### Adding Equipment

**Before:**
```javascript
function saveEquip() {
  const data = { id: uid(), name, serial, ... };
  equipment.push(data);
  save();
}
```

**After:**
```javascript
async function saveEquip() {
  const data = {
    name: document.getElementById('f-name').value.trim(),
    serial: document.getElementById('f-serial').value.trim(),
    type: document.getElementById('f-type').value,
    status: document.getElementById('f-status').value,
    installed: document.getElementById('f-installed').value,
    lifespan: parseInt(document.getElementById('f-lifespan').value),
    location: document.getElementById('f-location').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
  };

  try {
    if (editingEquipId) {
      await api.updateEquipment(editingEquipId, data);
    } else {
      await api.createEquipment(data);
    }
    closeModal('equip-modal');
    renderEquipTable();
    renderDashboard();
  } catch (err) {
    alert('Error saving equipment: ' + err.message);
  }
}
```

### Logging Work

**Before:**
```javascript
function saveWork() {
  works.push({
    id: uid(), 
    equipId, type, date, tech, dur, cost, desc
  });
  save();
}
```

**After:**
```javascript
async function saveWork() {
  const equipId = document.getElementById('w-equip').value;
  const data = {
    equipId,
    type: document.getElementById('w-type').value,
    date: document.getElementById('w-date').value,
    tech: document.getElementById('w-tech').value.trim(),
    dur: parseFloat(document.getElementById('w-dur').value) || 0,
    cost: parseFloat(document.getElementById('w-cost').value) || 0,
    desc: document.getElementById('w-desc').value.trim(),
  };

  try {
    await api.createWork(data);
    closeModal('work-modal');
    if (currentDetailId) viewDetail(currentDetailId);
    else { renderWorkLog(); renderDashboard(); }
  } catch (err) {
    alert('Error saving work record: ' + err.message);
  }
}
```

### Dashboard Metrics

**Before:**
```javascript
function renderDashboard() {
  const active = equipment.filter(e => e.status === 'Active').length;
  const repair = equipment.filter(e => e.status === 'Under Repair').length;
  const allCost = works.reduce((s, w) => s + Number(w.cost || 0), 0);
  // ... render
}
```

**After:**
```javascript
async function renderDashboard() {
  try {
    const metrics = await api.getDashboardMetrics();
    document.getElementById('dash-metrics').innerHTML = `
      <div class="metric-card">
        <div class="metric-label">Total Equipment</div>
        <div class="metric-value blue">${metrics.totalEquipment}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Active</div>
        <div class="metric-value green">${metrics.active}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Under Repair</div>
        <div class="metric-value amber">${metrics.underRepair}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Work Records</div>
        <div class="metric-value">${metrics.totalWorks}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Maint. Cost</div>
        <div class="metric-value sm">GHS ${fmt(metrics.totalCost)}</div>
      </div>
    `;
    // ... load recent work and aging equipment
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}
```

### Deleting Data

**Before:**
```javascript
function confirmDelete(type, id) {
  if (type === 'equip') {
    equipment = equipment.filter(e => e.id !== id);
    works = works.filter(w => w.equipId !== id);
    save();
  }
}
```

**After:**
```javascript
async function confirmDelete(type, id) {
  try {
    if (type === 'equip') {
      await api.deleteEquipment(id);
      equipment = equipment.filter(e => e.id !== id);
      if (currentDetailId === id) {
        currentDetailId = null;
        showPage('equipment');
      }
    } else {
      await api.deleteWork(id);
      works = works.filter(w => w.id !== id);
    }
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}
```

## Authentication

### Login/Register in HTML

Add a login page or modal to authenticate users:

```html
<!-- Login Modal -->
<div class="modal-overlay" id="login-modal">
  <div class="modal">
    <div class="modal-header">
      <h3>Login</h3>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Email</label>
        <input id="login-email" type="email" placeholder="your@email.com">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input id="login-password" type="password">
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="handleLogin()">Login</button>
      </div>
    </div>
  </div>
</div>

<script>
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const result = await api.login(email, password);
    if (result.token) {
      alert('Login successful!');
      load();
      renderDashboard();
    } else {
      alert('Login failed: ' + result.error);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
</script>
```

## Error Handling

Wrap all API calls in try-catch:

```javascript
async function someFunction() {
  try {
    const result = await api.someMethod();
    // handle result
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred: ' + error.message);
  }
}
```

## Async/Await Pattern

Key functions need to be converted to async:

```javascript
// Change from synchronous to async
async function showPage(name, skipRender) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  // ...
  if (!skipRender) {
    if (name === 'dashboard') await renderDashboard();
    if (name === 'equipment') await renderEquipTable();
    if (name === 'worklog') { 
      await populateWorkLogFilters(); 
      await renderWorkLog(); 
    }
  }
}
```

## Important Notes

1. **Data IDs**: MongoDB uses `_id` instead of custom `id`. Update references if needed.
2. **Dates**: Work with ISO date strings from API.
3. **Populate**: The API automatically populates `equipId` references in work records.
4. **Caching**: Consider implementing local caching if frequent API calls cause delays.
5. **Offline**: The API requires internet. For offline support, use Service Workers + IndexedDB.

## Testing

1. Start the backend: `npm run dev` (in backend directory)
2. Make sure MongoDB is running
3. Update frontend HTML file to include `<script src="api-service.js"></script>`
4. Open the HTML in a browser
5. Test login, create equipment, log work, etc.

## Troubleshooting

**CORS Error?**
- Make sure backend includes CORS headers
- Check that `API_BASE` URL matches your backend address

**401 Unauthorized?**
- User is not authenticated
- Token may have expired
- Check localStorage for `token` value

**Equipment not saving?**
- Check browser console for errors
- Verify MongoDB is running
- Check backend server logs

**API connection failed?**
- Verify backend is running on correct port
- Check firewall settings
- Ensure CORS is configured correctly
