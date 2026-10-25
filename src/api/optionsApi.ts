// src/api/optionsApi.ts
//
// Lightweight option lists used by screen dropdowns and filter chips.
// These query the mock DB (or real backend) so dropdowns stay in sync
// with the actual data instead of relying on hardcoded constants.

import client from './sessionApi';
import { filterOutDeletedStaff } from '../utils/deletedStaffHelper';
import { filterOutDeletedStudents } from '../utils/deletedStudentHelper';

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
  const res = await client.get<StudentOption[]>('/options/students');
  if (Array.isArray(res?.data)) {
    return { ...res, data: filterOutDeletedStudents(res.data) };
  }
  return res;
};
export const getStaffOptions = async () => {
  const res = await client.get<StaffOption[]>('/options/staff');
  if (Array.isArray(res?.data)) {
    return { ...res, data: filterOutDeletedStaff(res.data) };
  }
  return res;
};
export const getRoomOptions = () => client.get<RoomOption[]>('/options/rooms');
