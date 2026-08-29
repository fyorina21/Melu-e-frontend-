// src/api/optionsApi.ts
//
// Lightweight option lists used by screen dropdowns and filter chips.
// These query the mock DB (or real backend) so dropdowns stay in sync
// with the actual data instead of relying on hardcoded constants.

import client from './sessionApi';

export interface StudentOption {
  id: string;
  name: string;
  age: number;
  phase?: string;
}

export interface StaffOption {
  id: string;
  name: string;
  role: string;
}

export interface RoomOption {
  id: string;
  name: string;
}

export const getStudentOptions = () => client.get<StudentOption[]>('/options/students');
export const getStaffOptions = () => client.get<StaffOption[]>('/options/staff');
export const getRoomOptions = () => client.get<RoomOption[]>('/options/rooms');
