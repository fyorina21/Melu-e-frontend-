const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
for (let i = 2860; i < 2870; i++) {
  console.log(i+1, lines[i]);
}
