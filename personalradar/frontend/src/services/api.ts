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

export interface NewsSource {
  _id?: string;
  name: string;
  url: string;
  description?: string;
  cadence_days: number;
  is_active: boolean;
  last_checked?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TechnologyDiscovery {
  id?: string;
  name: string;
  description: string;
  source_url: string;
  news_source_id: string;
  discovered_at: string;
  article_title?: string;
  article_url?: string;
  confidence_score: number;
  category?: string;
  status: string;
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

export const newsSourceApi = {
  list: async (): Promise<NewsSource[]> => {
    const response = await api.get('/news-sources/');
    return response.data;
  },
  create: async (data: NewsSource) => {
    const response = await api.post('/news-sources/', data);
    return response.data;
  },
  update: async (id: string, data: Partial<NewsSource>) => {
    const response = await api.patch(`/news-sources/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/news-sources/${id}`);
    return response.data;
  },
  markAsChecked: async (id: string) => {
    const response = await api.post(`/news-sources/${id}/check`);
    return response.data;
  },
  getDueForChecking: async (): Promise<NewsSource[]> => {
    const response = await api.get('/news-sources/due/checking');
    return response.data;
  },
};

export const technologyDiscoveryApi = {
  list: async (): Promise<TechnologyDiscovery[]> => {
    const response = await api.get('/technology-discoveries/');
    return response.data;
  },
  get: async (id: string): Promise<TechnologyDiscovery> => {
    const response = await api.get(`/technology-discoveries/${id}`);
    return response.data;
  },
  create: async (data: TechnologyDiscovery) => {
    const response = await api.post('/technology-discoveries/', data);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/technology-discoveries/${id}/status?status=${status}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/technology-discoveries/${id}`);
    return response.data;
  },
  runDiscovery: async (newsSourceId?: string) => {
    const url = newsSourceId 
      ? `/technology-discoveries/run-discovery?news_source_id=${newsSourceId}`
      : '/technology-discoveries/run-discovery';
    const response = await api.post(url);
    return response.data;
  },
  getNewSince: async (newsSourceId: string, days: number = 7) => {
    const response = await api.get(`/technology-discoveries/new-since/${newsSourceId}?days=${days}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/technology-discoveries/stats/summary');
    return response.data;
  },
};

export default api; 