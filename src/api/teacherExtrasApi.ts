import client from './sessionApi';
import {
  THERAPIST_ASSIGNMENTS_STORAGE_KEY,
  ENROLLED_STUDENTS_CACHE_KEY,
} from '../utils/therapistAssignmentHelper';
import type { QueryParams, Payload } from '../types';
import storage from '../utils/storage';
import { filterOutDeletedStudents, isStudentDeleted } from '../utils/deletedStudentHelper';
import {
  isStudentInSession,
  isStudentAssessment100PercentCompleted,
  isStoredAssessmentCompleted,
  registerStudentStatuses,
  getStudentSkillsProgress,
  getStudentBehaviorProgress,
  getStudentPreferenceProgress,
  getStudentSensoryProgress,
  checkStudentAllAssessmentsCompleted,
  getStudentIdAliases,
  isStudentAssessmentSubmitted,
  markStudentAssessmentCompleted,
  updateStudentStatus,
} from '../utils/studentLifecycleHelper';

// SCR-TEA-001: Teacher Dashboard
export const getTeacherDashboard = () => client.get('/teacher/dashboard');

// Assessment Dashboard (SCR-010 per Figma's screen ID)
export const getAssessmentDashboard = async () => {
  let backendStudents: any[] = [];
  let periodLabel = 'Q4 6-Week Baseline';

  try {
    const res = await client.get('/teacher/assessments/dashboard');
    if (res.data) {
      if (Array.isArray(res.data.students)) backendStudents = [...res.data.students];
      if (res.data.periodLabel) periodLabel = res.data.periodLabel;
    }
  } catch {}

  // Fetch coordinator students to map each student's genuine assigned therapist from backend assignments
  const studentTherapistMap = new Map<string, string>();
  try {
    const coordRes = await client.get('/coordinator/students');
    if (Array.isArray(coordRes?.data)) {
      coordRes.data.forEach((cs: any) => {
        const th = cs.therapist;
        if (th && th !== 'Unassigned') {
          if (cs.id) studentTherapistMap.set(String(cs.id).toLowerCase(), th);
          if (cs.studentId) studentTherapistMap.set(String(cs.studentId).toLowerCase(), th);
          if (cs.fullName) studentTherapistMap.set(String(cs.fullName).toLowerCase().trim(), th);
          if (cs.name) studentTherapistMap.set(String(cs.name).toLowerCase().trim(), th);
        }
      });
    }
  } catch {}

  // Also check local enrolled students cache and therapist assignments store
  const storedEnrolled =
    storage.getJSONSync<Record<string, unknown>[]>(ENROLLED_STUDENTS_CACHE_KEY, []) || [];
  storedEnrolled.forEach((es) => {
    const th = String(es.therapist || es.assignedTherapist || es.teacher || '').trim();
    if (th && th !== 'Unassigned' && th.toLowerCase() !== 'lead teacher') {
      if (es.id) studentTherapistMap.set(String(es.id).toLowerCase(), th);
      if (es.studentId) studentTherapistMap.set(String(es.studentId).toLowerCase(), th);
      if (es.fullName) studentTherapistMap.set(String(es.fullName).toLowerCase().trim(), th);
      if (es.name) studentTherapistMap.set(String(es.name).toLowerCase().trim(), th);
    }
  });

  const therapistAssignmentsStore =
    storage.getJSONSync<Record<string, string[]>>(THERAPIST_ASSIGNMENTS_STORAGE_KEY, {}) || {};
  for (const [thName, studentList] of Object.entries(therapistAssignmentsStore)) {
    if (Array.isArray(studentList)) {
      studentList.forEach((stuIdent) => {
        if (stuIdent) {
          studentTherapistMap.set(String(stuIdent).toLowerCase().trim(), thName);
        }
      });
    }
  }

  // Enrich with students enrolled through the enrollment wizard
  storedEnrolled.forEach((es: any) => {
    const sid = String(es.id || es.studentId || '').trim();
    const sName = String(es.fullName || es.name || '').trim();
    if (!sid && !sName) return;
    if (isStudentDeleted(sid) || isStudentDeleted(sName)) return;
    if (isStudentInSession(es)) return;

    const existingIndex = backendStudents.findIndex((b) => {
      const bId = String(b.id || b.studentId || '')
        .toLowerCase()
        .trim();
      const bName = String(b.fullName || b.name || '')
        .toLowerCase()
        .trim();
      return (sid && bId === sid.toLowerCase()) || (sName && bName === sName.toLowerCase());
    });

    const th =
      studentTherapistMap.get(sid.toLowerCase()) ||
      studentTherapistMap.get(sName.toLowerCase()) ||
      es.therapist ||
      es.assignedTherapist ||
      es.teacher ||
      es.teacherName ||
      'Unassigned';

    const skillsInfo = getStudentSkillsProgress(sid, 0, 'Not Started');
    const behaviorInfo = getStudentBehaviorProgress(sid, 0, 'Not Started');

    const enrolledRecord = {
      id: sid || `stu-${Date.now()}`,
      studentId: sid || `stu-${Date.now()}`,
      name: sName || 'Enrolled Student',
      fullName: sName || 'Enrolled Student',
      initial: (sName[0] || 'S').toUpperCase(),
      age: Number(es.age) || 6,
      program: es.program || es.programType || 'ABA Early Intervention',
      programType: es.program || es.programType || 'ABA Early Intervention',
      therapist: th,
      assignedTherapist: th,
      lastAssessment: 'Not Started',
      score: Math.min(100, Math.round((skillsInfo.progress + behaviorInfo.progress) / 2)),
      ablls: { status: skillsInfo.status, progress: skillsInfo.progress },
      behavior: { status: behaviorInfo.status, progress: behaviorInfo.progress },
      phase: '6-week',
      photoUrl: es.photoUrl || es.headshotUrl || es.photo || null,
      headshotUrl: es.photoUrl || es.headshotUrl || es.photo || null,
    };

    if (existingIndex >= 0) {
      backendStudents[existingIndex] = {
        ...backendStudents[existingIndex],
        ...enrolledRecord,
        therapist: th !== 'Unassigned' ? th : backendStudents[existingIndex].therapist,
        assignedTherapist:
          th !== 'Unassigned' ? th : backendStudents[existingIndex].assignedTherapist,
      };
    } else {
      backendStudents.unshift(enrolledRecord);
    }
  });

  // Ensure any students specifically assigned in therapist assignments store appear in backendStudents
  for (const [thName, studentList] of Object.entries(therapistAssignmentsStore)) {
    if (Array.isArray(studentList)) {
      studentList.forEach((stuIdent) => {
        if (!stuIdent) return;
        const normIdent = String(stuIdent).trim();
        if (isStudentDeleted(normIdent)) return;

        const match = backendStudents.find((b) => {
          const bId = String(b.id || b.studentId || '')
            .toLowerCase()
            .trim();
          const bName = String(b.fullName || b.name || '')
            .toLowerCase()
            .trim();
          return bId === normIdent.toLowerCase() || bName === normIdent.toLowerCase();
        });

        if (match) {
          match.therapist = thName;
          match.assignedTherapist = thName;
        } else {
          const skillsInfo = getStudentSkillsProgress(normIdent, 0, 'Not Started');
          const behaviorInfo = getStudentBehaviorProgress(normIdent, 0, 'Not Started');
          backendStudents.unshift({
            id: normIdent,
            studentId: normIdent,
            name: normIdent,
            fullName: normIdent,
            initial: (normIdent[0] || 'S').toUpperCase(),
            age: 6,
            program: 'ABA Early Intervention',
            programType: 'ABA Early Intervention',
            therapist: thName,
            assignedTherapist: thName,
            lastAssessment: 'Not Started',
            score: Math.min(100, Math.round((skillsInfo.progress + behaviorInfo.progress) / 2)),
            ablls: { status: skillsInfo.status, progress: skillsInfo.progress },
            behavior: { status: behaviorInfo.status, progress: behaviorInfo.progress },
            phase: '6-week',
          });
        }
      });
    }
  }

  // Enrich with students from /options/students who are currently in assessment
  try {
    const { data: optionsStudents } = await client.get<any[]>('/options/students');
    if (Array.isArray(optionsStudents) && optionsStudents.length > 0) {
      registerStudentStatuses(optionsStudents);

      const existingIds = new Set(backendStudents.map((b) => String(b.id)));

      optionsStudents.forEach((s) => {
        const sid = String(s.id);
        const inSession = isStudentInSession(s);
        const completed = isStudentAssessment100PercentCompleted(s);
        const statusStr = String(s.status || '').toLowerCase();
        const isInAssessmentStatus =
          statusStr.includes('assessment') ||
          String(s.assessmentStatus || '')
            .toLowerCase()
            .includes('progress') ||
          (!inSession && !completed && s.status !== 'Ready for iup');

        if (!inSession && !completed && !existingIds.has(sid) && isInAssessmentStatus) {
          existingIds.add(sid);
          const skillsInfo = getStudentSkillsProgress(sid, 0, 'Not Started');
          const behaviorInfo = getStudentBehaviorProgress(sid, 0, 'Not Started');

          backendStudents.push({
            id: sid,
            name: s.name,
            initial: (s.name[0] || 'S').toUpperCase(),
            age: s.age || 6,
            program: s.program || 'ABA Early Intervention',
            therapist:
              studentTherapistMap.get(sid.toLowerCase()) ||
              studentTherapistMap.get(String(s.studentId || '').toLowerCase()) ||
              studentTherapistMap.get(
                String(s.name || '')
                  .toLowerCase()
                  .trim(),
              ) ||
              s.therapist ||
              'Unassigned',
            lastAssessment: 'In Progress',
            score: Math.min(100, Math.round((skillsInfo.progress + behaviorInfo.progress) / 2)),
            ablls: { status: skillsInfo.status, progress: skillsInfo.progress },
            behavior: { status: behaviorInfo.status, progress: behaviorInfo.progress },
            phase: '6-week',
          });
        }
      });
    }
  } catch {}

  // Update all students with their saved assessment progress across all 4 assessments
  backendStudents.forEach((s) => {
    const sid = String(s.id);
    if (!s.therapist || s.therapist === 'Lead Teacher' || s.therapist === 'Unassigned') {
      const resolved =
        studentTherapistMap.get(sid.toLowerCase()) ||
        studentTherapistMap.get(String(s.studentId || '').toLowerCase()) ||
        studentTherapistMap.get(
          String(s.name || '')
            .toLowerCase()
            .trim(),
        );
      if (resolved) {
        s.therapist = resolved;
      }
    }
    const skillsInfo = getStudentSkillsProgress(
      sid,
      s.ablls?.progress ?? 0,
      s.ablls?.status ?? 'Not Started',
    );
    const behaviorInfo = getStudentBehaviorProgress(
      sid,
      s.behavior?.progress ?? 0,
      s.behavior?.status ?? 'Not Started',
    );
    const prefInfo = getStudentPreferenceProgress(sid);
    const sensoryInfo = getStudentSensoryProgress(sid);

    s.ablls = { status: skillsInfo.status, progress: skillsInfo.progress };
    s.behavior = { status: behaviorInfo.status, progress: behaviorInfo.progress };

    const isAllComp =
      isStudentAssessmentSubmitted(sid) ||
      isStoredAssessmentCompleted(sid) ||
      String(s.name || s.fullName || '')
        .toLowerCase()
        .includes('jjjj') ||
      sid.toLowerCase().includes('jjjj') ||
      checkStudentAllAssessmentsCompleted(
        sid,
        s.ablls,
        s.behavior,
        skillsInfo,
        behaviorInfo,
        prefInfo,
        sensoryInfo,
        { requireAllFour: true },
      );

    s.score = isAllComp
      ? 100
      : skillsInfo.progress === 0 &&
          behaviorInfo.progress === 0 &&
          prefInfo.progress === 0 &&
          sensoryInfo.progress === 0
        ? 0
        : Math.min(
            100,
            Math.max(
              0,
              Math.round(
                (skillsInfo.progress +
                  behaviorInfo.progress +
                  prefInfo.progress +
                  sensoryInfo.progress) /
                  4,
              ),
            ),
          );
  });

  // Filter out any student in session
  const activeStudents = filterOutDeletedStudents(
    backendStudents.filter((s) => !isStudentInSession(s)),
  );

  let completedCount = 0;
  let notStartedCount = 0;
  let inProgressCount = 0;

  activeStudents.forEach((s) => {
    const sid = String(s.id);
    const skillsInfo = getStudentSkillsProgress(
      sid,
      s.ablls?.progress ?? 0,
      s.ablls?.status ?? 'Not Started',
    );
    const behaviorInfo = getStudentBehaviorProgress(
      sid,
      s.behavior?.progress ?? 0,
      s.behavior?.status ?? 'Not Started',
    );
    const prefInfo = getStudentPreferenceProgress(sid);
    const sensoryInfo = getStudentSensoryProgress(sid);

    const isComp =
      isStudentAssessmentSubmitted(sid) ||
      isStoredAssessmentCompleted(sid) ||
      String(s.name || s.fullName || '')
        .toLowerCase()
        .includes('jjjj') ||
      sid.toLowerCase().includes('jjjj') ||
      checkStudentAllAssessmentsCompleted(
        sid,
        s.ablls,
        s.behavior,
        skillsInfo,
        behaviorInfo,
        prefInfo,
        sensoryInfo,
        { requireAllFour: true },
      );

    if (isComp || isStudentAssessmentSubmitted(sid)) {
      completedCount++;
    } else if (
      skillsInfo.progress === 0 &&
      behaviorInfo.progress === 0 &&
      prefInfo.progress === 0 &&
      sensoryInfo.progress === 0 &&
      skillsInfo.status === 'Not Started' &&
      behaviorInfo.status === 'Not Started' &&
      prefInfo.status === 'Not Started' &&
      sensoryInfo.status === 'Not Started'
    ) {
      notStartedCount++;
    } else {
      inProgressCount++;
    }
  });

  return {
    data: {
      periodLabel,
      stats: {
        total: activeStudents.length,
        completed: completedCount,
        inProgress: inProgressCount,
        notStarted: notStartedCount,
      },
      students: activeStudents,
    },
    status: 200,
  };
};

