// src/api/optionsApi.ts
//
// Lightweight option lists used by screen dropdowns and filter chips.
// These query the mock DB (or real backend) so dropdowns stay in sync
// with the actual data instead of relying on hardcoded constants.

import client from './sessionApi';
import { filterOutDeletedStaff } from '../utils/deletedStaffHelper';

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

export const getStudentOptions = () => client.get<StudentOption[]>('/options/students');
export const getStaffOptions = async () => {
  const res = await client.get<StaffOption[]>('/options/staff');
  if (Array.isArray(res?.data)) {
    return { ...res, data: filterOutDeletedStaff(res.data) };
  }
  return res;
};
export const getRoomOptions = () => client.get<RoomOption[]>('/options/rooms');

export const getProgramOptions = async (): Promise<{ data: string[] }> => {
  try {
    const res = await client.get<any>('/options/programs');
    const raw = Array.isArray(res?.data) ? res.data : res?.data?.data || res?.data?.programs;
    if (Array.isArray(raw) && raw.length > 0) {
      const list = raw.map((item: any) =>
        typeof item === 'string' ? item : item?.name || item?.label || item?.value || String(item),
      );
      return { data: Array.from(new Set(list)) };
    }
  } catch {}
  return {
    data: ['Regular Morning', 'Regular Afternoon', 'Pulled Out'],
  };
};

export const getTherapyGroupOptions = async (): Promise<{ data: string[] }> => {
  try {
    const res = await client.get<any>('/options/therapy_groups');
    const raw = Array.isArray(res?.data) ? res.data : res?.data?.data || res?.data?.therapy_groups;
    if (Array.isArray(raw) && raw.length > 0) {
      const list = raw.map((item: any) =>
        typeof item === 'string' ? item : item?.name || item?.label || item?.value || String(item),
      );
      return { data: Array.from(new Set(list)) };
    }
  } catch {}
  return {
    data: ['Basic', 'Functional Living'],
  };
};

export const getStatusOptions = async (): Promise<{ data: string[] }> => {
  try {
    const res = await client.get<any>('/options/statuses');
    const raw = Array.isArray(res?.data) ? res.data : res?.data?.data || res?.data?.statuses;
    if (Array.isArray(raw) && raw.length > 0) {
      const list = raw.map((item: any) =>
        typeof item === 'string' ? item : item?.name || item?.label || item?.value || String(item),
      );
      return { data: Array.from(new Set(list)) };
    }
  } catch {}
  return {
    data: ['Active', 'Inactive', 'Draft', 'Archived'],
  };
};
