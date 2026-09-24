const fs = require("fs");
let content = fs.readFileSync("src/api/mock/routes.ts", "utf-8");

const target = `    handler: () => {
      const students = mockDb.all('students').filter((s) => s.status !== 'paused');
      const assessments = mockDb.all('assessments');
      const iups = mockDb.all('iups');
      const goalBank = mockDb.all('goalBank');
      const inAssessment = students.filter((s) => assessments.some((a) => a.studentId === s.id && a.status === 'in_progress')).length;
      const activeIups = iups.filter((i) => i.status === 'active').length;
      const readyForIup = students.filter((s) => !iups.some((i) => i.studentId === s.id)).length;
      const goalsAssigned = students.reduce((sum, s) => sum + (s.goals?.length ?? 0), 0);
      const recentActivity = [
        ...students
          .filter((s) => assessments.some((a) => a.studentId === s.id && a.status === 'in_progress'))
          .slice(0, 3)
          .map((s) => \`Assessment in progress - \${s.fullName}\`),
        ...iups
          .filter((i) => i.status === 'active')
          .slice(0, 3)
          .map((i) => {
            const student = students.find((s) => s.id === i.studentId);
            return \`IUP active - \${student?.fullName ?? 'Student'}\`;
          }),
      ].slice(0, 5);
      return {
        unreadCount: mockDb.all('notifications').filter((n) => !n.read).length,
        studentsInAssessment: Math.max(inAssessment, 1),
        readyForIup: Math.max(readyForIup, 1),
        activeIupPlans: Math.max(activeIups, 1),
        goalsAssignedThisMonth: Math.max(goalsAssigned, 1),
        pipeline: [
          { name: 'In Assessment', count: inAssessment },
          { name: 'Ready for IUP', count: readyForIup },
          { name: 'Active IUP', count: activeIups },
        ],
        recentActivity,
      };
    },`;

const replacement = `    handler: () => {
      const students = mockDb.all('students').filter((s) => s.status !== 'paused');
      const assessments = mockDb.all('assessments');
      const iups = mockDb.all('iups');
      const dbNotifs = mockDb.all('notifications');
      
      const mappedStudents = students.map((s) => {
        const hasAssessment = assessments.some(a => a.studentId === s.id && a.status === 'completed');
        const hasIup = iups.some(i => i.studentId === s.id);
        const stage = hasIup ? 'Caseload' : (hasAssessment ? 'IUP' : 'Assessment');
        return {
          id: s.id,
          fullName: s.fullName,
          age: 8,
          programType: s.programType || 'ABA Therapy',
          therapist: 'Teacher A',
          currentStage: stage,
          progressPercent: 45,
          flags: 0,
          statusText: stage === 'Assessment' ? 'Pending Assessment' : 'Active'
        };
      });

      const inAssessment = mappedStudents.filter(s => s.currentStage === 'Assessment').length;
      const readyForIup = mappedStudents.filter(s => s.currentStage === 'IUP').length;
      const activeCaseload = mappedStudents.filter(s => s.currentStage === 'Caseload').length;

      const pdNotifications = dbNotifs.map(n => ({
        id: n.id,
        text: n.type === 'progress' ? \\\`Goal update: \\\${n.payload?.name ?? 'Goal'}\\\` : n.type === 'observation' ? 'New home observation submitted' : 'New message received',
        urgent: !n.read
      }));

      return {
        unreadCount: dbNotifs.filter(n => !n.read).length,
        totalStudents: students.length,
        inAssessment,
        assessmentCompleted: readyForIup,
        readyForSessions: activeCaseload,
        workflowStages: [
          { id: 's1', label: 'In Assessment', count: inAssessment, color: '#F59E0B' },
          { id: 's2', label: 'Ready for IUP', count: readyForIup, color: '#3B82F6' },
          { id: 's3', label: 'Active Caseload', count: activeCaseload, color: '#10B981' }
        ],
        students: mappedStudents,
        clinicalOverview: {
          activeStudents: students.length,
          assessmentsPending: inAssessment,
          sessionsAssigned: activeCaseload,
          completedSessions: 12,
          goalsInProgress: 45
        },
        recentActivity: [
          { text: 'New assessment completed for Student A', type: 'assessment', time: '2 hours ago' },
          { text: 'IUP finalized for Student B', type: 'iup', time: '5 hours ago' }
        ],
        notifications: pdNotifications.length > 0 ? pdNotifications : [
          { id: 1, text: '2 assessments awaiting your review', urgent: true }
        ]
      };
    },`;

if (content.includes(target)) {
  fs.writeFileSync("src/api/mock/routes.ts", content.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found");
}

