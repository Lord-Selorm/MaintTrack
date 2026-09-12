/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ALL IMPROVEMENTS IMPLEMENTATION
 * Includes: Advanced Search, Analytics, Dark Mode, Alerts, Attachments, Excel
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. DARK MODE IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════════ */

class DarkMode {
  constructor() {
    if (!localStorage.getItem('theme') && localStorage.getItem('darkMode') === 'true') {
      localStorage.setItem('theme', 'dark');
    }
    this.mode = localStorage.getItem('theme') || 'system';
    this._mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    this.isDark = this.mode === 'dark' || (this.mode === 'system' && this.getSystemPreference());
    if (this._mq && this._mq.addEventListener) {
      this._mq.addEventListener('change', () => {
        if (this.mode === 'system') { this.isDark = this._mq.matches; this.applyTheme(); }
      });
    }
    this._tr = null;
    this.applyTheme();
  }

  getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  setMode(mode) {
    this.mode = mode;
    localStorage.setItem('theme', mode);
    this.isDark = mode === 'dark' || (mode === 'system' && this.getSystemPreference());
    this.applyTheme();
    this.updateUI();
  }

  toggle() {
    this.setMode(this.isDark ? 'light' : 'dark');
  }

  applyTheme() {
    const root = document.documentElement;
    root.classList.remove('theme-transition');
    void root.offsetWidth;
    root.classList.add('theme-transition');
    if (this.isDark) {
      root.style.setProperty('--bg', '#0e0f13');
      root.style.setProperty('--surface', '#17181f');
      root.style.setProperty('--surface2', '#1f222b');
      root.style.setProperty('--surface3', '#262a35');
      root.style.setProperty('--border', '#2c2f3a');
      root.style.setProperty('--border-strong', '#3a3e4c');
      root.style.setProperty('--text', '#eceef1');
      root.style.setProperty('--text2', '#a2a8b4');
      root.style.setProperty('--text3', '#62697a');
      root.style.setProperty('--blue-light', '#2a1e45');
      root.style.setProperty('--green-light', '#13291c');
      root.style.setProperty('--amber-light', '#2b2110');
      root.style.setProperty('--red-light', '#2a1518');
      document.body.classList.add('dark-mode');
    } else {
      root.style.setProperty('--bg', '#f5f6f8');
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface2', '#f1f2f5');
      root.style.setProperty('--surface3', '#f8f9fb');
      root.style.setProperty('--border', '#e3e5ea');
      root.style.setProperty('--border-strong', '#ccd1da');
      root.style.setProperty('--text', '#181b21');
      root.style.setProperty('--text2', '#4d5763');
      root.style.setProperty('--text3', '#98a0ad');
      root.style.setProperty('--blue-light', '#f3eeff');
      root.style.setProperty('--green-light', '#f0fdf4');
      root.style.setProperty('--amber-light', '#fffbeb');
      root.style.setProperty('--red-light', '#fef2f2');
      document.body.classList.remove('dark-mode');
    }
    clearTimeout(this._tr);
    this._tr = setTimeout(() => root.classList.remove('theme-transition'), 300);
  }

  updateUI() {
    document.querySelectorAll('.theme-option').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === this.mode);
    });
  }
}

const darkMode = new DarkMode();

