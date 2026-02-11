import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const getProjects = () => api.get('/projects');
export const createProject = (data: any) => api.post('/projects', data);
export const getProject = (id: number) => api.get(`/projects/${id}`);
export const deleteProject = (id: number) => api.delete(`/projects/${id}`);

// Houses
export const getHouses = (projectId: number) => api.get(`/projects/${projectId}/houses`);
export const createHouse = (projectId: number, data: any) => api.post(`/projects/${projectId}/houses`, data);
export const getHouse = (id: number) => api.get(`/houses/${id}`);
export const deleteHouse = (id: number) => api.delete(`/houses/${id}`);

// Surveys
export const getSurvey = (houseId: number) => api.get(`/houses/${houseId}/survey`);
export const createOrUpdateSurvey = (houseId: number, data: any) => api.post(`/houses/${houseId}/survey`, data);

// Designs
export const autoDesign = (houseId: number, data: any) => api.post(`/houses/${houseId}/design/auto`, data);
export const getDesign = (houseId: number) => api.get(`/houses/${houseId}/design`);
export const updateDesign = (houseId: number, data: any) => api.put(`/houses/${houseId}/design`, data);

// BOM
export const getBOM = (designId: number) => api.get(`/designs/${designId}/bom`);

export default api;
