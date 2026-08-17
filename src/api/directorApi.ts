import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-DIR-001: Director Dashboard
export const getDirectorDashboard = () => client.get('/director/dashboard');

// SCR-DIR-002: Staff Scheduling (same operational data as SCR-TC-005, Director-level view)
export const getDirectorSchedule = (params: QueryParams) => client.get('/director/schedule', { params });
export const saveAssignment = (payload: Payload) => client.post('/director/schedule/assignments', payload);
export const removeAllAssignments = (blockId: string) => client.post(`/director/schedule/blocks/${blockId}/clear`);

// SCR-DIR-003: Goal Mastery Approval
export const getPendingMasteryApprovals = (params: QueryParams) => client.get('/director/mastery-approvals', { params });
export const getMasteryApprovalDetail = (goalId: string) => client.get(`/director/mastery-approvals/${goalId}`);
export const approveMastery = (goalId: string, payload: Payload) => client.post(`/director/mastery-approvals/${goalId}/approve`, payload);
export const rejectMastery = (goalId: string, payload: Payload) => client.post(`/director/mastery-approvals/${goalId}/reject`, payload);

// SCR-DIR-004: Parent Communication (Director View)
export const getDirectorConversations = (params: QueryParams) => client.get('/director/conversations', { params });
export const getDirectorConversationThread = (id: string) => client.get(`/director/conversations/${id}`);
export const sendDirectorMessage = (id: string, payload: Payload) => client.post(`/director/conversations/${id}/messages`, payload);
export const toggleConversationRead = (id: string, payload: Payload) => client.post(`/director/conversations/${id}/read-status`, payload);

// SCR-DIR-005: Reports & Oversight
export const getSessionReports = (params: QueryParams) => client.get('/director/reports/sessions', { params });
export const generateBiAnnualReport = (payload: Payload) => client.post('/director/reports/bi-annual', payload);
export const getFoundationOverview = () => client.get('/director/reports/foundation-overview');

// SCR-DIR-006: Student Progress Monitoring (Director View)
export const getDirectorStudentProgress = (studentId: string) => client.get(`/director/students/${studentId}/progress`);

// MR-46: Report Builder & Export
export const generateCustomReport = (payload: Payload) =>
  // payload: { program, therapist, ageFrom, ageTo, attendanceMax, dateFrom, dateTo, diagnosis }
  client.post('/director/reports/custom', payload);
export const getReportBuilderMeta = () => client.get('/director/reports/custom/meta');
