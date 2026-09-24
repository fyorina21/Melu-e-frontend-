const fs = require('fs');
let c = fs.readFileSync('src/screens/systemadmin/StaffAccountManagementScreen.tsx', 'utf8');

// Change canAssignMore logic
const targetLogic = /const canAssignMore = assignedStudentIds\.length < TEACHER_CAPACITY;/;
const replaceLogic = "const totalAssignedCount = new Set(assignments.flatMap(a => a.students)).size;\n  const canAssignMore = totalAssignedCount < TEACHER_CAPACITY;";
c = c.replace(targetLogic, replaceLogic);

// Change toggle limit check
const targetToggle = /if \(selectedForAssign\.length \+ assignedStudentIds\.length >= TEACHER_CAPACITY\) return;/;
const replaceToggle = "if (selectedForAssign.length + totalAssignedCount >= TEACHER_CAPACITY) return;";
c = c.replace(targetToggle, replaceToggle);

// Change caption text
const targetCaption = /max \{TEACHER_CAPACITY\} per room/g;
const replaceCaption = "max {TEACHER_CAPACITY} total";
c = c.replace(targetCaption, replaceCaption);

// Change warn text
const targetWarn = /Maximum 2 students per teacher for this room/g;
const replaceWarn = "Maximum 2 students per teacher in total";
c = c.replace(targetWarn, replaceWarn);

fs.writeFileSync('src/screens/systemadmin/StaffAccountManagementScreen.tsx', c);
