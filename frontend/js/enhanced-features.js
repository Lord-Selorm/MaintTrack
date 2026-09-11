/* ═══════════════════════════════════════════════
   ENHANCED FEATURES - Manual Upload & Word Export
═══════════════════════════════════════════════ */

// Upload manual for equipment
async function uploadManual(equipId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('manual', file);

    try {
      const response = await fetch(`${API_URL}/equipment/${equipId}/manual`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload manual');
      
      const result = await response.json();
      showToast('Manual uploaded successfully!', 'success');
      viewDetail(equipId);
      loadData();
    } catch (err) {
      showToast('Error uploading manual: ' + err.message, 'error');
    }
  };
  input.click();
}

// Download manual for equipment
async function downloadManual(equipId) {
  try {
    const response = await fetch(`${API_URL}/equipment/${equipId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    if (!response.ok) throw new Error('Failed to get equipment');
    
    const eq = await response.json();
    
    if (!eq.manualFileName) {
      showToast('No manual available for this equipment', 'warning');
      return;
    }

    const downloadResponse = await fetch(`${API_URL}/equipment/${equipId}/manual/download`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });

    if (!downloadResponse.ok) throw new Error('Failed to download manual');

    const blob = await downloadResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = eq.manualFileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    showToast('Error downloading manual: ' + err.message, 'error');
  }
}

// Delete manual for equipment
async function deleteManual(equipId) {
  if (!(await confirmDialog('Delete Manual?', 'This equipment manual file will be permanently removed.'))) return;

  try {
    const response = await fetch(`${API_URL}/equipment/${equipId}/manual`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });

    if (!response.ok) throw new Error('Failed to delete manual');
    
    showToast('Manual deleted successfully', 'success');
    viewDetail(equipId);
  } catch (err) {
    showToast('Error deleting manual: ' + err.message, 'error');
  }
}

// Download report as Word document
async function downloadEquipmentReportWord(equipId) {
  try {
    const eq = equipment.find(e => e.id == equipId);
    if (!eq) { showToast('Equipment not found', 'error'); return; }
    const response = await fetch(`${API_URL}/reports/export/word/${equipId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });

    if (!response.ok) throw new Error('Failed to generate report');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Equipment_Report_${eq.name.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    showToast('Failed to download Word report: ' + err.message, 'error');
  }
}

// Download all reports as Word document
async function downloadAllReportsWord() {
  try {
    const response = await fetch(`${API_URL}/reports/export/word/all`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });

    if (!response.ok) throw new Error('Failed to generate report');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Maintenance_Report_All_${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    showToast('Failed to download Word report: ' + err.message, 'error');
  }
}

// View manual in browser
async function viewManual(equipId) {
  try {
    const response = await fetch(`${API_URL}/equipment/${equipId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    if (!response.ok) throw new Error('Failed to get equipment');
    
    const eq = await response.json();
    
    if (!eq.manualFileName) {
      showToast('No manual available for this equipment', 'warning');
      return;
    }

    const downloadResponse = await fetch(`${API_URL}/equipment/${equipId}/manual/download`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    });

    if (!downloadResponse.ok) throw new Error('Failed to download manual');

    const blob = await downloadResponse.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (err) {
    showToast('Error viewing manual: ' + err.message, 'error');
  }
}
