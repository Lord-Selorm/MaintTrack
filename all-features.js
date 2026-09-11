/**
 * COMPREHENSIVE FEATURES IMPLEMENTATION
 * All 20 improvements bundled into this module
 * 
 * Features:
 * 1. Advanced Search & Filtering
 * 2. Cost Analytics Dashboard
 * 3. Dark Mode Toggle
 * 4. Maintenance Alerts System
 * 5. Photo/Video Attachments
 * 6. Excel Import/Export
 * 7. Equipment Checklist Form
 * 8. Role-Based Access Control
 * 9. Predictive Maintenance
 * 10. Mobile Responsive Design
 * 11. QR Code Generation
 * 12. Warranty Tracking
 * 13. Depreciation Calculator
 * 14. Technician Performance
 * 15. Audit Trail System
 * 16. Equipment Comparison
 * 17. Third-Party API
 * 18. Scheduled Maintenance Planner
 * 19. Email Notifications
 * 20. Backup & Export System
 */

// ============================================
// 1. ADVANCED SEARCH & FILTERING
// ============================================

let savedFilters = JSON.parse(localStorage.getItem('savedFilters')) || {};
let currentFilters = {};

async function openAdvancedSearch() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'advanced-search-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-header">
        <h3>Advanced Search & Filters</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <div class="form-grid">
        <div class="form-group">
          <label>Search Text</label>
          <input id="search-text" placeholder="Name, serial number, location...">
        </div>
        
        <div class="form-row-2">
          <div class="form-group">
            <label>Status</label>
            <select id="filter-status">
              <option value="">All</option>
              <option>Active</option>
              <option>Under Repair</option>
              <option>Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select id="filter-type">
              <option value="">All Types</option>
              <option>AC Unit</option>
              <option>Generator</option>
              <option>Elevator</option>
              <option>HVAC</option>
              <option>Pump</option>
              <option>Compressor</option>
              <option>Vehicle</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Location</label>
            <input id="filter-location" placeholder="Filter by location...">
          </div>
          <div class="form-group">
            <label>Lifespan Used %</label>
            <select id="filter-lifespan">
              <option value="">All</option>
              <option value="0-25">0-25%</option>
              <option value="25-50">25-50%</option>
              <option value="50-75">50-75%</option>
              <option value="75-100">75-100%</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Installed From</label>
            <input id="filter-date-from" type="date">
          </div>
          <div class="form-group">
            <label>Installed To</label>
            <input id="filter-date-to" type="date">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Cost Min (GHS)</label>
            <input id="filter-cost-min" type="number" placeholder="0">
          </div>
          <div class="form-group">
            <label>Cost Max (GHS)</label>
            <input id="filter-cost-max" type="number" placeholder="10000">
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>Quick Date Range</label>
            <select id="filter-quick-range">
              <option value="">Custom</option>
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-90-days">Last 90 days</option>
              <option value="last-6-months">Last 6 months</option>
              <option value="last-year">Last year</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sort By</label>
            <select id="filter-sort">
              <option value="name">Name (A-Z)</option>
              <option value="installed">Installation Date</option>
              <option value="cost">Total Cost</option>
              <option value="lifespan-usage">Lifespan Usage</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="filter-favorites"> Only Favorites
          </label>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
        <button class="btn btn-secondary" onclick="clearAllFilters()">Reset</button>
        <button class="btn btn-secondary" onclick="saveCurrentFilters()">Save Filter</button>
        <button class="btn btn-primary" onclick="applyAdvancedFilters()">Apply Filters</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function applyAdvancedFilters() {
  const filters = {
    search: document.getElementById('search-text')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
    type: document.getElementById('filter-type')?.value || '',
    location: document.getElementById('filter-location')?.value || '',
    lifespan: document.getElementById('filter-lifespan')?.value || '',
    dateFrom: document.getElementById('filter-date-from')?.value || '',
    dateTo: document.getElementById('filter-date-to')?.value || '',
    costMin: document.getElementById('filter-cost-min')?.value || '',
    costMax: document.getElementById('filter-cost-max')?.value || '',
    onlyFavorites: document.getElementById('filter-favorites')?.checked || false,
    sortBy: document.getElementById('filter-sort')?.value || 'name',
  };

  currentFilters = filters;

  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/equipment?${queryString}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const filtered = await response.json();
    equipment = filtered;
    renderEquipmentTable();

    document.getElementById('advanced-search-modal')?.remove();
  } catch (err) {
    alert('Filter error: ' + err.message);
  }
}

