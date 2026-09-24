require('ts-node').register({ transpileOnly: true });
const { mockDb } = require('./src/api/mock/db.ts');
const { routes } = require('./src/api/mock/routes.ts');

const getRoute = routes.find(r => r.pattern === '/sessions/:id/summary' && r.method === 'GET');
// Mock currentTeacherObj logic since it's a global dependency
const teacherObj = mockDb.all('staffMembers').find(s => s.role === 'teacher');
mockDb.data.sessionSummaries = [{ id: 's1', sessionId: 's1', studentIds: ['student-a'] }];

const res = getRoute.handler({ pathParameters: { id: 's1' } });
console.log(JSON.stringify(res.students.find(s => s.id === 'student-a')?.goals, null, 2));
