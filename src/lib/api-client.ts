/**
 * API Client - switches between direct Supabase and Azure API based on environment
 */

const USE_AZURE_API = import.meta.env.VITE_API_BASE_URL !== undefined;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

export const apiClient = {
  // Auth
  async login(email: string, password: string) {
    if (!USE_AZURE_API) return null; // Use Supabase directly
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  },

  async signup(email: string, password: string, full_name: string) {
    if (!USE_AZURE_API) return null;
    
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    
    return response.json();
  },

  async logout() {
    if (!USE_AZURE_API) return;
    
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders()
    });
  },

  // Entries
  async getEntries() {
    const response = await fetch(`${API_BASE_URL}/api/entries`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch entries');
    return response.json();
  },

  async getMyEntries() {
    const response = await fetch(`${API_BASE_URL}/api/entries/my`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch entries');
    return response.json();
  },

  async getEntry(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/entries/${id}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch entry');
    return response.json();
  },

  async createEntry(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/entries`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create entry');
    }
    return response.json();
  },

  async updateEntryStatus(id: string, status: string, comment?: string) {
    const response = await fetch(`${API_BASE_URL}/api/entries/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, comment })
    });
    
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  // Files
  async getFiles(entryId: string) {
    const response = await fetch(`${API_BASE_URL}/api/entries/${entryId}/files`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async uploadFiles(entryId: string, files: File[], bucket: string, category?: string) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('bucket', bucket);
    if (category) formData.append('category', category);

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/entries/${entryId}/files`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload files');
    return response.json();
  },

  async getFileUrl(entryId: string, bucket: string, filename: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/entries/${entryId}/files/${bucket}/${encodeURIComponent(filename)}`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) throw new Error('Failed to get file URL');
    const data = await response.json();
    return data.url;
  },

  // Users
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async updateUserRole(userId: string, role: string) {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    
    if (!response.ok) throw new Error('Failed to update role');
    return response.json();
  }
};

export const useAzureAPI = USE_AZURE_API;
