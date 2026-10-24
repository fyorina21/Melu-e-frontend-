import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProgramDirectorDashboard } from '../../../../api/programDirectorApi';
import client from '../../../../api/sessionApi';

describe('Program Director Dashboard Student Numbers and Directory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly maps all 11 students with exact stage counts and statuses', async () => {
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
      if (url === '/students') {
        return {
          data: {
            success: true,
            data: mockStudents,
            meta: { total_count: 11 },
          },
        } as any;
      }
      if (url === '/options/students') {
        return {
          data: mockStudents.map((s) => ({
            id: s.id,
            name: s.full_name,
            age: s.age,
            status:
              s.status === 'in_assessment'
                ? 'In assessment'
                : s.status === 'ready_for_iup'
                  ? 'Ready for iup'
                  : s.status === 'active_therapy'
                    ? 'Active therapy'
                    : 'Registered',
            program: s.program_type,
          })),
        } as any;
      }
      if (url === '/options/staff') {
        return { data: [{ id: 'st-1', name: 'Abeba Tadesse', role: 'teacher' }] } as any;
      }
      return { data: [] } as any;
    });

    const res = await getProgramDirectorDashboard();
    const data = res.data;

    expect(data.totalStudents).toBe(11);
    expect(data.inAssessment).toBe(2);
    expect(data.assessmentCompleted).toBe(2);
    expect(data.readyForSessions).toBe(6);

    const stages = data.workflowStages;
    expect(stages.find((st: any) => st.key === 'enrolled')?.count).toBe(1);
    expect(stages.find((st: any) => st.key === 'in-assessment')?.count).toBe(2);
    expect(stages.find((st: any) => st.key === 'assessment-complete')?.count).toBe(2);
    expect(stages.find((st: any) => st.key === 'session-assigned')?.count).toBe(0);
    expect(stages.find((st: any) => st.key === 'in-session')?.count).toBe(6);

    const totalStageCount = stages.reduce((sum: number, st: any) => sum + st.count, 0);
    expect(totalStageCount).toBe(11);

    expect(data.students).toHaveLength(11);
    expect(data.students[0].fullName).toBe('Amir Hassan');
    expect(data.students[0].currentStage).toBe('in-assessment');
    expect(data.students[2].fullName).toBe('Saron Tekle');
    expect(data.students[2].currentStage).toBe('assessment-complete');
    expect(data.students[4].fullName).toBe('Yonas Girma');
    expect(data.students[4].currentStage).toBe('in-session');
    expect(data.students[10].fullName).toBe('new student');
    expect(data.students[10].currentStage).toBe('enrolled');
  });
});
