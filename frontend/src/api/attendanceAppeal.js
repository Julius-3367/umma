import axiosInstance from './axios';

/**
 * Attendance Appeals API Service
 */

/**
 * CANDIDATE: Submit attendance appeal
 */
export const submitAttendanceAppeal = async (attendanceId, appealData) => {
  const response = await axiosInstance.post(
    `/candidate/attendance/${attendanceId}/appeal`,
    appealData
  );
  return response.data;
};

/**
 * CANDIDATE: Get my appeals
 */
export const getMyAppeals = async (filters = {}) => {
  const response = await axiosInstance.get('/candidate/attendance/appeals', {
    params: filters,
  });
  return response.data;
};

/**
 * CANDIDATE: Cancel pending appeal
 */
export const cancelAppeal = async (appealId) => {
  const response = await axiosInstance.delete(
    `/candidate/attendance/appeals/${appealId}`
  );
  return response.data;
};

/**
 * TRAINER: Get appeals for my courses
 */
export const getTrainerAppeals = async (filters = {}) => {
  const response = await axiosInstance.get('/trainer/attendance/appeals', {
    params: filters,
  });
  return response.data;
};

/**
 * TRAINER: Review appeal
 */
export const reviewAppeal = async (appealId, reviewData) => {
  const response = await axiosInstance.put(
    `/trainer/attendance/appeals/${appealId}/review`,
    reviewData
  );
  return response.data;
};

/**
 * ADMIN: Get all appeals
 */
export const getAdminAppeals = async (filters = {}) => {
  const response = await axiosInstance.get('/admin/attendance/appeals', {
    params: filters,
  });
  return response.data;
};

/**
 * ADMIN: Override appeal decision
 */
export const overrideAppeal = async (appealId, overrideData) => {
  const response = await axiosInstance.put(
    `/admin/attendance/appeals/${appealId}/override`,
    overrideData
  );
  return response.data;
};

export default {
  submitAttendanceAppeal,
  getMyAppeals,
  cancelAppeal,
  getTrainerAppeals,
  reviewAppeal,
  getAdminAppeals,
  overrideAppeal,
};
