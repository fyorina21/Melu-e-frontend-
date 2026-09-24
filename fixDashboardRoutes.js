const fs = require('fs');
let c = fs.readFileSync('src/api/mock/routes.ts', 'utf8');

const target = /function buildAssessmentDashboard\(\) \{\s*const students = mockDb\.all\('students'\)\.filter\(\(s\) => s\.status !== 'paused'\);\s*const rows = mockDb\.all\('assessments'\);\s*const teacherName = mockDb\.all\('users'\)\.find\(\(u\) => u\.role === 'teacher'\)\?\.name \?\? 'Teacher A';/;

const replace = "function buildAssessmentDashboard() {\\n  const teacher = mockDb.all('users').find((u) => u.role === 'teacher');\\n  const teacherName = teacher?.name ?? 'Teacher A';\\n  const assignedStudentIds = new Set(mockDb.all('assignments').filter((a) => a.teacherId === teacher?.id).flatMap((a) => a.studentIds));\\n  const students = mockDb.all('students').filter((s) => s.status !== 'paused' && assignedStudentIds.has(s.id));\\n  const rows = mockDb.all('assessments');";

c = c.replace(target, replace.replace(/\\n/g, '\n'));
fs.writeFileSync('src/api/mock/routes.ts', c);
