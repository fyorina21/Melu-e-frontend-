const fs = require('fs');
const lines = fs.readFileSync('src/api/mock/routes.ts', 'utf-8').split('\n');
console.log(Buffer.from(lines[2862]).toString('hex'));
