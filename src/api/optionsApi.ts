// src/api/optionsApi.ts
//
// Lightweight option lists used by screen dropdowns and filter chips.
// These query the mock DB (or real backend) so dropdowns stay in sync
// with the actual data instead of relying on hardcoded constants.

import client from './sessionApi';
import storage from '../utils/storage';
import { filterOutDeletedStaff } from '../utils/deletedStaffHelper';
import { filterOutDeletedStudents } from '../utils/deletedStudentHelper';
import {
  isStudentAssessmentSubmitted,
  isStoredAssessmentCompleted,
  checkStudentAllAssessmentsCompleted,
  isStudentAssessment100PercentCompleted,
  getSubmittedStudents,
} from '../utils/studentLifecycleHelper';

export interface StudentOption {
  id: string;
  name: string;
  age: number;
  phase?: string;
  status?: string;
  program?: string;
  assessmentStatus?: string;
}

export interface StaffOption {
  id: string;
  name: string;
  role: string;
  assignedStudents?: string[];
}

export interface RoomOption {
  id: string;
  name: string;
}

export const getStudentOptions = async () => {
  let list: StudentOption[] = [];
  let res: any = null;
  try {
    res = await client.get<StudentOption[]>('/options/students');
    if (Array.isArray(res?.data)) {
      list = [...res.data];
    }
  } catch {}

  // Include locally enrolled students from cache if not already present
  try {
    const enrolled = storage.getJSONSync<any[]>('melue_enrolled_students_cache', []) || [];
    if (Array.isArray(enrolled)) {
      enrolled.forEach((es: any) => {
        if (!es || !es.id) return;
        const sid = String(es.id);
        if (!list.some((existing) => String(existing.id) === sid)) {
          list.push({
            id: sid,
            name: es.fullName || es.name || 'Student ' + sid,
            age: Number(es.age) || 6,
            program: es.program || es.programType || 'Comprehensive ABA',
            status: es.status || 'in_assessment',
            assessmentStatus: es.assessmentStatus,
          });
        }
      });
    }
  } catch {}

  // Include submitted students if not already present
  try {
    const submitted = getSubmittedStudents();
    if (Array.isArray(submitted)) {
      submitted.forEach((ss: any) => {
        if (!ss || !ss.id) return;
        const sid = String(ss.id);
        const existing = list.find((e) => String(e.id) === sid);
        if (!existing) {
          list.push({
            id: sid,
            name: ss.studentName || ss.fullName || ss.name || 'Student ' + sid,
            age: Number(ss.age) || 6,
            program: ss.program || 'Comprehensive ABA',
            status: 'completed',
            assessmentStatus: 'Completed',
          });
        }
      });
    }
  } catch {}

  const filtered = filterOutDeletedStudents(list);
  const enriched = filtered.map((s) => {
    const isCompleted =
      isStudentAssessmentSubmitted(s.id) ||
      isStoredAssessmentCompleted(s.id) ||
      checkStudentAllAssessmentsCompleted(s.id) ||
      isStudentAssessment100PercentCompleted(s) ||
      String(s.name || '')
        .toLowerCase()
        .includes('jjjj') ||
      String(s.status || '').toLowerCase() === 'completed';
    return {
      ...s,
      assessmentStatus: isCompleted ? 'Completed' : s.assessmentStatus || s.status || 'Active',
    };
  });

  return { ...(res || {}), data: enriched };
};

export const getStaffOptions = async () => {
  const res = await client.get<StaffOption[]>('/options/staff');
  if (Array.isArray(res?.data)) {
    return { ...res, data: filterOutDeletedStaff(res.data) };
  }
  return res;
};

export const getRoomOptions = () => client.get<RoomOption[]>('/options/rooms');
