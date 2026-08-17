import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-PD-001: Dashboard
export const getProgramDirectorDashboard = () => client.get('/program-director/dashboard');

// SCR-PD-002: Assessment Review & Approval
export const getAssessmentsForReview = (params: QueryParams) => client.get('/program-director/assessments', { params });
export const getAssessmentReport = (studentId: string) => client.get(`/program-director/assessments/${studentId}/report`);
export const markAssessmentReviewed = (studentId: string, payload: Payload) =>
  client.post(`/program-director/assessments/${studentId}/mark-reviewed`, payload);
export const addAssessmentNote = (studentId: string, payload: Payload) =>
  client.post(`/program-director/assessments/${studentId}/notes`, payload);

// SCR-PD-003: IUP Generation & Management
export const getIupCandidates = () => client.get('/program-director/iup/candidates');
export const getIupContext = (studentId: string) => client.get(`/program-director/iup/${studentId}/context`);
export const saveIupDraft = (studentId: string, payload: Payload) => client.post(`/program-director/iup/${studentId}/draft`, payload);
export const finalizeIup = (studentId: string, payload: Payload) => client.post(`/program-director/iup/${studentId}/finalize`, payload);

// SCR-PD-004: IUP Library Management
export const getIupLibrary = (params: QueryParams) => client.get('/program-director/iup-library', { params });
export const archiveIup = (iupId: string) => client.post(`/program-director/iup-library/${iupId}/archive`);

// SCR-PD-005: Student Caseload Management (Goal Bank browser + assignment)
export const getStudentCaseload = (studentId: string) => client.get(`/program-director/caseload/${studentId}`);
export const getGoalBank = (params: QueryParams) => client.get('/program-director/goal-bank', { params });
export const assignGoalToSlot = (studentId: string, payload: Payload) =>
  // payload: { goalId, station, slot }
  client.post(`/program-director/caseload/${studentId}/assign-goal`, payload);
export const removeGoalFromSlot = (studentId: string, payload: Payload) =>
  client.post(`/program-director/caseload/${studentId}/remove-goal`, payload);

// SCR-PD-006: Clinical Quality Monitoring (Goal Bank management)
export const createGoal = (payload: Payload) => client.post('/program-director/goal-bank', payload);
export const updateGoal = (goalId: string, payload: Payload) => client.patch(`/program-director/goal-bank/${goalId}`, payload);
export const deactivateGoal = (goalId: string) => client.post(`/program-director/goal-bank/${goalId}/deactivate`);
export const deleteGoal = (goalId: string) => client.delete(`/program-director/goal-bank/${goalId}`);

// SCR-PD-007: Parent Communication (Program Director View)
export const getPdConversations = (params: QueryParams) => client.get('/program-director/conversations', { params });
export const getPdConversationThread = (conversationId: string) => client.get(`/program-director/conversations/${conversationId}`);
export const sendPdMessage = (conversationId: string, payload: Payload) =>
  client.post(`/program-director/conversations/${conversationId}/messages`, payload);
export const escalateToDirector = (conversationId: string, payload: Payload) =>
  client.post(`/program-director/conversations/${conversationId}/escalate`, payload);

// SCR-PD-008: Graph & Chart View
export const getChartData = (params: QueryParams) =>
  // params: { studentId, chartType, goalIds, dateRange }
  client.get('/program-director/charts', { params });
export const exportChart = (params: QueryParams) => client.get('/program-director/charts/export', { params });
