require('ts-node').register({ transpileOnly: true });
const { mockDb } = require('./src/api/mock/db.ts');
const { routes } = require('./src/api/mock/routes.ts');

const route = routes.find(r => r.pattern === '/sessions/:id/roster' && r.method === 'GET');
try {
  const result = route.handler({ pathParameters: { id: 'active' } });
  console.log('API Result:', JSON.stringify(result, null, 2));
} catch (e) {
  console.error('API Error:', e);
}
