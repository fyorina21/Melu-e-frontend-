const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
for (let i = 2855; i < 2865; i++) {
  console.log(i+1, lines[i]);
}
