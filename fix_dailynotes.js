const fs = require("fs");
let content = fs.readFileSync("src/screens/dailynotes/DailyNotesScreen.tsx", "utf-8");

// 1. Remove getBehaviorAssessment from import
content = content.replace(
  `import { getTeacherDashboard, getBehaviorAssessment } from '../../api/teacherExtrasApi';`,
  `import { getTeacherDashboard } from '../../api/teacherExtrasApi';`
);

// 2. Remove BehaviorRecord interface
content = content.replace(
  /\ninterface BehaviorRecord \{[\s\S]*?\}\n/,
  "\n"
);

// 3. Remove BehaviorAssessmentData interface
content = content.replace(
  /\ninterface BehaviorAssessmentData \{[\s\S]*?\}\n/,
  "\n"
);

// 4. Remove LIKERT_SCORE, MASS_FUNCTIONS, FAST_CATEGORIES, hasBehaviorData, getMassFunction, getFastCategory
content = content.replace(
  /\nconst LIKERT_SCORE[\s\S]*?\n\nfunction getFastCategory[\s\S]*?\}\n/,
  "\n"
);

// 5. Remove behavior-related state variables and effects
content = content.replace(
  /\n  \/\/ Behavior Assessment \(shared with the BehaviorAssessment screen\)[\s\S]*?const \[openDropdown/,
  "\n  const [openDropdown"
);

// 6. Remove the fetchBehavior callback and useFocusEffect + useEffect for it
content = content.replace(
  /\n  \/\/ Pull the shared Behavior Assessment for the selected student[\s\S]*?\n  \}\);\n\n  useEffect\(\(\) => \{\n    fetchBehavior\(\);\n  \}, \[fetchBehavior\]\);\n/,
  "\n"
);

// 7. Remove the Student Selector Dropdown (only used for behavior)
content = content.replace(
  /\n          \{\/\* Student Selector Dropdown \*\/\}[\s\S]*?\n          \}\n          \{\/\* Status Filter Dropdown \*\/\}/,
  "\n          {/* Status Filter Dropdown */"
);

// 8. Remove the Behavior Assessment Card
content = content.replace(
  /\n        \{\/\* Behavior Assessment Card \*\/\}\n        <View style=\{styles\.behaviorAssessmentCard\}>[\s\S]*?\n        <\/View>\n\n        \{\/\* Session Records Table \*\/\}/,
  "\n        {/* Session Records Table */"
);

// 9. Remove behaviorAssessmentCard and related styles
content = content.replace(
  /\n  behaviorAssessmentCard:[\s\S]*?\n  tableCard:/,
  "\n  tableCard:"
);

fs.writeFileSync("src/screens/dailynotes/DailyNotesScreen.tsx", content);
console.log("Done");