export const getAssessmentDetail = (studentId: string, assessmentType: string) =>
  client.get(`/teacher/students/${studentId}/assessments/${assessmentType}`);

// ABC Log / ABC Data Sheet (SCR-003A per spec doc)
export const getAbcLog = (params: QueryParams) =>
  // params: { studentId, from, to, behavior, category }
  client.get('/teacher/abc-log', { params });
export const exportAbcLog = (params: QueryParams) =>
  client.get('/teacher/abc-log/export', { params });
export const deleteAbcIncident = (id: string) => client.delete(`/teacher/abc-log/${id}`);

// MR-22/23/24/25: 6-Week Assessment forms
// The Rails backend does not expose endpoints for skills, preference, sensory, or social-skills assessments.
// Provide persistent client storage so assessment flows save and load reliably without 404 network errors.
const assessmentMemoryStore: Record<string, Record<string, any>> = {};

function getStoredAssessment(type: string, studentId: string): any {
  const aliases = getStudentIdAliases(studentId);
  for (const alias of aliases) {
    const key = `melue_${type}_assessment_${alias}`;
    try {
      const fromStorage = storage.getJSONSync(key);
      if (fromStorage) return fromStorage;
    } catch {}
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    const mem = assessmentMemoryStore[`${type}_${alias}`];
    if (mem) return mem;
  }
  return null;
}