function toggleDarkMode() {
  darkMode.toggle();
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ADVANCED SEARCH & FILTERING
═══════════════════════════════════════════════════════════════════════════ */

const AdvancedSearch = {
  filters: {
    search: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    type: '',
    location: '',
    costMin: '',
    costMax: '',
  },
  savedFilters: JSON.parse(localStorage.getItem('savedFilters') || '{}'),

  open() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'advanced-search-modal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Advanced Search & Filters</h3>
          <button class="modal-close" onclick="document.getElementById('advanced-search-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Search Text</label>
            <input type="text" id="adv-search" placeholder="Equipment name, serial, or location..." 
              value="${this.filters.search}">
          </div>
          
          <div class="form-row-2">
            <div class="form-group">
              <label>Date From</label>
              <input type="date" id="adv-date-from" value="${this.filters.dateFrom}">
            </div>
            <div class="form-group">
              <label>Date To</label>
              <input type="date" id="adv-date-to" value="${this.filters.dateTo}">
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Equipment Type</label>
              <input type="text" id="adv-type" list="adv-type-list" placeholder="Type or enter custom name" value="${this.filters.type}">
              <datalist id="adv-type-list">
                <option value="AC Unit"></option>
                <option value="Generator"></option>
                <option value="Elevator"></option>
                <option value="HVAC"></option>
                <option value="Pump"></option>
                <option value="Compressor"></option>
                <option value="Vehicle"></option>
                <option value="Other"></option>
              </datalist>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select id="adv-status">
                <option value="">All statuses</option>
                <option>Active</option><option>Under Repair</option><option>Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Location</label>
            <input type="text" id="adv-location" placeholder="e.g., Block A, Floor 2" value="${this.filters.location}">
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Cost Range (GHS)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="number" id="adv-cost-min" placeholder="Min" value="${this.filters.costMin}">
                <span>to</span>
                <input type="number" id="adv-cost-max" placeholder="Max" value="${this.filters.costMax}">
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
            <div style="font-weight:600;font-size:13px;margin-bottom:10px">Saved Filters</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px" id="saved-filters-list"></div>
            <div class="form-group">
              <label>Filter Name (to save)</label>
              <input type="text" id="adv-filter-name" placeholder="e.g., 'Expensive AC Units'">
            </div>
          </div>

          <div class="form-actions" style="margin-top:6px">
            <button class="btn btn-secondary" onclick="document.getElementById('advanced-search-modal').remove()">
              Close
            </button>
            <button class="btn btn-secondary" onclick="AdvancedSearch.saveFilter()">
              <i class="fa-solid fa-bookmark"></i> Save Filter
            </button>
            <button class="btn btn-secondary" onclick="AdvancedSearch.clearFilters()">
              <i class="fa-solid fa-eraser"></i> Clear
            </button>
            <button class="btn btn-primary" onclick="AdvancedSearch.apply()">
              <i class="fa-solid fa-magnifying-glass"></i> Search
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.renderSavedFilters();
  },

  renderSavedFilters() {
    const list = document.getElementById('saved-filters-list');
    list.innerHTML = '';
    Object.entries(this.savedFilters).forEach(([name, filter]) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-sm';
      btn.innerHTML = `${name} <i class="fa-solid fa-xmark" style="margin-left:4px"></i>`;
      btn.onclick = (e) => {
        if (e.target.closest('i')) {
          delete this.savedFilters[name];
          localStorage.setItem('savedFilters', JSON.stringify(this.savedFilters));
          this.renderSavedFilters();
        } else {
          this.loadFilter(filter);
        }
      };
      list.appendChild(btn);
    });
  },

  saveFilter() {
    const name = document.getElementById('adv-filter-name').value.trim();
    if (!name) { showToast('Enter filter name', 'info'); return; }
    this.updateFilters();
    this.savedFilters[name] = { ...this.filters };
    localStorage.setItem('savedFilters', JSON.stringify(this.savedFilters));
    showToast(`Filter '${name}' saved!`, 'success');
    this.renderSavedFilters();
  },

  loadFilter(filter) {
    this.filters = filter;
    const fieldMap = {
      search: 'search',
      dateFrom: 'date-from',
      dateTo: 'date-to',
      status: 'status',
      type: 'type',
      location: 'location',
      costMin: 'cost-min',
      costMax: 'cost-max'
    };

    Object.entries(filter).forEach(([k, v]) => {
      const fieldId = fieldMap[k] || k;
      const el = document.getElementById(`adv-${fieldId}`);
      if (el) el.value = v;
    });
  },

  updateFilters() {
    this.filters.search = document.getElementById('adv-search').value;
    this.filters.dateFrom = document.getElementById('adv-date-from').value;
    this.filters.dateTo = document.getElementById('adv-date-to').value;
    this.filters.status = document.getElementById('adv-status').value;
    this.filters.type = document.getElementById('adv-type').value;
    this.filters.location = document.getElementById('adv-location').value;
    this.filters.costMin = document.getElementById('adv-cost-min').value;
    this.filters.costMax = document.getElementById('adv-cost-max').value;
  },

  clearFilters() {
    this.filters = {
      search: '', dateFrom: '', dateTo: '', status: '', type: '', location: '', costMin: '', costMax: ''
    };
    const fields = ['search', 'date-from', 'date-to', 'status', 'type', 'location', 'cost-min', 'cost-max'];
    fields.forEach(id => {
      const el = document.getElementById(`adv-${id}`);
      if (el) el.value = '';
    });
  },

  apply() {
    this.updateFilters();
    document.getElementById('advanced-search-modal').remove();

    const results = {
      equipment: this.filterEquipment(),
      works: this.filterWorks(),
    };

    this.showResults(results);
  },

  filterEquipment() {
    const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
    const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

    return equipment.filter(eq => {
      const workItems = works.filter(w => w.equipId === eq.id);
      const matchSearch = !this.filters.search || 
        eq.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        eq.serial.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        (eq.location || '').toLowerCase().includes(this.filters.search.toLowerCase());
      
      const matchType = !this.filters.type || eq.type === this.filters.type;
      const matchStatus = !this.filters.status || eq.status === this.filters.status;
      const matchLocation = !this.filters.location || 
        (eq.location || '').toLowerCase().includes(this.filters.location.toLowerCase());

      const totalWorkCost = workItems.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
      const matchCost = (!this.filters.costMin || totalWorkCost >= parseFloat(this.filters.costMin)) &&
                        (!this.filters.costMax || totalWorkCost <= parseFloat(this.filters.costMax));

      const hasWorkInRange = !fromDate && !toDate || workItems.some(w => {
        const d = new Date(w.date);
        return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      });

      return matchSearch && matchType && matchStatus && matchLocation && matchCost && hasWorkInRange;
    });
  },

  filterWorks() {
    const searchText = (this.filters.search || '').toLowerCase();
    return works.filter(w => {
      const wDate = new Date(w.date);
      const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
      const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;
      const workText = `${w.type || ''} ${w.desc || ''} ${w.tech || ''}`.toLowerCase();
      const workEquipment = equipment.find(eq => eq.id === w.equipId);
      const equipmentText = `${workEquipment ? workEquipment.name : ''} ${workEquipment ? workEquipment.serial : ''} ${workEquipment ? workEquipment.location : ''}`.toLowerCase();

      const matchSearch = !searchText || workText.includes(searchText) || equipmentText.includes(searchText);
      const matchType = !this.filters.type || w.type === this.filters.type || (workEquipment && workEquipment.type === this.filters.type);
      const matchStatus = !this.filters.status || (workEquipment && workEquipment.status === this.filters.status);
      const matchLocation = !this.filters.location || equipmentText.includes(this.filters.location.toLowerCase());
      const matchDate = (!fromDate || wDate >= fromDate) && (!toDate || wDate <= toDate);
      const matchCost = (!this.filters.costMin || w.cost >= parseFloat(this.filters.costMin)) &&
                        (!this.filters.costMax || w.cost <= parseFloat(this.filters.costMax));

      return matchSearch && matchType && matchStatus && matchLocation && matchDate && matchCost;
    });
  },

  showResults(results) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'search-results-modal';
    modal.innerHTML = `
      <div class="modal" style="width:min(800px, 95vw)">
        <div class="modal-header">
          <h3>Search Results</h3>
          <button class="modal-close" onclick="document.getElementById('search-results-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div>
          <div style="margin-bottom:20px">
            <h4 style="font-weight:600;margin-bottom:10px">Equipment (${results.equipment.length})</h4>
            <div class="table-wrap">
              <table style="font-size:12px">
                <thead>
                  <tr>
                    <th>Name</th><th>Serial</th><th>Type</th><th>Status</th><th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  ${results.equipment.map(eq => `
                    <tr onclick="viewDetail(${eq.id}); document.getElementById('search-results-modal').remove()">
                      <td><strong>${escapeHtml(eq.name)}</strong></td>
                      <td>${escapeHtml(eq.serial)}</td>
                      <td>${escapeHtml(eq.type)}</td>
                      <td><span class="badge badge-${eq.status === 'Active' ? 'active' : 'repair'}">${escapeHtml(eq.status)}</span></td>
                      <td>${escapeHtml(eq.location) || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style="font-weight:600;margin-bottom:10px">Work Records (${results.works.length})</h4>
            <div class="timeline">
              ${results.works.slice(0, 20).map(w => {
                const eq = equipment.find(e => e.id == w.equipId);
                return `
                  <div class="tl-item">
                    <div class="tl-dot ${w.type}"></div>
                    <div class="tl-date">${new Date(w.date).toLocaleDateString()}</div>
                    <div class="tl-title">${escapeHtml(w.type)}: ${eq ? escapeHtml(eq.name) : 'Unknown'}</div>
                    <div class="tl-desc">${escapeHtml(w.desc)}</div>
                    <div class="tl-meta">
                      <span>GHS ${Number(w.cost || 0).toFixed(2)}</span>
                      <span>${escapeHtml(w.tech) || 'N/A'}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. DOCX / CSV IMPORTER (client-side)
═══════════════════════════════════════════════════════════════════════════ */

async function importEquipmentDoc() {
  if (!authToken) { showToast('Please login before importing equipment', 'warning'); return; }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx,.txt,.csv';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let text = '';
      if (file.name.endsWith('.docx') && window.JSZip) {
        const ab = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(ab);
        const docXml = zip.file('word/document.xml');
        if (docXml) {
            const xml = await docXml.async('text');
            // Prefer extracting tables if present
            if (/\<w:tbl[\s\S]*?\<\/w:tbl\>/i.test(xml)) {
              const tableRows = extractTableFromDocXml(xml);
              // convert tableRows (array of arrays) to text lines with comma separation
              text = tableRows.map(r => r.join(',')).join('\n');
            } else {
              // crude extraction: keep paragraph breaks and strip tags
              text = xml.replace(/<w:p[^>]*>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '');
            }
          } else {
            text = await file.text();
          }
      } else {
        text = await file.text();
      }

      const rows = parseTextToRows(text);
      showImportPreview(rows, file.name);
    } catch (err) {
      console.error('Import failed:', err);
      showToast('Failed to read file: ' + err.message, 'error');
    }
  };

  input.click();
}

function parseTextToRows(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // If document contains a header row with commas/tabs, detect and parse as table
  const headerIdx = lines.findIndex(l => /name|serial|type|location/i.test(l));
  let rows = [];

  if (headerIdx >= 0 && /,|\t/.test(lines[headerIdx])) {
    const header = lines[headerIdx].split(/,|\t/).map(h => h.trim().toLowerCase());
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const parts = lines[i].split(/,|\t/).map(p => p.trim());
      if (parts.length === 0) continue;
      const obj = {};
      header.forEach((h, idx) => { obj[h] = parts[idx] || ''; });
      rows.push(obj);
    }
  } else {
    // Try to extract items by paragraphs; each paragraph could be "Name - Serial - Type - Location"
    lines.forEach(line => {
      const parts = line.split(/\s+-\s+|\s*\|\s*|,\s*/).map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) return;
      const obj = {};
      obj.name = parts[0] || '';
      obj.serial = parts[1] || '';
      obj.type = parts[2] || '';
      obj.location = parts[3] || '';
      rows.push(obj);
    });
  }

  // Normalize keys
  return rows.map(r => ({
    name: r.name || r['equipment name'] || r['name'] || r['item'] || '',
    serial: r.serial || r['serial'] || r['sn'] || '',
    type: r.type || r['type'] || r['equipment type'] || '',
    location: r.location || r['location'] || '',
    notes: r.notes || ''
  })).filter(r => r.name || r.serial);
}

// Extract table rows as arrays of cell text from Word document.xml
function extractTableFromDocXml(xml) {
  const rows = [];
  const trRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/g;
  let trMatch;
  while ((trMatch = trRegex.exec(xml)) !== null) {
    const trContent = trMatch[1];
    const cellTexts = [];
    const tdRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tdMatch;
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      // Normalize whitespace
      const cell = tdMatch[1].replace(/\s+/g, ' ').trim();
      cellTexts.push(cell);
    }
    if (cellTexts.length > 0) rows.push(cellTexts);
  }
  return rows;
}

function showImportPreview(rows, filename) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'import-preview-modal';
  modal.innerHTML = `
    <div class="modal" style="width:min(900px,95vw);max-height:80vh;overflow:auto">
      <div class="modal-header">
        <h3><i class="fa-solid fa-file-import"></i> Import Preview - ${escapeHtml(filename)}</h3>
        <button class="modal-close" onclick="document.getElementById('import-preview-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="padding:12px">
        <p style="font-size:13px;color:var(--text2)">Detected ${rows.length} equipment entries. Review before importing.</p>
        <div class="table-wrap" style="max-height:50vh;overflow:auto">
          <table style="width:100%;font-size:13px;">
            <thead><tr><th>#</th><th>Name</th><th>Serial</th><th>Type</th><th>Location</th></tr></thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i+1}</td>
                  <td>${escapeHtml(r.name) || '-'}</td>
                  <td>${escapeHtml(r.serial) || '-'}</td>
                  <td>${escapeHtml(r.type) || '-'}</td>
                  <td>${escapeHtml(r.location) || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="document.getElementById('import-preview-modal').remove()">Cancel</button>
          <button class="btn btn-primary" id="confirm-import-btn">Import ${rows.length} items</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('confirm-import-btn').onclick = async () => {
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const payload = {
          name: r.name || `Imported ${Date.now()}-${i}`,
          serial: r.serial || `IMP-${Date.now()}-${i}`,
          type: r.type || 'Other',
          location: r.location || '',
          notes: r.notes || ''
        };
        try {
          await apiCall('POST', '/equipment', payload);
        } catch (err) {
          console.error('Failed to import row', i, err);
        }
      }
      showToast('Import completed. Reloading equipment list...', 'success');
      document.getElementById('import-preview-modal').remove();
      await loadData();
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
    }
  };
}

// Download a CSV template for users to fill
function downloadImportTemplate() {
  const header = ['Name','Serial','Type','Location','Notes'];
  const example = ['Generator A','SN-0001','Generator','Plant Room','Main backup generator'];
  const csv = header.join(',') + '\n' + example.map(v => `"${v.replace(/"/g,'""')}"`).join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'equipment_import_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Upload a filled CSV/Template and show preview (uses existing parser)
function uploadTemplateFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.txt';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseTextToRows(text);
      showImportPreview(rows, file.name);
    } catch (err) {
      showToast('Failed to read file: ' + err.message, 'error');
    }
  };
  input.click();
}

