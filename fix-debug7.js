const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // naive check
  count += (line.match(/\{/g) || []).length;
  count -= (line.match(/\}/g) || []).length;
}
console.log('Final brace count:', count);