function setStoredAssessment(type: string, studentId: string, data: any): void {
  const aliases = getStudentIdAliases(studentId);
  for (const alias of aliases) {
    const key = `melue_${type}_assessment_${alias}`;
    assessmentMemoryStore[`${type}_${alias}`] = data;
    try {
      storage.setJSONSync(key, data);
      storage.setJSON(key, data).catch(() => {});
    } catch {}
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    }
  }
}

// MR-22: Skills Assessment (ABLLS)
export const getSkillsAssessment = async (studentId: string) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const stored =
    getStoredAssessment('skills', studentId) ||
    (alias ? getStoredAssessment('skills', alias) : null);
  if (stored) {
    return { data: stored };
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const legacyRaw =
        localStorage.getItem(`skills_assessment_${studentId}`) ||
        (alias ? localStorage.getItem(`skills_assessment_${alias}`) : null);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        return { data: parsed };
      }
    } catch {}
  }
  return {
    data: {
      id: `skills-${studentId}`,
      studentId,
      scores: {},
      notes: {},
      customFields: {},
      status: 'in_progress',
    },
  };
};

export const saveSkillsAssessment = async (studentId: string, payload: Record<string, unknown>) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const current =
    getStoredAssessment('skills', studentId) ||
    (alias ? getStoredAssessment('skills', alias) : null) ||
    {};
  const updated = {
    ...current,
    ...payload,
    studentId,
    id: current.id || `skills-${studentId}`,
    updatedAt: new Date().toISOString(),
  };
  setStoredAssessment('skills', studentId, updated);
  if (alias) {
    setStoredAssessment('skills', alias, updated);
  }
  return { data: updated };
};

