import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAssessmentDashboard, submitAssessmentsForReview } from '../../api/teacherExtrasApi';
import {
  isStudentInSession,
  isStudentAssessment100PercentCompleted,
  markStudentAssessmentCompleted,
  getStudentSkillsProgress,
  getStudentBehaviorProgress,
  getStudentPreferenceProgress,
  getStudentSensoryProgress,
} from '../../utils/studentLifecycleHelper';
import type {
  AssessmentDashboardPayload,
  AssessmentKpis,
  StudentAssessmentItem,
  SubModuleStatus,
  StudentStatusDot,
} from './assessmentDashboardTypes';

function normalizeStatus(st?: string, prog?: number): SubModuleStatus {
  if (!st) return 'not_started';
  const s = st.toLowerCase().trim();
  if (s === 'completed' || s === 'submitted' || (prog !== undefined && prog >= 100)) {
    return 'completed';
  }
  if (
    s === 'in progress' ||
    s === 'in_progress' ||
    s === 'draft' ||
    (prog !== undefined && prog > 0)
  ) {
    return 'in_progress';
  }
  return 'not_started';
}

export function useTeacherAssessments() {
  const { session } = useAuth();
  const [data, setData] = useState<AssessmentDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submittingStudentId, setSubmittingStudentId] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);

  const loadAssessments = useCallback(async () => {
    if (inFlightRef.current) return;
    try {
      inFlightRef.current = true;
      // Only show loading spinner/skeleton on initial fetch to prevent screen blinking/flicker
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(false);
      const { data: res } = await getAssessmentDashboard();

      const rawStudents = Array.isArray(res?.students) ? res.students : [];
      const clinicianName =
        res?.clinician?.name ||
        session?.userName ||
        (session as any)?.user?.name ||
        'Assigned Clinician';
      const periodLabel = res?.periodLabel || '6-Week Baseline Assessment';

      // Keep active students in assessment; only exclude students who graduated to active therapy / session
      const activeRaw = rawStudents.filter((s: any) => {
        const st = String(s.status || '')
          .toLowerCase()
          .trim();
        if (st === 'assessment_complete' || st === 'active_therapy') {
          return false;
        }
        return true;
      });

      const studentItems: StudentAssessmentItem[] = activeRaw.map((s: any) => {
        const sid = String(s.id);
        const fullName = s.fullName || s.name || 'Student';
        const initial = s.initial || (fullName[0] || 'S').toUpperCase();

        const skInfo = getStudentSkillsProgress(
          sid,
          s.ablls?.progress ?? 0,
          s.ablls?.status ?? 'Not Started',
        );
        const bhInfo = getStudentBehaviorProgress(
          sid,
          s.behavior?.progress ?? 0,
          s.behavior?.status ?? 'Not Started',
        );
        const prInfo = getStudentPreferenceProgress(
          sid,
          s.preference?.progress ?? 0,
          s.preference?.status ?? 'Not Started',
        );
        const seInfo = getStudentSensoryProgress(
          sid,
          s.sensory?.progress ?? 0,
          s.sensory?.status ?? 'Not Started',
        );

        const skillsStatus = normalizeStatus(skInfo.status, skInfo.progress);
        const behaviorStatus = normalizeStatus(bhInfo.status, bhInfo.progress);
        const prefStatus = normalizeStatus(prInfo.status, prInfo.progress);
        const sensoryStatus = normalizeStatus(seInfo.status, seInfo.progress);

        const skillsProg = skillsStatus === 'completed' ? 100 : skInfo.progress;
        const behaviorProg = behaviorStatus === 'completed' ? 100 : bhInfo.progress;
        const prefProg = prefStatus === 'completed' ? 100 : prInfo.progress;
        const sensoryProg = sensoryStatus === 'completed' ? 100 : seInfo.progress;

        const moduleStatuses = [skillsStatus, behaviorStatus, prefStatus, sensoryStatus];
        const completedCount = moduleStatuses.filter((st) => st === 'completed').length;
        const inProgressCount = moduleStatuses.filter((st) => st === 'in_progress').length;

        const overallScore = Math.min(
          100,
          Math.round((skillsProg + behaviorProg + prefProg + sensoryProg) / 4),
        );

        const daysSince =
          typeof s.days_since_last_activity === 'number' ? s.days_since_last_activity : 0;
        const hasStaleDraft = Boolean(s.has_stale_draft) || (inProgressCount > 0 && daysSince > 7);
        const staleDays =
          typeof s.stale_days === 'number' && s.stale_days > 0 ? s.stale_days : daysSince;

        let statusDot: StudentStatusDot = 'green';
        if (completedCount === 4) {
          statusDot = 'green';
        } else if (hasStaleDraft) {
          statusDot = 'amber';
        } else if (completedCount === 0 && inProgressCount === 0) {
          statusDot = 'gray';
        } else {
          statusDot = 'green';
        }

        const lastActivityDisplay =
          s.last_activity_display ||
          (daysSince === 0
            ? 'Today'
            : daysSince === 1
              ? 'Yesterday'
              : daysSince > 1
                ? `${daysSince} days ago`
                : 'Not started');

        return {
          id: sid,
          fullName,
          initial,
          age: typeof s.age === 'number' ? s.age : 6,
          programType: s.program || s.program_type || 'Regular Program',
          therapistName: s.therapist || clinicianName,
          lastActivityAt: s.last_assessment_activity_at,
          lastActivityDisplay,
          daysSinceLastActivity: daysSince,
          hasStaleDraft,
          staleDays,
          statusDot,
          overallScore,
          completedModulesCount: completedCount,
          modules: {
            skills: {
              key: 'skills',
              label: 'Skills (ABLLS-R)',
              subtitle: 'Basic Language & Learning Skills',
              status: skillsStatus,
              progressPercentage: skillsProg,
            },
            behavior: {
              key: 'behavior',
              label: 'Behavior (MASS / FAST / ABC)',
              subtitle: 'Functional Behavior Tracking',
              status: behaviorStatus,
              progressPercentage: behaviorProg,
            },
            preference: {
              key: 'preference',
              label: 'Preference',
              subtitle: 'Reinforcer Hierarchy Assessment',
              status: prefStatus,
              progressPercentage: prefProg,
            },
            sensory: {
              key: 'sensory',
              label: 'Sensory Time Engagement',
              subtitle: 'Sensory Modulation & Regulation',
              status: sensoryStatus,
              progressPercentage: sensoryProg,
            },
          },
          photoUrl: s.photoUrl || s.headshotUrl || s.photo,
        };
      });

      // Calculate dynamic 4-card KPIs
      let totalCompletedSubModules = 0;
      let totalInProgressSubModules = 0;
      let totalPendingSubModules = 0;

      studentItems.forEach((st) => {
        const statuses = [
          st.modules.skills.status,
          st.modules.behavior.status,
          st.modules.preference.status,
          st.modules.sensory.status,
        ];
        statuses.forEach((status) => {
          if (status === 'completed') totalCompletedSubModules += 1;
          else if (status === 'in_progress') totalInProgressSubModules += 1;
          else totalPendingSubModules += 1;
        });
      });

      const kpis: AssessmentKpis = {
        assignedStudentsCount: studentItems.length,
        completedSubModules: totalCompletedSubModules,
        totalRequiredSubModules: studentItems.length * 4,
        inProgressSubModules: totalInProgressSubModules,
        pendingSubModules: totalPendingSubModules,
      };

      setData((prev) => {
        // Prevent screen blink: if we previously had loaded students and new fetch is unexpectedly empty, keep existing caseload
        if (
          studentItems.length === 0 &&
          prev &&
          prev.students.length > 0 &&
          rawStudents.length === 0
        ) {
          return prev;
        }
        return {
          clinicianName,
          periodLabel,
          kpis,
          students: studentItems,
        };
      });
      hasLoadedRef.current = true;
      setLoading(false);
    } catch (err) {
      hasLoadedRef.current = true;
      setError(true);
      setLoading(false);
    } finally {
      inFlightRef.current = false;
    }
  }, [session?.userId, session?.role, session?.userName]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timerId: any = null;
    const handleSync = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        loadAssessments();
      }, 300);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('melue_assessment_updated' as any, handleSync);
    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('melue_assessment_updated' as any, handleSync);
    };
  }, [loadAssessments]);

  const submitStudentAssessments = async (student: StudentAssessmentItem): Promise<boolean> => {
    try {
      setSubmittingStudentId(student.id);
      await submitAssessmentsForReview(student.id);
      markStudentAssessmentCompleted(student.id);
      await loadAssessments();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingStudentId(null);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: loadAssessments,
    submittingStudentId,
    submitStudentAssessments,
  };
}
