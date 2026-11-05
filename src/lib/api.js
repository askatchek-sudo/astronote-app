// ─── CONFIGURATION DE BASE ───
const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }
  return data;
};

// ─── API ADMIN ───
export const adminAPI = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  getVentes: async () => {
    const res = await fetch(`${API_URL}/admin/ventes`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  getMessages: async () => {
    const res = await fetch(`${API_URL}/admin/messages`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ─── API UTILISATEURS ───
export const usersAPI = {
  register: async (data) => {
    const res = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  }
};

// ─── API AUTHENTIFICATION ───
export const authAPI = {
  login: async (identifier, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return await handleResponse(res);
  },
  
  me: async () => {
    const res = await fetch(`${API_URL}/auth/me`, { 
      headers: getAuthHeaders() 
    });
    return await handleResponse(res);
  }
};

// ─── API ARTISTES ───
export const artistesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/artistes`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/artistes/${id}`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/artistes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/artistes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/artistes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  }
};

// ─── API ALBUMS ───
export const albumsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/albums`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/albums/${id}`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/albums`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/albums/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/albums/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },
  acheterAlbum: async (data) => {
    const res = await fetch(`${API_URL}/albums/acheter`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  }
};

// ─── API MORCEAUX ───
export const morceauxAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/morceaux`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/morceaux/${id}`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/morceaux`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/morceaux/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/morceaux/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },
  incrementStream: async (id) => {
    try {
      const res = await fetch(`${API_URL}/morceaux/${id}/stream`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Erreur increment stream frontend:", error);
    }
  },
  telecharger: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Vous devez être connecté pour télécharger');
    
    const url = `${API_URL}/download/${id}`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur lors du téléchargement');
    }
    
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'morceau.mp3';
    if (disposition && disposition.includes('filename=')) {
      filename = decodeURIComponent(disposition.split('filename=')[1].replace(/"/g, ''));
    }
    
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }
};

// ─── API ÉVÉNEMENTS ───
export const evenementsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/evenements`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/evenements/${id}`);
    return await handleResponse(res);
  },
  getCategorieTickets: async (evenementId) => {
    const res = await fetch(`${API_URL}/evenements/${evenementId}/categories`);
    return await handleResponse(res);
  },
  acheterTickets: async (data) => {
    const res = await fetch(`${API_URL}/evenements/acheter`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  }
};

// ─── API ACHATS ───
export const achatsAPI = {
  mesMorceaux: async () => {
    const res = await fetch(`${API_URL}/achats/mes-morceaux`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  mesAlbums: async () => {
    const res = await fetch(`${API_URL}/achats/mes-albums`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  mesTickets: async () => {
    const res = await fetch(`${API_URL}/achats/mes-tickets`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  acheterMorceau: async (morceauId) => {
    const res = await fetch(`${API_URL}/achats/acheter-morceau`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ morceauId })
    });
    return await handleResponse(res);
  }
};

// ─── API FAVORIS ───
export const favorisAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/favoris`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  toggle: async (morceauId) => {
    const res = await fetch(`${API_URL}/favoris/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ morceauId: parseInt(morceauId) })
    });
    return await handleResponse(res);
  }
};

// ─── API PLAYLISTS ───
export const playlistsAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/playlists`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/playlists/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },
  addMorceau: async (playlistId, morceauId) => {
    const res = await fetch(`${API_URL}/playlists/${playlistId}/morceaux`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ morceauId: parseInt(morceauId) })
    });
    return await handleResponse(res);
  },
  removeMorceau: async (playlistId, morceauId) => {
    const res = await fetch(`${API_URL}/playlists/${playlistId}/morceaux/${morceauId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  }
};

// ─── API MESSAGES (CONTACT) ───
export const messagesAPI = {
  send: async (data) => {
    const res = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_URL}/messages`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  markAsRead: async (id) => {
    const res = await fetch(`${API_URL}/messages/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/messages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await handleResponse(res);
  }
};

// ─── API PAIEMENTS ARTISTES ───
export const paiementsAPI = {
  getStatsMensuelles: async () => {
    const res = await fetch(`${API_URL}/paiements/stats-mensuelles`, { 
      headers: getAuthHeaders() 
    });
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/paiements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  }
};

// ✅ NOUVEAU : API UPLOAD CLOUDINARY (Corrigé pour FormData)
export const uploadAPI = {
  image: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // ⚠️ IMPORTANT : Ne pas mettre 'Content-Type' ici. 
    // Le navigateur le définira automatiquement en multipart/form-data avec la bonne boundary.
    
    const res = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    return await handleResponse(res);
  },
  
  audio: async (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_URL}/upload/audio`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    return await handleResponse(res);
  }
};

// ✅ Alias pour compatibilité
export const contactAPI = messagesAPI;