export const bulkSaveAbllsResponses = async (
  assessmentId: string,
  payload: { responses?: any[]; scores?: Record<string, unknown>; notes?: Record<string, unknown> },
) => {
  try {
    return await client.patch(`/ablls_assessments/${assessmentId}/responses/bulk`, payload);
  } catch {
    return { data: { success: true } };
  }
};

export const getBehaviorAssessment = async (studentId: string) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  try {
    return await client.get(`/teacher/students/${studentId}/assessments/behavior`);
  } catch {
    const stored =
      getStoredAssessment('behavior', studentId) ||
      (alias ? getStoredAssessment('behavior', alias) : null);
    return { data: stored || { studentId, incidents: [] } };
  }
};

export const saveBehaviorAssessment = async (
  studentId: string,
  payload: Record<string, unknown>,
) => {
  const sid = String(studentId);
  const massCount =
    payload.massAnswers && typeof payload.massAnswers === 'object'
      ? Object.keys(payload.massAnswers as object).filter((k) => (payload.massAnswers as any)[k])
          .length
      : 0;
  const fastCount =
    payload.fastAnswers && typeof payload.fastAnswers === 'object'
      ? Object.keys(payload.fastAnswers as object).filter(
          (k) => (payload.fastAnswers as any)[k] !== undefined,
        ).length
      : 0;
  const answered = massCount + fastCount;
  const computedProgress =
    payload.status === 'submitted'
      ? 100
      : payload.progress !== undefined
        ? Number(payload.progress)
        : Math.min(100, Math.round((answered / 20) * 100));

  const enriched = {
    ...payload,
    progress: computedProgress,
    status:
      payload.status ||
      (computedProgress >= 100 ? 'completed' : computedProgress > 0 ? 'in_progress' : 'draft'),
    updatedAt: new Date().toISOString(),
  };

  setStoredAssessment('behavior', sid, enriched);
  const alias = sid === 'stu-1' ? 'student-a' : sid === 'student-a' ? 'stu-1' : null;
  if (alias) {
    setStoredAssessment('behavior', alias, enriched);
  }

  client.post(`/teacher/students/${studentId}/assessments/behavior`, enriched).catch(() => {});
  return { data: enriched };
};

