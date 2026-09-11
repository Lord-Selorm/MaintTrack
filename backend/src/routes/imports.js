const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const config = require('../config');

const upload = multer({ dest: path.join(config.uploadsDir, 'tmp') });

// POST /api/import/csv - upload a CSV file and import equipment rows
router.post('/csv', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const text = fs.readFileSync(req.file.path, 'utf8');
    // Simple CSV parser: first row headers, subsequent rows values
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      fs.unlink(req.file.path, () => {});
      return res.json({ imported: 0, errors: [] });
    }
    const headers = lines[0].split(/,|\t/).map(h => h.replace(/^"|"$/g, '').trim());
    const records = lines.slice(1).map(line => {
      const cols = line.split(/,|\t/).map(c => c.replace(/^"|"$/g, '').trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
      return obj;
    });

    const results = { imported: 0, errors: [] };
    const normalizeStatus = (value) => {
      const text = String(value || '').trim().toLowerCase();
      if (!text) return 'Active';
      if (['operational', 'active', 'ok', 'running'].includes(text)) return 'Active';
      if (['maintenance', 'repair', 'under repair', 'service', 'downtime'].includes(text)) return 'Under Repair';
      if (['inactive', 'standby', 'offline', 'retired'].includes(text)) return 'Inactive';
      return 'Active';
    };

    const parseInstalledDate = (value) => {
      const raw = String(value || '').trim();
      if (!raw) return new Date();
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const parseLifespan = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 10;
    };

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const name = r.Name || r.name || r['Equipment Name'] || r['equipment name'] || '';
      const serial = r.Serial || r.serial || r.SN || r.sn || r['Serial Number'] || r['serial number'] || '';
      if (!name || !serial) {
        results.errors.push({ row: i + 1, reason: 'Missing name or serial' });
        continue;
      }

      try {
        await Equipment.create({
          name,
          serial,
          type: r.Type || r.type || r['Equipment Type'] || r['equipment type'] || 'Other',
          status: normalizeStatus(r.Status || r.status || r['Status'] || r['status']),
          installed: parseInstalledDate(r['Installed Date'] || r['installed date'] || r.installed || r.Installed || ''),
          lifespan: parseLifespan(r['Lifespan (years)'] || r['Lifespan'] || r['lifespan'] || r.lifespan || 10),
          location: r.Location || r.location || r['Location'] || '',
          notes: r.Notes || r.notes || r['Notes'] || '',
          userId: req.userId
        });
        results.imported++;
      } catch (err) {
        results.errors.push({ row: i + 1, reason: err.message });
      }
    }

    // remove temp file
    fs.unlink(req.file.path, () => {});
    res.json(results);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// DOCX import endpoint
const mammoth = require('mammoth');

// POST /api/import/docx - upload a DOCX file and import equipment rows
router.post('/docx', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const result = await mammoth.convertToHtml({ path: req.file.path });
    const html = result.value || '';

    // extract first table if present
    const tableMatch = html.match(/<table[\s\S]*?>[\s\S]*?<\/table>/i);
    let records = [];

    if (tableMatch) {
      const tableHtml = tableMatch[0];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/td>|<(?:td|th)[^>]*>([\s\S]*?)<\/th>/gi;
      let tr;
      const rows = [];
      while ((tr = trRegex.exec(tableHtml)) !== null) {
        const trInner = tr[1];
        const cells = [];
        let cellMatch;
        const cellPattern = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
        while ((cellMatch = cellPattern.exec(trInner)) !== null) {
          const txt = cellMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
          cells.push(txt);
        }
        if (cells.length > 0) rows.push(cells);
      }

      if (rows.length > 0) {
        const headers = rows[0].map(h => h.toLowerCase());
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
          records.push(obj);
        }
      }
    }

    // fallback: try to extract plain text lines
    if (records.length === 0) {
      const text = html.replace(/<[^>]+>/g, '\n');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const parts = line.split(/\s+-\s+|\s*\|\s*|,\s*/).map(p => p.trim());
        if (parts.length === 0) continue;
        records.push({ name: parts[0] || '', serial: parts[1] || '', type: parts[2] || '', location: parts[3] || '' });
      }
    }

    const results = { imported: 0, errors: [] };
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const name = r.name || r['equipment name'] || r['name'] || '';
      const serial = r.serial || r['serial'] || r.sn || '';
      if (!name || !serial) {
        results.errors.push({ row: i + 1, reason: 'Missing name or serial' });
        continue;
      }
      try {
        await Equipment.create({
          name,
          serial,
          type: r.type || r['type'] || 'Other',
          location: r.location || r['location'] || '',
          notes: r.notes || r['notes'] || '',
          userId: req.userId
        });
        results.imported++;
      } catch (err) {
        results.errors.push({ row: i + 1, reason: err.message });
      }
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json(results);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});
