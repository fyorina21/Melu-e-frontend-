const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/PreferenceAssessmentScreen.tsx', 'utf8');
c = c.replace('{profile?.fullName || Student}', '{profile?.fullName || ' + String.fromCharCode(39) + 'Student' + String.fromCharCode(39) + '}');
c = c.replace('{profile?.age || ?}', '{profile?.age || ' + String.fromCharCode(39) + '?' + String.fromCharCode(39) + '}');
fs.writeFileSync('src/screens/assessments/PreferenceAssessmentScreen.tsx', c, 'utf8');