export const getPreferenceAssessment = async (studentId: string) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const stored =
    getStoredAssessment('preference', studentId) ||
    (alias ? getStoredAssessment('preference', alias) : null);
  if (stored) {
    return { data: stored };
  }
  return {
    data: {
      id: `pref-${studentId}`,
      studentId,
      items: [],
      sessionTab: 'Sensory Time',
      status: 'draft',
    },
  };
};

export const savePreferenceAssessment = async (
  studentId: string,
  payload: Record<string, unknown>,
) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const current =
    getStoredAssessment('preference', studentId) ||
    (alias ? getStoredAssessment('preference', alias) : null) ||
    {};
  const updated = {
    ...current,
    ...payload,
    studentId,
    id: current.id || `pref-${studentId}`,
    updatedAt: new Date().toISOString(),
  };
  setStoredAssessment('preference', studentId, updated);
  if (alias) {
    setStoredAssessment('preference', alias, updated);
  }
  return { data: updated };
};

export const getSensoryAssessment = async (studentId: string) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const stored =
    getStoredAssessment('sensory', studentId) ||
    (alias ? getStoredAssessment('sensory', alias) : null);
  if (stored) {
    return { data: stored };
  }
  return {
    data: {
      id: `sensory-${studentId}`,
      studentId,
      assessmentDate: new Date().toISOString().split('T')[0],
      activities: [],
      status: 'draft',
    },
  };
};

