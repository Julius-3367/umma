import axios from './axios';

const API_PREFIX = 'recruiter';
const buildUrl = (path = '') => (path ? `${API_PREFIX}/${path}` : API_PREFIX);

export const recruiterService = {
  getDashboard: (params) => axios.get(buildUrl('dashboard'), { params }),
  createJobOpening: (payload) => axios.post(buildUrl('jobs'), payload),
  getPipelineCandidates: () => axios.get(buildUrl('pipeline/candidates')),
  getCandidatePipelineEvents: (candidateId) => axios.get(buildUrl(`pipeline/${candidateId}/events`)),
  transitionCandidateStage: (candidateId, payload) => axios.post(buildUrl(`pipeline/${candidateId}/transition`), payload),
};

export default recruiterService;
