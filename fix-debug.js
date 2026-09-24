const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
for (let i = 2945; i < 2955; i++) {
  console.log(i+1, lines[i]);
}