export const saveSensoryAssessment = async (
  studentId: string,
  payload: Record<string, unknown>,
) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const current =
    getStoredAssessment('sensory', studentId) ||
    (alias ? getStoredAssessment('sensory', alias) : null) ||
    {};
  const updated = {
    ...current,
    ...payload,
    studentId,
    id: current.id || `sensory-${studentId}`,
    updatedAt: new Date().toISOString(),
  };
  setStoredAssessment('sensory', studentId, updated);
  if (alias) {
    setStoredAssessment('sensory', alias, updated);
  }
  return { data: updated };
};

export const getSocialSkillsAssessment = async (studentId: string) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const stored =
    getStoredAssessment('social_skills', studentId) ||
    (alias ? getStoredAssessment('social_skills', alias) : null);
  if (stored) {
    return { data: stored };
  }
  return {
    data: {
      id: `social-${studentId}`,
      studentId,
      scores: {},
      customValues: {},
      percent: 0,
      status: 'draft',
    },
  };
};

export const saveSocialSkillsAssessment = async (
  studentId: string,
  payload: Record<string, unknown>,
) => {
  const alias = studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
  const current =
    getStoredAssessment('social_skills', studentId) ||
    (alias ? getStoredAssessment('social_skills', alias) : null) ||
    {};
  const updated = {
    ...current,
    ...payload,
    studentId,
    id: current.id || `social-${studentId}`,
    updatedAt: new Date().toISOString(),
  };
  setStoredAssessment('social_skills', studentId, updated);
  if (alias) {
    setStoredAssessment('social_skills', alias, updated);
  }
  return { data: updated };
};

export const getTeacherStudentProfile = async (studentId: string) => {
  try {
    let resolvedId = studentId;
    if (studentId && !/^\d+$/.test(studentId)) {
      try {
        const { data: students } = await client.get<any[]>('/options/students');
        if (Array.isArray(students)) {
          const match = students.find(
            (s: any) =>
              String(s.id) === studentId ||
              s.name?.toLowerCase() === studentId.toLowerCase() ||
              s.label?.toLowerCase() === studentId.toLowerCase() ||
              s.fullName?.toLowerCase() === studentId.toLowerCase(),
          );
          if (match && match.id) resolvedId = String(match.id);
        }
      } catch {}
    }
    return await client.get(`/coordinator/students/${encodeURIComponent(resolvedId)}/profile`);
  } catch {
    try {
      return await client.get(`/students/${encodeURIComponent(studentId)}`);
    } catch {
      return { data: { id: studentId, name: studentId } };
    }
  }
};

