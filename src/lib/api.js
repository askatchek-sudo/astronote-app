// ─── CONFIGURATION DE BASE ───
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    const res = await fetch(`${API_URL}/api/admin/stats`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  getVentes: async () => {
    const res = await fetch(`${API_URL}/api/admin/ventes`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  getMessages: async () => {
    const res = await fetch(`${API_URL}/api/admin/messages`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ─── API UTILISATEURS ───
export const usersAPI = {
  register: async (data) => {
    const res = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_URL}/api/users/profile`, {
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
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return await handleResponse(res);
  },
  me: async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ─── API ARTISTES ───
export const artistesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/artistes`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/api/artistes/${id}`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/api/artistes`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/api/artistes/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/artistes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ─── API ALBUMS ───
export const albumsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/albums`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/api/albums/${id}`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/api/albums`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/api/albums/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/albums/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  acheterAlbum: async (data) => {
    const res = await fetch(`${API_URL}/api/albums/acheter`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  }
};

// ─── API MORCEAUX ───
export const morceauxAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/morceaux`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/api/morceaux/${id}`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/api/morceaux`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/api/morceaux/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/morceaux/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  incrementStream: async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/morceaux/${id}/stream`, { method: 'POST', headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch (error) {
      console.error("Erreur increment stream frontend:", error);
    }
  },
  telecharger: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Vous devez être connecté pour télécharger');
    const url = `${API_URL}/api/download/${id}`;
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
    const res = await fetch(`${API_URL}/api/evenements`);
    return await handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_URL}/api/evenements/${id}`);
    return await handleResponse(res);
  },
  getCategorieTickets: async (evenementId) => {
    const res = await fetch(`${API_URL}/api/evenements/${evenementId}/categories`);
    return await handleResponse(res);
  },
  acheterTickets: async (data) => {
    const res = await fetch(`${API_URL}/api/tickets/acheter`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  }
};

// ─── API ACHATS ───
export const achatsAPI = {
  mesMorceaux: async () => {
    const res = await fetch(`${API_URL}/api/achats/mes-morceaux`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  mesAlbums: async () => {
    const res = await fetch(`${API_URL}/api/achats/mes-albums`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  mesTickets: async () => {
    const res = await fetch(`${API_URL}/api/achats/mes-tickets`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  acheterMorceau: async (morceauId) => {
    const res = await fetch(`${API_URL}/api/achats/acheter-morceau`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ morceauId }) });
    return await handleResponse(res);
  }
};

// ─── API FAVORIS ───
export const favorisAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/api/favoris`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  toggle: async (morceauId) => {
    const res = await fetch(`${API_URL}/api/favoris/toggle`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ morceauId: parseInt(morceauId) }) });
    return await handleResponse(res);
  }
};

// ─── API PLAYLISTS ───
export const playlistsAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/api/playlists`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/api/playlists`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/playlists/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  addMorceau: async (playlistId, morceauId) => {
    const res = await fetch(`${API_URL}/api/playlists/${playlistId}/morceaux`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ morceauId: parseInt(morceauId) }) });
    return await handleResponse(res);
  },
  removeMorceau: async (playlistId, morceauId) => {
    const res = await fetch(`${API_URL}/api/playlists/${playlistId}/morceaux/${morceauId}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ─── API MESSAGES (CONTACT) ───
export const messagesAPI = {
  send: async (data) => {
    const res = await fetch(`${API_URL}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/messages`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  markAsRead: async (id) => {
    const res = await fetch(`${API_URL}/api/messages/${id}/read`, { method: 'PUT', headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/messages/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ─── API PAIEMENTS ARTISTES ───
export const paiementsAPI = {
  getStatsMensuelles: async () => {
    const res = await fetch(`${API_URL}/api/paiements/stats-mensuelles`, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/api/paiements`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  }
};

// ─── API UPLOAD CLOUDINARY ───
export const uploadAPI = {
  image: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', headers, body: formData });
    return await handleResponse(res);
  },
  audio: async (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/upload/audio`, { method: 'POST', headers, body: formData });
    return await handleResponse(res);
  }
};

// ─── API PAIEMENT (CAMERPAY) ───
export const paiementAPI = {
  initier: async (data) => {
    const res = await fetch(`${API_URL}/api/paiement/initier`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  }
};

// ─── API ACTUALITÉS ───
export const actualitesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/actualites`);
    return await handleResponse(res);
  },
  getClassement: async () => {
    const res = await fetch(`${API_URL}/api/actualites/classement`);
    return await handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/api/actualites`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return await handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/actualites/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return await handleResponse(res);
  }
};

// ✅ Alias pour compatibilité
export const contactAPI = messagesAPI;