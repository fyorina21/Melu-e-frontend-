const fs = require('fs');
let c = fs.readFileSync('src/screens/assessments/SensoryAssessmentScreen.tsx', 'utf8');
c = c.replace('import React, { useState } from ' + String.fromCharCode(39) + 'react' + String.fromCharCode(39) + ';', 'import React, { useState, useEffect } from ' + String.fromCharCode(39) + 'react' + String.fromCharCode(39) + ';');
c = c.replace('import { saveSensoryAssessment } from ' + String.fromCharCode(39) + '../../api/teacherExtrasApi' + String.fromCharCode(39) + ';', 'import { saveSensoryAssessment, getTeacherStudentProfile, getSensoryAssessment } from ' + String.fromCharCode(39) + '../../api/teacherExtrasApi' + String.fromCharCode(39) + ';');
fs.writeFileSync('src/screens/assessments/SensoryAssessmentScreen.tsx', c, 'utf8');
