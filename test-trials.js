require('ts-node').register({ transpileOnly: true });
const { mockDb } = require('./src/api/mock/db.ts');
const { routes } = require('./src/api/mock/routes.ts');

const getRoute = routes.find(r => r.pattern === '/sessions/:id/roster' && r.method === 'GET');
const postRoute = routes.find(r => r.pattern === '/sessions/:id/students/:sid/goals/:gid/trials' && r.method === 'POST');

mockDb.data.trials = [];

console.log('Logging one trial...');
postRoute.handler({ 
  pathParameters: { id: 'test', sid: 'student-a', gid: 'goal-1' },
  body: { promptLevel: 'G' }
});

const roster = getRoute.handler({ pathParameters: { id: 'test' } });
const studentA = roster.students.find(s => s.id === 'student-a');
console.log('Trials returned:', studentA.trials.length);
console.log('Trials in DB:', mockDb.all('trials').length);
