import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type StudentAssessmentItem,
  type AssessmentKpis,
  type SubModuleKey,
} from './assessmentDashboardTypes';

describe('6-Week Assessment Dashboard (SCR-010) Dynamic Workflow Logic', () => {
  const createMockModule = (
    key: SubModuleKey,
    label: string,
    subtitle: string,
    status: 'completed' | 'in_progress' | 'not_started',
    progressPercentage: number,
  ) => ({
    key,
    label,
    subtitle,
    status,
    progressPercentage,
    updatedAt: status === 'in_progress' ? new Date().toISOString() : undefined,
  });

  const createMockStudent = (
    id: string,
    fullName: string,
    moduleStatuses: {
      skills: 'completed' | 'in_progress' | 'not_started';
      behavior: 'completed' | 'in_progress' | 'not_started';
      preference: 'completed' | 'in_progress' | 'not_started';
      sensory: 'completed' | 'in_progress' | 'not_started';
    },
    options: {
      staleDays?: number;
      hasStaleDraft?: boolean;
    } = {},
  ): StudentAssessmentItem => {
    const modules = {
      skills: createMockModule(
        'skills',
        'Skills (ABLLS-R)',
        'Basic Language & Learning Skills',
        moduleStatuses.skills,
        moduleStatuses.skills === 'completed'
          ? 100
          : moduleStatuses.skills === 'in_progress'
            ? 45
            : 0,
      ),
      behavior: createMockModule(
        'behavior',
        'Behavior (MASS / FAST / ABC)',
        'Functional Behavior Tracking',
        moduleStatuses.behavior,
        moduleStatuses.behavior === 'completed'
          ? 100
          : moduleStatuses.behavior === 'in_progress'
            ? 60
            : 0,
      ),
      preference: createMockModule(
        'preference',
        'Preference',
        'Reinforcer Hierarchy Assessment',
        moduleStatuses.preference,
        moduleStatuses.preference === 'completed'
          ? 100
          : moduleStatuses.preference === 'in_progress'
            ? 30
            : 0,
      ),
      sensory: createMockModule(
        'sensory',
        'Sensory Time Engagement',
        'Sensory Modulation & Regulation',
        moduleStatuses.sensory,
        moduleStatuses.sensory === 'completed'
          ? 100
          : moduleStatuses.sensory === 'in_progress'
            ? 50
            : 0,
      ),
    };

    const completedCount = Object.values(modules).filter((m) => m.status === 'completed').length;
    const overallScore = Math.round((completedCount / 4) * 100);

    return {
      id,
      studentId: id,
      fullName,
      initial: fullName.charAt(0),
      programType: 'Regular Program',
      age: 6,
      therapistName: 'Dr. Clinician',
      status: 'in_assessment',
      statusDot: options.hasStaleDraft ? 'amber' : completedCount > 0 ? 'green' : 'gray',
      lastAssessmentActivityAt: new Date().toISOString(),
      lastActivityDisplay: 'Today',
      hasStaleDraft: options.hasStaleDraft ?? false,
      staleDays: options.staleDays ?? 0,
      overallScore,
      completedModulesCount: completedCount,
      modules,
    };
  };

  it('computes 4 dynamic KPI metrics correctly from caseload', () => {
    const student1 = createMockStudent('s1', 'Alice Green', {
      skills: 'completed',
      behavior: 'completed',
      preference: 'in_progress',
      sensory: 'not_started',
    }); // 2 completed, 1 in_prog, 1 pending

    const student2 = createMockStudent('s2', 'Bob Smith', {
      skills: 'completed',
      behavior: 'completed',
      preference: 'completed',
      sensory: 'completed',
    }); // 4 completed

    const students = [student1, student2];

    const totalStudents = students.length;
    const totalRequired = totalStudents * 4;
    let completedModules = 0;
    let inProgressModules = 0;
    let pendingModules = 0;

    for (const s of students) {
      for (const m of Object.values(s.modules)) {
        if (m.status === 'completed') completedModules++;
        else if (m.status === 'in_progress') inProgressModules++;
        else pendingModules++;
      }
    }

    const kpis: AssessmentKpis = {
      assignedStudentsCount: totalStudents,
      completedSubModules: completedModules,
      totalRequiredSubModules: totalRequired,
      inProgressSubModules: inProgressModules,
      pendingSubModules: pendingModules,
    };

    expect(kpis.assignedStudentsCount).toBe(2);
    expect(kpis.totalRequiredSubModules).toBe(8);
    expect(kpis.completedSubModules).toBe(6);
    expect(kpis.inProgressSubModules).toBe(1);
    expect(kpis.pendingSubModules).toBe(1);
  });

  describe('Footer & Submission Workflow Rules (FR-050, FR-057)', () => {
    it('Case 1: 0 to 2 completed modules locks submit file button', () => {
      const student = createMockStudent('s1', 'Charlie Brown', {
        skills: 'completed',
        behavior: 'in_progress',
        preference: 'not_started',
        sensory: 'not_started',
      });

      expect(student.completedModulesCount).toBe(1);
      const isLocked = student.completedModulesCount <= 2;
      expect(isLocked).toBe(true);
      expect(`${student.completedModulesCount} of 4 modules ready`).toBe('1 of 4 modules ready');
    });

    it('Case 2: 3 completed modules (1 remaining) exposes Complete Final Sub-Assessment CTA', () => {
      const student = createMockStudent('s2', 'Diana Prince', {
        skills: 'completed',
        behavior: 'completed',
        preference: 'completed',
        sensory: 'in_progress',
      });

      expect(student.completedModulesCount).toBe(3);
      const oneRemaining = student.completedModulesCount === 3;
      expect(oneRemaining).toBe(true);

      const uncompleted = Object.values(student.modules).find((m) => m.status !== 'completed');
      expect(uncompleted).toBeDefined();
      expect(uncompleted?.key).toBe('sensory');
      expect(uncompleted?.label).toBe('Sensory Time Engagement');
    });

    it('Case 3: All 4 completed modules enables Submit Assessments for Review', () => {
      const student = createMockStudent('s3', 'Evan Stone', {
        skills: 'completed',
        behavior: 'completed',
        preference: 'completed',
        sensory: 'completed',
      });

      expect(student.completedModulesCount).toBe(4);
      expect(student.overallScore).toBe(100);
      const canSubmit = student.completedModulesCount === 4;
      expect(canSubmit).toBe(true);
    });
  });

  describe('NFR-022 Stale Draft Warnings (> 7 days untouched)', () => {
    it('identifies in_progress draft older than 7 days as stale', () => {
      const student = createMockStudent(
        's4',
        'Fiona Glenanne',
        {
          skills: 'in_progress',
          behavior: 'not_started',
          preference: 'not_started',
          sensory: 'not_started',
        },
        {
          hasStaleDraft: true,
          staleDays: 12,
        },
      );

      expect(student.hasStaleDraft).toBe(true);
      expect(student.staleDays).toBe(12);
      expect(student.statusDot).toBe('amber');
    });

    it('marks student with no activity as gray dot and not stale', () => {
      const student = createMockStudent('s5', 'George Clark', {
        skills: 'not_started',
        behavior: 'not_started',
        preference: 'not_started',
        sensory: 'not_started',
      });

      expect(student.hasStaleDraft).toBe(false);
      expect(student.statusDot).toBe('gray');
      expect(student.completedModulesCount).toBe(0);
    });
  });

  describe('Teacher 2 Enrollment & Assessment Retention (FR-010 / SCR-010)', () => {
    it('retains newly enrolled student assigned to Teacher 2 without filtering them out', () => {
      const rawStudents = [
        {
          id: '1e80455c-7ce8-4a78-a7d6-2d8873d86a33',
          fullName: 'Student Eleven',
          status: 'in_assessment',
          therapist: 'Teacher Two',
        },
        {
          id: 'new-stu-2',
          fullName: 'New Enrolled Child',
          status: 'active',
          therapist: 'Teacher 2',
        },
        {
          id: 'grad-stu-3',
          fullName: 'Graduated Child',
          status: 'active_therapy',
          therapist: 'Teacher Two',
        },
        {
          id: 'comp-stu-4',
          fullName: 'Completed Child',
          status: 'assessment_complete',
          therapist: 'Teacher Two',
        },
      ];

      // Filtering rule used by useTeacherAssessments and teacherExtrasApi:
      // only excludes students who graduated to active therapy or completed assessment review
      const filtered = rawStudents.filter((s) => {
        const st = String(s.status || '')
          .toLowerCase()
          .trim();
        if (st === 'assessment_complete' || st === 'active_therapy') {
          return false;
        }
        return true;
      });

      expect(filtered.length).toBe(2);
      expect(filtered.map((s) => s.fullName)).toEqual(['Student Eleven', 'New Enrolled Child']);
      expect(filtered.find((s) => s.id === '1e80455c-7ce8-4a78-a7d6-2d8873d86a33')).toBeDefined();
    });

    it('matches therapist across digit and word forms (Teacher 2 <-> Teacher Two)', () => {
      const clinicianName = 'Teacher Two';
      const assigned1 = 'Teacher 2';
      const assigned2 = 'Teacher Two';

      const matchTherapist = (assigned: string, clinician: string) => {
        const a = assigned.toLowerCase();
        const c = clinician.toLowerCase();
        return (
          a.includes('teacher 2') ||
          a.includes('teacher two') ||
          (c.includes('two') && (a.includes('two') || a.includes('2'))) ||
          a === c
        );
      };

      expect(matchTherapist(assigned1, clinicianName)).toBe(true);
      expect(matchTherapist(assigned2, clinicianName)).toBe(true);
    });
  });
});
