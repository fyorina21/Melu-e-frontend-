const fs = require('fs');
let c = fs.readFileSync('src/screens/systemadmin/StaffAccountManagementScreen.tsx', 'utf8');

const tLogic = /const totalAssignedCount = new Set\(assignments\.flatMap\(a => a\.students\)\)\.size;\s*const canAssignMore = totalAssignedCount < TEACHER_CAPACITY;/;
const rLogic = "const allAssignedSet = new Set([...assignments.flatMap(a => a.students), ...selectedForAssign]);\n  const totalAssignedCount = allAssignedSet.size;\n  const canAssignMore = totalAssignedCount < TEACHER_CAPACITY;";
c = c.replace(tLogic, rLogic);

const tToggle = /if \(selectedForAssign\.length \+ totalAssignedCount >= TEACHER_CAPACITY\) return;/;
const rToggle = "const newTotal = new Set([...allAssignedSet, studentId]).size;\n        if (newTotal > TEACHER_CAPACITY) return;";
c = c.replace(tToggle, rToggle);

const tMap = /const selected = selectedForAssign\.includes\(s\.id\);\s*const disabled = !canAssignMore && !selected;/;
const rMap = "const selected = selectedForAssign.includes(s.id);\n                const disabled = !selected && (new Set([...allAssignedSet, s.id]).size > TEACHER_CAPACITY);";
c = c.replace(tMap, rMap);

fs.writeFileSync('src/screens/systemadmin/StaffAccountManagementScreen.tsx', c);
