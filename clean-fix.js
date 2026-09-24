const fs = require('fs');

const screens = [
  'SkillsAssessmentScreen.tsx',
  'BehaviorAssessmentScreen.tsx',
  'PreferenceAssessmentScreen.tsx',
  'SensoryAssessmentScreen.tsx',
  'SocialSkillsAssessmentScreen.tsx'
];

for (const screen of screens) {
  const path = 'src/screens/assessments/' + screen;
  let content = fs.readFileSync(path, 'utf8');
  
  if (screen === 'BehaviorAssessmentScreen.tsx') {
    content = content.replace(/Alert\.alert\('Assessment saved',\s*message,\s*goBack\s*\?\s*\[\{.*\}\]\s*:\s*undefined\);/, 
    "Alert.alert('Assessment saved', message);\n    navigation?.navigate?.('AssessmentSummaryReport' as never);");
  } else {
    // Replace only the first occurrence of showToast(..., 'success')
    let replaced = false;
    content = content.replace(/(showToast\([^)]+['"]success['"]\);)/g, match => {
      if (!replaced) {
        replaced = true;
        return match + "\n      navigation?.navigate?.('AssessmentSummaryReport' as never);";
      }
      return match;
    });
  }
  
  fs.writeFileSync(path, content);
  console.log('Fixed ' + screen);
}
