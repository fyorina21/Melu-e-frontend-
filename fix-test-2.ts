import { routes } from './src/api/mock/routes.ts';
const route = routes.find(r => r.pattern === '/program-director/assessment-summary-dashboard');
try {
    const res = route.handler({ query: { studentId: 'student-a' } });
    console.log('SUCCESS');
} catch (e) {
    console.error('ERROR', e);
}
