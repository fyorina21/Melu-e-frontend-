const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('/program-director/assessment-summary-dashboard'));
const end = lines.findIndex((l, i) => i > start && l.includes('/program-director/dashboard'));

let b = 0;
for(let i = start - 1; i < end; i++) {
  const line = lines[i];
  b += (line.match(/\{/g) || []).length;
  b -= (line.match(/\}/g) || []).length;
  if(b < 0) console.log('Went negative at line ' + (i+1));
}
console.log('Final brace count for route:', b);
