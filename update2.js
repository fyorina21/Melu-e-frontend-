const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/SocialSkillsAssessmentScreen.tsx', 'utf8');
c = c.replace('Student: {studentId === ' + String.fromCharCode(39) + 'student-b' + String.fromCharCode(39) + ' ? ' + String.fromCharCode(39) + 'Student B' + String.fromCharCode(39) + ' : ' + String.fromCharCode(39) + 'Student A' + String.fromCharCode(39) + '}', 'Student: {profile?.fullName || ' + String.fromCharCode(39) + 'Student' + String.fromCharCode(39) + '}');
fs.writeFileSync('src/screens/assessments/SocialSkillsAssessmentScreen.tsx', c, 'utf8');