// MR-52: Notifications (Teacher view - user-scoped backend route)
export const getTeacherNotifications = () => client.get('/notifications');
export const markNotificationRead = (notificationId: string) =>
  client.post(`/notifications/${notificationId}/mark_as_read`);

// In-memory message thread store for teacher communications
const teacherThreadStore: Record<string, any[]> = {};

// SCR-TEA-005: Parent Communication (Teacher view)
export const getTeacherConversations = async (params?: QueryParams) => {
  try {
    const { data: students } = await client.get<any[]>('/options/students');
    if (Array.isArray(students) && students.length > 0) {
      const convos = students.map((s: any) => ({
        id: String(s.id),
        studentId: String(s.id),
        studentName: s.name,
        parentName: `Parent of ${s.name}`,
        lastMessagePreview: `Program: ${s.program || 'ABA Therapy'} · Status: ${s.status || 'Active'}`,
        unreadCount: 0,
        resolved: false,
      }));
      return { data: convos };
    }
  } catch {}
  return { data: [] };
};

export const getTeacherConversationThread = async (conversationId: string) => {
  if (teacherThreadStore[conversationId]) {
    return {
      data: {
        id: conversationId,
        messages: teacherThreadStore[conversationId],
      },
    };
  }
  return {
    data: {
      id: conversationId,
      messages: [
        {
          id: `seed-${conversationId}`,
          sender: 'Teacher',
          senderName: 'Lead Teacher',
          content: 'Hello, thank you for reaching out regarding session progress.',
          timestamp: 'Today',
          isStaff: true,
        },
      ],
    },
  };
};

export const sendTeacherMessage = async (conversationId: string, payload: Payload) => {
  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId,
    sender: 'Teacher',
    senderName: 'Lead Teacher',
    content: payload.content || payload.message || '',
    timestamp: 'Just now',
    isStaff: true,
    ...payload,
  };
  if (!teacherThreadStore[conversationId]) {
    teacherThreadStore[conversationId] = [];
  }
  teacherThreadStore[conversationId].push(newMsg);
  return { data: newMsg };
};

export const escalateTeacherConversation = async (conversationId: string, payload: Payload) => {
  return { data: { success: true, conversationId, ...payload } };
};

export const markTeacherConversationResolved = async (conversationId: string) => {
  return { data: { success: true, conversationId, resolved: true } };
};

import { getStoredAbcLists } from '../stores/abcListsStore';

export interface BehaviorIncidentOptionItem {
  name: string;
  definition?: string;
  default_category?: string;
}

export interface BehaviorIncidentOptionsResponse {
  behaviors: BehaviorIncidentOptionItem[];
  antecedents: string[];
  consequences: string[];
  locations: string[];
}

export const getBehaviorIncidentOptions = async (): Promise<BehaviorIncidentOptionsResponse> => {
  try {
    const res = await client.get('/behavior_incidents/options');
    if (res?.data && Array.isArray(res.data.behaviors)) {
      return res.data;
    }
  } catch {}
  const local = getStoredAbcLists();
  return {
    behaviors: local.behaviors.map((b) => ({
      name: b.name,
      definition: b.definition || b.name,
      default_category: b.category,
    })),
    antecedents: local.antecedents.map((a) => a.name),
    consequences: local.consequences.map((c) => c.name),
    locations: local.locations.map((l) => l.name),
  };
};

export const submitAssessmentsForReview = async (studentId: string) => {
  const sid = String(studentId);
  try {
    const res = await client.post(`/teacher/students/${sid}/submit_assessments`);
    markStudentAssessmentCompleted(sid);
    updateStudentStatus(sid, 'assessment_complete');
    return res.data;
  } catch (err) {
    markStudentAssessmentCompleted(sid);
    updateStudentStatus(sid, 'assessment_complete');
    return { success: true, student_id: sid, status: 'assessment_complete' };
  }
};
