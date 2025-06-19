import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Technology {
  _id?: string;
  name: string;
  quadrant: string;
  ring: string;
  description: string;
  source: string;
  date_of_assessment: string;
  uri?: string;
  created_at?: string;
  updated_at?: string;
}

export const authApi = {
  loginWithGoogle: async (token: string) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const technologyApi = {
  list: async (): Promise<Technology[]> => {
    const response = await api.get('/technologies/');
    return response.data;
  },
  create: async (data: Technology) => {
    const response = await api.post('/technologies/', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Technology>) => {
    const response = await api.patch(`/technologies/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/technologies/${id}`);
    return response.data;
  },
};

export default api; 