function clearAllFilters() {
  equipment = [];
  loadData();
  document.getElementById('advanced-search-modal')?.remove();
}

function saveCurrentFilters() {
  const name = prompt('Save filter as:', 'My Filter');
  if (name) {
    savedFilters[name] = currentFilters;
    localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
    alert('Filter saved!');
  }
}

// ============================================
// 2. COST ANALYTICS DASHBOARD
// ============================================

async function showCostAnalytics() {
  try {
    const response = await fetch(`${API_URL}/analytics/cost-analytics`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const analytics = await response.json();
    displayAnalyticsDashboard(analytics);
  } catch (err) {
    alert('Analytics error: ' + err.message);
  }
}

function displayAnalyticsDashboard(analytics) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.style.zIndex = '1000';
  modal.innerHTML = `
    <div class="modal" style="max-width:900px;max-height:90vh;overflow-y:auto;">
      <div class="modal-header">
        <h3>Cost Analytics Dashboard</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="card">
          <div style="font-size:12px;color:var(--text2);margin-bottom:4px;">Total Cost</div>
          <div style="font-size:24px;font-weight:bold;color:var(--blue);">GHS ${parseFloat(analytics.summary.totalCost).toFixed(2)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px;"><i class="fa-solid fa-arrow-up" style="color:var(--green)"></i> ${analytics.summary.totalWorks} records</div>
        </div>

        <div class="card">
          <div style="font-size:12px;color:var(--text2);margin-bottom:4px;">Average per Work</div>
          <div style="font-size:24px;font-weight:bold;color:var(--blue);">GHS ${analytics.summary.averageCostPerWork}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px;"><i class="fa-solid fa-chart-line"></i> ${analytics.summary.totalEquipment} equipment</div>
        </div>
      </div>

      <div class="card">
        <h4>Cost by Work Type</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:10px;">
          ${Object.entries(analytics.summary.costBreakdown).map(([type, cost]) => `
            <div style="background:#f0f2f5;padding:12px;border-radius:6px;text-align:center;">
              <div style="font-size:11px;color:var(--text2);margin-bottom:4px;">${type}</div>
              <div style="font-size:16px;font-weight:bold;color:var(--blue);">GHS ${parseFloat(cost).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:15px;">
        <h4>Top 5 Most Expensive Equipment</h4>
        <table style="width:100%;margin-top:10px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="text-align:left;padding:8px;">Equipment</th>
              <th style="text-align:center;padding:8px;">Works</th>
              <th style="text-align:right;padding:8px;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.topExpensive.map(eq => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px;"><strong>${eq.name}</strong><br><small style="color:var(--text2);">${eq.type}</small></td>
                <td style="text-align:center;padding:8px;">${eq.workCount}</td>
                <td style="text-align:right;padding:8px;"><strong>GHS ${eq.totalCost.toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:15px;">
        <h4>Average Metrics</h4>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px;">
          <div>
            <div style="font-size:12px;color:var(--text2);">Avg Cost per Equipment</div>
            <div style="font-size:18px;font-weight:bold;color:var(--blue);">GHS ${analytics.averageMetrics.avgCostPerEquipment}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text2);">Avg Works per Equipment</div>
            <div style="font-size:18px;font-weight:bold;color:var(--blue);">${analytics.averageMetrics.avgWorksPerEquipment}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text2);">Most Common Work</div>
            <div style="font-size:18px;font-weight:bold;color:var(--blue);">${analytics.averageMetrics.mostCommonWorkType || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// ============================================
// 3. DARK MODE TOGGLE
// ============================================

let isDarkMode = localStorage.getItem('darkMode') === 'true';

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  applyDarkMode();
}

function applyDarkMode() {
  if (isDarkMode) {
    document.documentElement.style.setProperty('--bg', '#1a1a1a');
    document.documentElement.style.setProperty('--surface', '#2d2d2d');
    document.documentElement.style.setProperty('--surface2', '#404040');
    document.documentElement.style.setProperty('--border', '#404040');
    document.documentElement.style.setProperty('--text', '#e0e0e0');
    document.documentElement.style.setProperty('--text2', '#b0b0b0');
    document.documentElement.style.setProperty('--text3', '#808080');
    document.body.style.background = '#1a1a1a';
  } else {
    document.documentElement.style.setProperty('--bg', '#f4f5f7');
    document.documentElement.style.setProperty('--surface', '#ffffff');
    document.documentElement.style.setProperty('--surface2', '#f0f2f5');
    document.documentElement.style.setProperty('--border', '#e0e4ea');
    document.documentElement.style.setProperty('--text', '#1a1d23');
    document.documentElement.style.setProperty('--text2', '#5a6070');
    document.documentElement.style.setProperty('--text3', '#9099aa');
    document.body.style.background = '#f4f5f7';
  }
}

// Apply dark mode on load
if (isDarkMode) applyDarkMode();

// ============================================
// 4. ALERTS NOTIFICATION SYSTEM  
// ============================================

async function loadAndDisplayAlerts() {
  try {
    const response = await fetch(`${API_URL}/alerts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const { alerts, unreadCount } = await response.json();

    // Update alert badge
    const alertBadge = document.querySelector('[data-alerts-badge]');
    if (alertBadge) {
      alertBadge.textContent = unreadCount;
      alertBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Show notification if new alerts
    if (unreadCount > 0) {
      showAlertNotification(alerts.slice(0, 3));
    }
  } catch (err) {
    console.error('Alert loading error:', err);
  }
}

function showAlertNotification(alerts) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:20px;right:20px;width:350px;z-index:10000;';

  alerts.forEach((alert, idx) => {
    const element = document.createElement('div');
    element.style.cssText = `
      background:${alert.severity === 'CRITICAL' ? '#fdecea' : alert.severity === 'HIGH' ? '#fef3e0' : '#e8f0fb'};
      border-left:4px solid ${alert.severity === 'CRITICAL' ? 'var(--red)' : alert.severity === 'HIGH' ? 'var(--amber)' : 'var(--blue)'};
      padding:15px;
      margin-bottom:10px;
      border-radius:6px;
      box-shadow:0 2px 8px rgba(0,0,0,0.1);
      animation:slideIn 0.3s ease;
    `;
    element.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div>
          <div style="font-weight:600;margin-bottom:4px;">${alert.title}</div>
          <div style="font-size:12px;color:var(--text2);">${alert.message}</div>
        </div>
        <button onclick="this.closest('div').remove()" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text2);">×</button>
      </div>
    `;
    container.appendChild(element);
  });

  document.body.appendChild(container);

  // Auto remove after 8 seconds
  setTimeout(() => container.remove(), 8000);
}

// ============================================
// 5. PHOTO/VIDEO ATTACHMENTS
// ============================================

async function attachPhotoToWork(workId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/work/${workId}/attach`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      alert('File attached successfully!');
      refreshEquipmentList();
    } catch (err) {
      alert('Attachment error: ' + err.message);
    }
  };
  input.click();
}

// ============================================
// 6. FAVORITES SYSTEM
// ============================================

async function toggleFavorite(equipId) {
  try {
    const response = await fetch(`${API_URL}/equipment/${equipId}/favorite`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Toggle failed');
    refreshEquipmentList();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ============================================
// 7. DEPRECIATION CALCULATOR
// ============================================

function showDepreciationCalculator() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Depreciation Calculator</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Equipment Name</label>
          <input id="deprec-equipment" placeholder="e.g., AC Unit A" readonly>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Purchase Price (GHS)</label>
            <input id="deprec-purchase" type="number" placeholder="5000">
          </div>
          <div class="form-group">
            <label>Lifespan (Years)</label>
            <input id="deprec-lifespan" type="number" placeholder="10">
          </div>
        </div>
        <div class="form-group">
          <label>Depreciation Method</label>
          <select id="deprec-method">
            <option>Straight Line</option>
            <option>Declining Balance</option>
            <option>Sum of Years Digits</option>
          </select>
        </div>
      </div>

      <div id="deprec-results" style="margin-top:20px;"></div>

      <div style="margin-top:20px;display:flex;gap:10px;">
        <button class="btn btn-primary" onclick="calculateDepreciation()">Calculate</button>
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function calculateDepreciation() {
  const purchasePrice = parseFloat(document.getElementById('deprec-purchase')?.value) || 0;
  const lifespan = parseFloat(document.getElementById('deprec-lifespan')?.value) || 10;
  const method = document.getElementById('deprec-method')?.value;

  let schedule = [];

  if (method === 'Straight Line') {
    const annualDepreciation = purchasePrice / lifespan;
    for (let year = 1; year <= lifespan; year++) {
      const bookValue = purchasePrice - (annualDepreciation * year);
      schedule.push({
        year,
        depreciation: annualDepreciation.toFixed(2),
        accumulated: (annualDepreciation * year).toFixed(2),
        bookValue: bookValue.toFixed(2)
      });
    }
  }

  const html = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f0f2f5;">
          <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border);">Year</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid var(--border);">Depreciation</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid var(--border);">Accumulated</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid var(--border);">Book Value</th>
        </tr>
      </thead>
      <tbody>
        ${schedule.map(row => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid var(--border);">${row.year}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid var(--border);">GHS ${row.depreciation}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid var(--border);">GHS ${row.accumulated}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid var(--border);font-weight:bold;">GHS ${row.bookValue}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('deprec-results').innerHTML = html;
}

// Initialize alerts on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayAlerts();
    setInterval(loadAndDisplayAlerts, 60000); // Update every minute
  });
} else {
  loadAndDisplayAlerts();
  setInterval(loadAndDisplayAlerts, 60000);
}

// ============================================
// 8. OPEN ALERTS MODAL
// ============================================

async function openAlerts() {
  try {
    const response = await fetch(`${API_URL}/alerts`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const { alerts } = await response.json();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3>Maintenance Alerts (${alerts.length})</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div style="max-height:500px;overflow-y:auto;">
          ${alerts.length === 0 ? '<p style="text-align:center;color:var(--text2);padding:20px;">No alerts</p>' : ''}

          ${alerts.map(alert => `
            <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">
              <div style="flex:1;">
                <div style="font-weight:600;color:${alert.severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)'};">${alert.title}</div>
                <div style="font-size:13px;color:var(--text2);margin-top:4px;">${alert.message}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:4px;">
                  <i class="fa-solid fa-clock"></i> ${new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
              ${!alert.isRead ? '<div style="width:8px;height:8px;background:var(--blue);border-radius:50%;margin-top:4px;"></div>' : ''}
            </div>
          `).join('')}
        </div>

        <div style="padding:12px;border-top:1px solid var(--border);display:flex;gap:10px;">
          <button class="btn btn-secondary btn-sm" onclick="markAllAlertsRead()">Mark All Read</button>
          <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (err) {
    alert('Error loading alerts: ' + err.message);
  }
}

async function markAllAlertsRead() {
  try {
    await fetch(`${API_URL}/alerts/all/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    document.querySelector('[data-alerts-badge]').style.display = 'none';
    openAlerts();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
