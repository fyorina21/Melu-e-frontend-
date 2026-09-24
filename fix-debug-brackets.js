const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('/program-director/assessment-summary-dashboard'));
let bracketCount = 0;
let foundEnd = -1;
for (let i = start; i < lines.length; i++) {
  const open = (lines[i].match(/\{/g) || []).length;
  const close = (lines[i].match(/\}/g) || []).length;
  bracketCount += open - close;
  if (bracketCount < 0) {
    foundEnd = i;
    break;
  }
}
console.log('Start:', start, 'End:', foundEnd, 'Lines:', lines.length);
