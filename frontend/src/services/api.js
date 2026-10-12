import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://referral-management-backend-0mgl.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Try to get a new access token
        const res = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });
        
        const newAccessToken = res.data.token;
        localStorage.setItem('accessToken', newAccessToken);
        
        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/api/auth/logout', { refreshToken });
  },
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const jobService = {
  getJobs: () => api.get('/api/jobs'),
  getJobById: (id) => api.get(`/api/jobs/${id}`),
  createJob: (jobData) => api.post('/api/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/api/jobs/${id}`, jobData),
  closeJob: (id) => api.patch(`/api/jobs/${id}/status`),
};

export const referralService = {
  createReferral: (referralData) => {
    const isFormData = typeof FormData !== 'undefined' && referralData instanceof FormData;
    return api.post('/api/referrals', referralData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },
  getMySubmissions: () => api.get('/api/referrals/my-submissions'),
  getAllReferrals: () => api.get('/api/referrals'),
  updateStatus: (id, status, remarks) => api.patch(`/api/referrals/${id}/status`, { status, remarks }),
  verifyEmail: (token) => api.get('/api/referrals/verify-email', { params: { token } }),
  sendVerificationEmail: (candidateId) => api.post(`/api/referrals/${candidateId}/send-verification`),
  sendReferralEmail: (referralId, payload) => api.post(`/api/referrals/${referralId}/send-email`, payload),
  getResume: (referralId) => api.get(`/api/referrals/${referralId}/resume`, { responseType: 'blob' }),
};

export const hrService = {
  getDashboard: () => api.get('/api/hr/dashboard'),
};

export const employeeService = {
  getDashboard: () => api.get('/api/employee/dashboard'),
};

export const adminService = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getEmployees: (params) => api.get('/api/admin/employees', { params }),
  getHR: (params) => api.get('/api/admin/hr', { params }),
  getCandidates: (params) => api.get('/api/admin/candidates', { params }),
  getJobs: (params) => api.get('/api/admin/jobs', { params }),
  toggleJobStatus: (id, status) => api.patch(`/api/admin/jobs/${id}/status`, { status }),
  getReferrals: (params) => api.get('/api/admin/referrals', { params }),
  getActivityLogs: (params) => api.get('/api/admin/activity-logs', { params }),
  getEmailHistory: (params) => api.get('/api/admin/email-history', { params }),
};

export const userService = {
  getEmployees: (params) => api.get('/api/admin/employees', { params }),
  getUsers: (params) => api.get('/api/users', { params }),
  createEmployee: (userData) => api.post('/api/auth/register', userData),
};

export const profileService = {
  getProfile: () => api.get('/api/profile'),
  updateProfile: (profileData) => api.put('/api/profile', profileData),
  uploadAvatar: (formData) =>
    api.post('/api/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  changePassword: (passwordData) => api.put('/api/profile/password', passwordData),
};

export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (
    avatarPath.startsWith('http://') ||
    avatarPath.startsWith('https://') ||
    avatarPath.startsWith('blob:') ||
    avatarPath.startsWith('data:')
  ) {
    return avatarPath;
  }
  return avatarPath;
};

export default api;

