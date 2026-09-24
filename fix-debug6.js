const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
for (let i = 2935; i < 2960; i++) {
  console.log(i+1, lines[i]);
}
