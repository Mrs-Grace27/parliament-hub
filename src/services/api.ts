import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parliament_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('parliament_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'speaker' | 'admin' | 'listener';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  participants: number;
  createdAt: string;
}

export interface Motion {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  roomId: string;
  status: 'pending' | 'active' | 'voting' | 'closed';
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  createdAt: string;
}

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string, role: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Rooms API
export const roomsApi = {
  getRooms: async (): Promise<{ rooms: Room[] }> => {
    const response = await api.get('/rooms');
    return response.data;
  },

  createRoom: async (name: string, description: string, isPrivate: boolean = false): Promise<{ room: Room }> => {
    const response = await api.post('/rooms', { name, description, isPrivate });
    return response.data;
  },

  getRoom: async (id: string): Promise<{ room: Room }> => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  updateRoom: async (id: string, data: Partial<Room>): Promise<{ room: Room }> => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },

  deleteRoom: async (id: string): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },

  joinRoom: async (id: string): Promise<void> => {
    await api.post(`/rooms/${id}/join`);
  },

  leaveRoom: async (id: string): Promise<void> => {
    await api.post(`/rooms/${id}/leave`);
  },
};

// Motions API
export const motionsApi = {
  getMotions: async (params?: {
    roomId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ motions: Motion[]; pagination: any }> => {
    const response = await api.get('/motions', { params });
    return response.data;
  },

  createMotion: async (title: string, description: string, roomId: string, type: string = 'standard'): Promise<{ motion: Motion }> => {
    const response = await api.post('/motions', { title, description, roomId, type });
    return response.data;
  },

  getMotion: async (id: string): Promise<{ motion: Motion }> => {
    const response = await api.get(`/motions/${id}`);
    return response.data;
  },

  updateMotion: async (id: string, data: Partial<Motion>): Promise<{ motion: Motion }> => {
    const response = await api.put(`/motions/${id}`, data);
    return response.data;
  },

  deleteMotion: async (id: string): Promise<void> => {
    await api.delete(`/motions/${id}`);
  },

  voteOnMotion: async (id: string, vote: 'for' | 'against' | 'abstain'): Promise<void> => {
    await api.post(`/motions/${id}/vote`, { vote });
  },

  startVoting: async (id: string): Promise<void> => {
    await api.post(`/motions/${id}/start-voting`);
  },

  endVoting: async (id: string): Promise<void> => {
    await api.post(`/motions/${id}/end-voting`);
  },
};

// Files API
export const filesApi = {
  uploadFile: async (file: File, description?: string, motionId?: string, roomId?: string): Promise<{ file: any }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (motionId) formData.append('motionId', motionId);
    if (roomId) formData.append('roomId', roomId);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getFiles: async (params?: {
    motionId?: string;
    roomId?: string;
    uploadedBy?: string;
  }): Promise<{ files: any[] }> => {
    const response = await api.get('/files', { params });
    return response.data;
  },

  deleteFile: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};

// Health check
export const healthApi = {
  checkHealth: async (): Promise<{ status: string; timestamp: string; uptime: number }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;