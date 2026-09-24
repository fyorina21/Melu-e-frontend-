const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('/program-director/assessment-summary-dashboard'));
const end = lines.findIndex((l, i) => i > start && l.includes('/program-director/dashboard'));

console.log(lines.slice(start, end + 1).join('\n'));