// Upload template file directly to server for bulk import
async function uploadTemplateToServer() {
  if (!authToken) { showToast('Please login to import to server', 'warning'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.txt';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/import/csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
          showImportResultsModal(data, file.name);
          await loadData();
    } catch (err) {
      showToast('Server import failed: ' + err.message, 'error');
    }
  };
  input.click();
}

// Upload a DOCX file to server for robust parsing/import
async function uploadDocxToServer() {
  if (!authToken) { showToast('Please login to import to server', 'warning'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/import/docx`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      showImportResultsModal(data, file.name);
      await loadData();
    } catch (err) {
      showToast('DOCX import failed: ' + err.message, 'error');
    }
  };
  input.click();
}

function showImportResultsModal(results, filename) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'import-results-modal';
  modal.innerHTML = `
    <div class="modal" style="width:min(700px,95vw);max-height:80vh;overflow:auto">
      <div class="modal-header">
        <h3>Import Results - ${escapeHtml(filename)}</h3>
        <button class="modal-close" onclick="document.getElementById('import-results-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="padding:14px">
        <div style="margin-bottom:8px">Imported: <strong>${results.imported}</strong></div>
        <div style="margin-bottom:12px">Errors: <strong>${results.errors?.length || 0}</strong></div>
        ${results.errors && results.errors.length ? `
          <div style="max-height:50vh;overflow:auto" class="table-wrap">
            <table style="width:100%;font-size:13px">
              <thead><tr><th>Row</th><th>Reason</th></tr></thead>
              <tbody>
                ${results.errors.map(e => `<tr><td>${e.row || '-'}</td><td>${e.reason}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state">No errors reported.</div>`}
        <div style="margin-top:12px;text-align:right">
          <button class="btn btn-secondary" onclick="document.getElementById('import-results-modal').remove()">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function openAdvancedSearch() {
  AdvancedSearch.open();
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. COST ANALYTICS DASHBOARD (needs Chart.js)
═══════════════════════════════════════════════════════════════════════════ */

async function showCostAnalytics() {
  try {
    const analytics = await apiCall('GET', '/analytics/cost-analytics');
    const predictive = await apiCall('GET', '/analytics/predictive-maintenance');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'analytics-modal';
    modal.innerHTML = `
      <div class="modal" style="width:min(950px, 95vw);max-height:95vh;overflow-y:auto">
        <div class="modal-header">
          <h3><i class="fa-solid fa-chart-line"></i> Cost Analytics Dashboard</h3>
          <button class="modal-close" onclick="document.getElementById('analytics-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px;flex-wrap:wrap">
          <div>
            <div style="font-size:14px;color:var(--text2);margin-bottom:4px">Performance overview for your equipment and maintenance spend.</div>
            <div style="font-size:12px;color:var(--text3)">Includes cost trends, work-type breakdowns, and top cost drivers.</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="exportAnalyticsCsv()">
              <i class="fa-solid fa-file-csv"></i> Export CSV
            </button>
            <button class="btn btn-secondary btn-sm" onclick="showPredictiveMaintenance()">
              <i class="fa-solid fa-lightbulb"></i> View Suggestions
            </button>
          </div>
        </div>

        <div class="metrics-grid" style="margin-bottom:20px">
          <div class="metric-card">
            <div class="metric-label">Total Cost</div>
            <div class="metric-value blue">GHS ${analytics.summary.totalCost.toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Works</div>
            <div class="metric-value">${analytics.summary.totalWorks}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Equipment</div>
            <div class="metric-value green">${analytics.summary.totalEquipment}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Avg Cost / Work</div>
            <div class="metric-value">GHS ${parseFloat(analytics.summary.averageCostPerWork).toFixed(2)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div class="card" style="padding:18px;min-height:132px;">
            <div style="font-weight:600;margin-bottom:10px">Avg Works per Equipment</div>
            <div style="font-size:20px;font-weight:700">${analytics.averageMetrics.avgWorksPerEquipment}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:4px">Work frequency across active inventory.</div>
          </div>
          <div class="card" style="padding:18px;min-height:132px;">
            <div style="font-weight:600;margin-bottom:10px">Most Common Work Type</div>
            <div style="font-size:20px;font-weight:700">${analytics.averageMetrics.mostCommonWorkType || 'N/A'}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:4px">The highest volume maintenance category.</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:20px;padding:18px;">
          <div style="font-weight:600;margin-bottom:12px">Spending Trend</div>
          <div style="height:300px;">
            <canvas id="analytics-cost-trend"></canvas>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div class="card" style="padding:18px;min-height:320px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div style="font-weight:600">Cost by Work Type</div>
              <span style="font-size:12px;color:var(--text3)">Total cost per category</span>
            </div>
            <div style="height:240px;">
              <canvas id="analytics-work-type"></canvas>
            </div>
          </div>
          <div class="card" style="padding:18px;min-height:320px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div style="font-weight:600">Cost by Equipment Type</div>
              <span style="font-size:12px;color:var(--text3)">Total cost by equipment group</span>
            </div>
            <div style="height:240px;">
              <canvas id="analytics-equip-type"></canvas>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div class="card">
            <div style="font-weight:600;margin-bottom:14px">Cost Breakdown</div>
            <table style="font-size:12px;width:100%">
              <tbody>
                ${Object.entries(analytics.summary.costBreakdown).map(([type, cost]) => `
                  <tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:8px 0"><strong>${type}</strong></td>
                    <td style="padding:8px 0;text-align:right">GHS ${cost.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="card">
            <div style="font-weight:600;margin-bottom:14px">Top 5 Expensive Equipment</div>
            <table style="font-size:12px;width:100%">
              <tbody>
                ${(analytics.topExpensive || []).slice(0, 5).map((item, idx) => `
                  <tr style="border-bottom:1px solid var(--border)">
                    <td style="padding:8px 0">${idx + 1}. <strong>${item.name}</strong></td>
                    <td style="padding:8px 0;text-align:right">GHS ${item.totalCost.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    window.lastAnalyticsReport = analytics;

    if (window.Chart) {
      const trendCtx = modal.querySelector('#analytics-cost-trend')?.getContext('2d');
      const workTypeCtx = modal.querySelector('#analytics-work-type')?.getContext('2d');
      const equipTypeCtx = modal.querySelector('#analytics-equip-type')?.getContext('2d');

      const trendLabels = analytics.trends.map(item => item.month);
      const trendData = analytics.trends.map(item => Number(item.totalCost.toFixed(2)));
      const workTypeLabels = Object.keys(analytics.byWorkType || {});
      const workTypeData = workTypeLabels.map(type => Number(analytics.byWorkType[type].totalCost.toFixed(2)));
      const equipTypeLabels = Object.keys(analytics.byType || {});
      const equipTypeData = equipTypeLabels.map(type => Number(analytics.byType[type].totalCost.toFixed(2)));

      if (trendCtx) {
        new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: trendLabels,
            datasets: [{
              label: 'Spending',
              data: trendData,
              borderColor: '#6d28d9',
              backgroundColor: 'rgba(109,40,217,0.14)',
              fill: true,
              tension: 0.3,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true }
            }
          }
        });
      }

      if (workTypeCtx) {
        new Chart(workTypeCtx, {
          type: 'doughnut',
          data: {
            labels: workTypeLabels,
            datasets: [{
              data: workTypeData,
              backgroundColor: ['#6d28d9', '#d97706', '#16a34a', '#dc2626', '#6a5acd', '#0ea5e9'],
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      if (equipTypeCtx) {
        new Chart(equipTypeCtx, {
          type: 'bar',
          data: {
            labels: equipTypeLabels,
            datasets: [{
              label: 'Cost',
              data: equipTypeData,
              backgroundColor: '#6d28d9'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }
  } catch (err) {
    showToast('Failed to load analytics: ' + err.message, 'error');
  }
}

function exportAnalyticsCsv() {
  const analytics = window.lastAnalyticsReport;
  if (!analytics) {
    showToast('Analytics report is not available yet. Please open the analytics dashboard first.', 'warning');
    return;
  }

  const csvLines = [];
  csvLines.push('Metric,Value');
  csvLines.push(`Total Cost,GHS ${analytics.summary.totalCost.toFixed(2)}`);
  csvLines.push(`Total Works,${analytics.summary.totalWorks}`);
  csvLines.push(`Total Equipment,${analytics.summary.totalEquipment}`);
  csvLines.push(`Avg Cost per Work,GHS ${parseFloat(analytics.summary.averageCostPerWork).toFixed(2)}`);
  csvLines.push(`Avg Works per Equipment,${analytics.averageMetrics.avgWorksPerEquipment}`);
  csvLines.push(`Most Common Work Type,${analytics.averageMetrics.mostCommonWorkType || 'N/A'}`);
  csvLines.push('');
  csvLines.push('Cost Breakdown,Amount');
  Object.entries(analytics.summary.costBreakdown).forEach(([type, cost]) => {
    csvLines.push(`${type},GHS ${cost.toFixed(2)}`);
  });
  csvLines.push('');
  csvLines.push('Top Expensive Equipment,Total Cost');
  (analytics.topExpensive || []).slice(0, 10).forEach(item => {
    csvLines.push(`${item.name},GHS ${item.totalCost.toFixed(2)}`);
  });
  csvLines.push('');
  csvLines.push('Monthly Trend,Total Cost,Work Count');
  (analytics.trends || []).forEach(item => {
    csvLines.push(`${item.month},GHS ${item.totalCost.toFixed(2)},${item.count}`);
  });
  csvLines.push('');
  csvLines.push('Work Type,Total Cost,Count,Avg Cost');
  Object.entries(analytics.byWorkType || {}).forEach(([type, value]) => {
    csvLines.push(`${type},GHS ${Number(value.totalCost).toFixed(2)},${value.count},GHS ${Number(value.avgCost).toFixed(2)}`);
  });

  const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'maintenance_analytics.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function showPredictiveMaintenance() {
  try {
    const suggestions = await apiCall('GET', '/analytics/predictive-maintenance');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'predictive-modal';
    modal.innerHTML = `
      <div class="modal" style="width:min(700px, 95vw);max-height:80vh;overflow-y:auto">
        <div class="modal-header">
          <h3><i class="fa-solid fa-lightbulb"></i> Predictive Maintenance</h3>
          <button class="modal-close" onclick="document.getElementById('predictive-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div style="padding:0 20px 20px">
          ${suggestions.length === 0 ? `
            <div class="empty-state" style="padding:40px 20px">
              <i class="fa-solid fa-circle-check" style="color:var(--green);font-size:32px"></i>
              <p>No predictive maintenance recommendations right now. Keep the system updated and check back later.</p>
            </div>
          ` : `
            ${suggestions.map(s => `
              <div style="background:${s.priority === 'HIGH' ? 'var(--red-light)' : 'var(--amber-light)'};border-left:4px solid ${s.priority === 'HIGH' ? 'var(--red)' : 'var(--amber)'};padding:14px;margin-bottom:12px;border-radius:4px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div style="font-weight:600;color:${s.priority === 'HIGH' ? 'var(--red)' : 'var(--amber)'}">${s.equipName}</div>
                  <span style="font-size:11px;color:var(--text3);font-weight:600">${s.priority}</span>
                </div>
                <div style="margin-bottom:8px">${s.message}</div>
                <div style="font-size:12px;color:var(--text3)">Suggested category: ${s.type}</div>
              </div>
            `).join('')}
          `}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (err) {
    showToast('Failed to load predictive maintenance suggestions: ' + err.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. MAINTENANCE ALERTS SYSTEM
═══════════════════════════════════════════════════════════════════════════ */

async function loadAndDisplayAlerts() {
  try {
    const response = await apiCall('GET', '/alerts');
    const alertsBadge = document.querySelector('[data-alerts-badge]');
    if (alertsBadge) {
      alertsBadge.textContent = response.unreadCount || 0;
      alertsBadge.style.display = response.unreadCount > 0 ? 'flex' : 'none';
    }
  } catch (err) {
    console.error('Failed to load alerts:', err);
  }
}

async function openAlerts() {
  try {
    // First generate new alerts
    await apiCall('POST', '/alerts/generate');
    
    // Fetch alerts and predictive maintenance suggestions
    const [response, suggestions] = await Promise.all([
      apiCall('GET', '/alerts'),
      apiCall('GET', '/analytics/predictive-maintenance')
    ]);
    const alerts = response.alerts || [];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'alerts-modal';
    modal.innerHTML = `
      <div class="modal" style="width:min(600px, 95vw);max-height:80vh;overflow-y:auto">
        <div class="modal-header">
          <h3><i class="fa-solid fa-bell"></i> Maintenance Alerts</h3>
          <button class="modal-close" onclick="document.getElementById('alerts-modal').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="margin-bottom:16px">
          <button class="btn btn-secondary btn-sm" onclick="AlertsManager.markAllAsRead()">
            <i class="fa-solid fa-check-double"></i> Mark All As Read
          </button>
        </div>

        <div>
          ${alerts.length === 0 ? `
            <div class="empty-state" style="padding:40px 20px">
              <i class="fa-solid fa-circle-check" style="color:var(--green);font-size:32px"></i>
              <p>No alerts at this time. Everything is running smoothly!</p>
            </div>
          ` : `
            ${alerts.map(alert => `
              <div style="background:${alert.isRead ? 'rgba(240,244,249,0.9)' : alert.severity === 'CRITICAL' ? 'var(--red-light)' : 'var(--amber-light)'};border-left:4px solid ${alert.severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)'};padding:14px;margin-bottom:10px;border-radius:4px;${alert.isRead ? 'opacity:0.82' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
                  <div>
                    <div style="font-weight:600;color:${alert.severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)'}">${escapeHtml(alert.title)}</div>
                    <div style="font-size:11px;color:var(--text3);margin-top:4px">${alert.severity} severity • ${new Date(alert.createdAt).toLocaleString()}</div>
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${alert.actionUrl ? `<button class="btn btn-secondary btn-sm" onclick="AlertsManager.viewAlertTarget(${JSON.stringify(alert.actionUrl)})" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="AlertsManager.markAsRead(${alert.id})" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-check"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="AlertsManager.dismissAlert(${alert.id})" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </div>
                <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${escapeHtml(alert.message)}</div>
              </div>
            `).join('')}
          `}

          <div style="margin-top:20px;padding-top:18px;border-top:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div style="font-weight:600">Predictive Maintenance Suggestions (${suggestions.length})</div>
              <button class="btn btn-secondary btn-sm" onclick="showPredictiveMaintenance()">View All</button>
            </div>
            ${suggestions.length === 0 ? `
              <div style="font-size:13px;color:var(--text2)">No predictive recommendations found. Keep equipments up to date.</div>
            ` : suggestions.map(s => `
              <div style="background:${s.priority === 'HIGH' ? 'var(--red-light)' : 'var(--amber-light)'};border-left:4px solid ${s.priority === 'HIGH' ? 'var(--red)' : 'var(--amber)'};padding:12px;margin-bottom:10px;border-radius:4px">
                <div style="font-weight:600;color:${s.priority === 'HIGH' ? 'var(--red)' : 'var(--amber)'}">${s.equipName}</div>
                <div style="font-size:12px;color:var(--text2);margin:5px 0">${s.message}</div>
                <div style="font-size:11px;color:var(--text3)">${s.priority} priority</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (err) {
    console.error('Failed to load alerts:', err);
    showToast('Failed to load alerts: ' + err.message, 'error');
  }
}

const AlertsManager = {
  async markAsRead(alertId) {
    try {
      await apiCall('PUT', `/alerts/${alertId}/read`);
      await openAlerts();
      await loadAndDisplayAlerts();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  },

  async dismissAlert(alertId) {
    try {
      await apiCall('DELETE', `/alerts/${alertId}`);
      await openAlerts();
      await loadAndDisplayAlerts();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  },

  async markAllAsRead() {
    try {
      await apiCall('PUT', '/alerts/all/read');
      await openAlerts();
      await loadAndDisplayAlerts();
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  },

  viewAlertTarget(actionUrl) {
    if (!actionUrl) return;
    const match = actionUrl.match(/\/equipment\/(\d+)/);
    if (match) {
      const id = match[1];
      viewDetail(id);
      document.getElementById('alerts-modal')?.remove();
      return;
    }
    window.open(actionUrl, '_blank');
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. PHOTO/VIDEO ATTACHMENTS FOR WORK RECORDS
═══════════════════════════════════════════════════════════════════════════ */

async function uploadWorkAttachment(workId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*,.pdf';
  input.multiple = true;

  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('attachment', file);

      try {
        const response = await fetch(`${API_URL}/work/${workId}/attachments`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
      } catch (err) {
        showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }

    showToast('Attachments uploaded successfully!', 'success');
    if (currentDetailId) viewDetail(currentDetailId);
  };

  input.click();
}

async function downloadWorkAttachment(attachmentId, workId) {
  try {
    const response = await fetch(`${API_URL}/work/${workId}/attachments/${attachmentId}/download`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) throw new Error('Failed to download attachment');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${attachmentId}_attachment`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    showToast('Failed to download attachment: ' + err.message, 'error');
  }
}

async function deleteWorkAttachment(attachmentId, workId) {
  if (!(await confirmDialog('Delete Attachment?', 'This work attachment will be permanently removed.'))) return;

  try {
    await apiCall('DELETE', `/work/${workId}/attachments/${attachmentId}`);
    if (currentDetailId) viewDetail(currentDetailId);
  } catch (err) {
    showToast('Failed to delete attachment: ' + err.message, 'error');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. EXCEL EXPORT & IMPORT
═══════════════════════════════════════════════════════════════════════════ */

const ExcelManager = {
  async exportEquipmentToExcel() {
    try {
      const csv = this.generateEquipmentCSV();
      this.downloadCSV(csv, 'Equipment_Registry.csv');
    } catch (err) {
      showToast('Failed to export: ' + err.message, 'error');
    }
  },

  async exportWorkHistoryToExcel() {
    try {
      const csv = this.generateWorkHistoryCSV();
      this.downloadCSV(csv, 'Work_History.csv');
    } catch (err) {
      showToast('Failed to export: ' + err.message, 'error');
    }
  },

  generateEquipmentCSV() {
    let csv = 'Equipment Name,Serial Number,Type,Status,Location,Installed Date,Lifespan (years),Total Works,Total Cost,Notes\n';
    
    equipment.forEach(eq => {
      const eqWorks = works.filter(w => w.equipId === eq.id);
      const totalCost = eqWorks.reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0);
      
      csv += `"${eq.name}","${eq.serial}","${eq.type}","${eq.status}","${eq.location || ''}","${eq.installed}","${eq.lifespan}","${eqWorks.length}","${totalCost.toFixed(2)}","${(eq.notes || '').replace(/"/g, '""')}"\n`;
    });

    return csv;
  },

  generateWorkHistoryCSV() {
    let csv = 'Equipment,Work Type,Date,Technician,Duration (hrs),Cost (GHS),Description\n';
    
    works.forEach(w => {
      const eq = equipment.find(e => e.id == w.equipId);
      csv += `"${eq ? eq.name : 'Unknown'}","${w.type}","${new Date(w.date).toLocaleDateString()}","${w.tech || ''}","${w.dur || 0}","${(Number(w.cost) || 0).toFixed(2)}","${(w.desc || '').replace(/"/g, '""')}"\n`;
    });

    return csv;
  },

  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importFromExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.split('\n');
        
        if (lines[0].includes('Equipment Name')) {
          await this.importEquipmentFromCSV(lines);
        } else if (lines[0].includes('Equipment,Work')) {
          await this.importWorkFromCSV(lines);
        }

        showToast('Import successful!', 'success');
        loadData();
      } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
      }
    };

    input.click();
  },

  async importEquipmentFromCSV(lines) {
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = this.parseCSVLine(lines[i]);
      const eq = {
        name: values[0],
        serial: values[1],
        type: values[2],
        status: values[3],
        location: values[4],
        installed: values[5],
        lifespan: parseInt(values[6]),
        notes: values[9] || '',
      };

      try {
        await apiCall('POST', '/equipment', eq);
      } catch (err) {
        console.error(`Failed to import ${eq.name}:`, err);
      }
    }
  },

  async importWorkFromCSV(lines) {
    // Similar implementation for work import
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = this.parseCSVLine(lines[i]);
      const eqName = values[0];
      const eq = equipment.find(e => e.name.toLowerCase() === eqName.toLowerCase());
      
      if (!eq) continue;

      const work = {
        equipId: eq.id,
        type: values[1],
        date: values[2],
        technician: values[3],
        duration: parseFloat(values[4]) || 0,
        cost: parseFloat(values[5]) || 0,
        description: values[6] || '',
      };

      try {
        await apiCall('POST', '/work', work);
      } catch (err) {
        console.error(`Failed to import work for ${eqName}:`, err);
      }
    }
  },

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   INITIALIZATION & INTEGRATION
═══════════════════════════════════════════════════════════════════════════ */

// Load alerts on page load
// Load alerts & predictive recommendations on page load
async function loadPredictiveCount() {
  try {
    const suggestions = await apiCall('GET', '/analytics/predictive-maintenance');
    const badge = document.querySelector('[data-predictive-badge]');
    const count = Array.isArray(suggestions) ? suggestions.length : (suggestions.count || 0);
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      // Visual pulse when recommendations are present
      if (count > 0) {
        badge.classList.add('pulse');
      } else {
        badge.classList.remove('pulse');
      }
      // Set tooltip with last-updated time
      const now = new Date();
      badge.title = `${count} recommendation${count === 1 ? '' : 's'} — updated ${now.toLocaleString()}`;
    }
  } catch (err) {
    console.error('Failed to load predictive count:', err);
  }
}

window.addEventListener('load', () => {
  if (!authToken) return;
  loadAndDisplayAlerts();
  loadPredictiveCount();
  setInterval(loadAndDisplayAlerts, 60000); // Refresh every minute
  setInterval(loadPredictiveCount, 60000);
});
