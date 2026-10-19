import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDirectorDashboard, getFoundationOverview } from '../../../api/directorApi';
import client from '../../../api/sessionApi';

describe('Director Dashboard Student Numbers and Directory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aggregates exact student count and real students list when /director/dashboard is not a direct backend route', async () => {
    const mockStudents = [
      {
        id: '1',
        full_name: 'Amir Hassan',
        age: 7,
        program_type: 'regular',
        therapy_group: 'basic',
        status: 'in_assessment',
      },
      {
        id: '2',
        full_name: 'Tigist Bekele',
        age: 8,
        program_type: 'pulled_out',
        therapy_group: 'basic',
        status: 'in_assessment',
      },
      {
        id: '3',
        full_name: 'Saron Tekle',
        age: 9,
        program_type: 'regular',
        therapy_group: 'basic',
        status: 'ready_for_iup',
      },
      {
        id: '4',
        full_name: 'Biniam Hailu',
        age: 13,
        program_type: 'regular',
        therapy_group: 'functional_living',
        status: 'ready_for_iup',
      },
      {
        id: '5',
        full_name: 'Yonas Girma',
        age: 8,
        program_type: 'regular',
        therapy_group: 'basic',
        status: 'active_therapy',
      },
      {
        id: '6',
        full_name: 'Meron Haile',
        age: 9,
        program_type: 'regular',
        therapy_group: 'basic',
        status: 'active_therapy',
      },
      {
        id: '7',
        full_name: 'Abel Tadesse',
        age: 7,
        program_type: 'pulled_out',
        therapy_group: 'basic',
        status: 'active_therapy',
      },
      {
        id: '8',
        full_name: 'Liya Belay',
        age: 10,
        program_type: 'regular',
        therapy_group: 'basic',
        status: 'active_therapy',
      },
      {
        id: '9',
        full_name: 'Natnael Worku',
        age: 13,
        program_type: 'regular',
        therapy_group: 'functional_living',
        status: 'active_therapy',
      },
      {
        id: '10',
        full_name: 'Hiwot Alemu',
        age: 12,
        program_type: 'pulled_out',
        therapy_group: 'functional_living',
        status: 'active_therapy',
      },
      {
        id: '11',
        full_name: 'new student',
        age: 6,
        program_type: 'regular',
        therapy_group: 'basic',
        status: 'registered',
      },
    ];

    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url === '/director/dashboard') {
        throw new Error('404 Not Found');
      }
      if (url === '/students') {
        return {
          data: {
            success: true,
            data: mockStudents,
            meta: { total_count: 11 },
          },
        } as any;
      }
      if (url === '/options/staff') {
        return { data: [{ id: 'st-1', name: 'Abeba Tadesse', role: 'teacher' }] } as any;
      }
      if (url === '/program_director/dashboard') {
        return {
          data: {
            students_in_assessment: 2,
            assessment_complete: 2,
            active_iup_plans: 7,
            goals_assigned_this_month: 13,
          },
        } as any;
      }
      return { data: [] } as any;
    });

    const res = await getDirectorDashboard();
    expect(res.data).toBeDefined();
    expect(res.data.totalStudents).toBe(11);
    expect(res.data.studentsList).toHaveLength(11);
    expect(res.data.studentsList[0].name).toBe('Amir Hassan');
    expect(res.data.studentsList[0].status).toBe('In Assessment');
    expect(res.data.studentsList[2].status).toBe('Ready for IUP');
    expect(res.data.studentsList[4].status).toBe('In Session');
    expect(res.data.studentsList[10].status).toBe('Not Started');
  });

  it('normalizes total_active_students in getFoundationOverview to totalStudents', async () => {
    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url === '/reports/foundation_overview') {
        return {
          data: {
            data: {
              total_active_students: 11,
              goals_mastered_this_month: 0,
            },
          },
        } as any;
      }
      return { data: {} } as any;
    });

    const res = await getFoundationOverview();
    expect(res.data.totalStudents).toBe(11);
  });
});
