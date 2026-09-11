// API Configuration and service layer
const API_BASE = 'http://localhost:5000/api';

class MaintenanceAPI {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Auth endpoints
  async register(email, password, name) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (res.ok) this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  // Equipment endpoints
  async getEquipment(filters = {}) {
    const query = new URLSearchParams();
    if (filters.search) query.append('search', filters.search);
    if (filters.type) query.append('type', filters.type);
    if (filters.status) query.append('status', filters.status);
    
    const res = await fetch(`${API_BASE}/equipment?${query}`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  async getEquipmentDetail(id) {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  async createEquipment(data) {
    const res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async updateEquipment(id, data) {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async deleteEquipment(id) {
    const res = await fetch(`${API_BASE}/equipment/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await res.json();
  }

  async getDashboardMetrics() {
    const res = await fetch(`${API_BASE}/equipment/dashboard/metrics`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  // Work endpoints
  async getWork(filters = {}) {
    const query = new URLSearchParams();
    if (filters.equipId) query.append('equipId', filters.equipId);
    if (filters.type) query.append('type', filters.type);
    if (filters.month) query.append('month', filters.month);
    
    const res = await fetch(`${API_BASE}/work?${query}`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  async createWork(data) {
    const res = await fetch(`${API_BASE}/work`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async updateWork(id, data) {
    const res = await fetch(`${API_BASE}/work/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async deleteWork(id) {
    const res = await fetch(`${API_BASE}/work/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await res.json();
  }

  async getRecentWork() {
    const res = await fetch(`${API_BASE}/work/dashboard/recent`, {
      headers: this.getHeaders()
    });
    return await res.json();
  }

  logout() {
    localStorage.removeItem('token');
    this.token = null;
  }
}

// Create global API instance
const api = new MaintenanceAPI();
