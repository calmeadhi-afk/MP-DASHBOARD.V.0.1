(function () {
  'use strict';

  const TOKEN_KEY = 'solarflow_crm_api_token';
  const USER_KEY = 'solarflow_crm_current_user';

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const storedToken = token();
    if (storedToken) headers.Authorization = `Bearer ${storedToken}`;
    let response;
    try {
      response = await fetch(path, { ...options, headers });
    } catch (error) {
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
    let data = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch (error) { data = null; }
    }
    if (!response.ok) {
      const message = (data && (data.error || data.message)) || `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (!location.pathname.endsWith('login.html')) location.href = 'login.html';
      }
      throw error;
    }
    return data || {};
  }

  const crmApi = {
    token,
    request,

    getCurrentUser: () => request('/api/auth/me'),

    getLeads: () => request('/api/leads'),
    getLead: (leadId) => request(`/api/leads/${encodeURIComponent(leadId)}`),
    updateLead: (leadId, changes) => request(`/api/leads/${encodeURIComponent(leadId)}`, { method: 'PATCH', body: JSON.stringify(changes) }),
    assignLead: (leadId, assignedTo) => request(`/api/leads/${encodeURIComponent(leadId)}/assignment`, { method: 'POST', body: JSON.stringify({ assignedTo }) }),
    addFollowUp: (leadId, data) => request(`/api/leads/${encodeURIComponent(leadId)}/follow-ups`, { method: 'POST', body: JSON.stringify(data) }),
    leadAction: (leadId, action, data = {}) => request(`/api/leads/${encodeURIComponent(leadId)}/actions`, { method: 'POST', body: JSON.stringify({ action, ...data }) }),
    completeStage: (leadId, data) => request(`/api/leads/${encodeURIComponent(leadId)}/actions`, { method: 'POST', body: JSON.stringify({ action: 'complete-stage', ...data }) }),

    getTasks: () => request('/api/tasks'),
    updateTask: (taskId, data) => request(`/api/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    completeTask: (taskId) => request(`/api/tasks/${encodeURIComponent(taskId)}/complete`, { method: 'POST' }),

    getSurveys: () => request('/api/surveys'),

    getStaff: () => request('/api/staff'),
    createStaff: (data) => request('/api/staff', { method: 'POST', body: JSON.stringify(data) }),
    updateStaff: (staffId, data) => request(`/api/staff/${encodeURIComponent(staffId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getAssignableStaff: () => request('/api/staff/assignable'),

    getInventoryDashboard: () => request('/api/inventory/dashboard'),
    getInventoryItems: () => request('/api/inventory/items'),
    getInventoryHistory: () => request('/api/inventory/history'),
    getMaterialRequests: () => request('/api/inventory/material-requests'),
    createInventoryItem: (data) => request('/api/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
    stockIn: (data) => request('/api/inventory/stock-in', { method: 'POST', body: JSON.stringify(data) }),
    stockOut: (data) => request('/api/inventory/stock-out', { method: 'POST', body: JSON.stringify(data) }),
    createMaterialRequest: (data) => request('/api/inventory/material-requests', { method: 'POST', body: JSON.stringify(data) }),
    updateMaterialRequest: (requestId, data) => request(`/api/inventory/material-requests/${encodeURIComponent(requestId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  };

  window.crmApi = crmApi;
})();
