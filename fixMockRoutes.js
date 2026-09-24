const fs = require('fs');
let c = fs.readFileSync('src/api/mock/routes.ts', 'utf8');

c = c.replace(
  /const existing = mockDb\.all\('assignments'\)\.find\(\(a\) => a\.blockId === blockId\);\s*if \(existing\) \{\s*mockDb\.updateById\('assignments', existing\.id, \{ studentIds \}\);\s*\} else \{\s*mockDb\.insert\('assignments', \{\s*id: newId\('asn'\),\s*teacherId: teacherId \?\? 's1',\s*studentIds,\s*blockId,\s*stationId: 'stn-1',\s*scheduledDate: new Date\(\)\.toISOString\(\),\s*status: 'confirmed'\s*\}\);\s*\}/,
  "const targetTeacherId = teacherId ?? 's1';\n        const existing = mockDb.all('assignments').find((a) => a.blockId === blockId && a.teacherId === targetTeacherId);\n        if (existing) {\n          mockDb.updateById('assignments', existing.id, { studentIds });\n        } else {\n          mockDb.insert('assignments', {\n            id: newId('asn'),\n            teacherId: targetTeacherId,\n            studentIds,\n            blockId,\n            stationId: 'stn-1',\n            scheduledDate: new Date().toISOString(),\n            status: 'confirmed'\n          });\n        }"
);

fs.writeFileSync('src/api/mock/routes.ts', c);
