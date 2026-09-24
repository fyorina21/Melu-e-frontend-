const fs = require("fs");
let content = fs.readFileSync("src/screens/programdirector/IupGenerationScreen.tsx", "utf-8");

const target = `    const allCurrentGoals = [...slots.station1, ...slots.station2].filter(Boolean);
    if (allCurrentGoals.some(g => g?.id === goal.id)) {
      if (typeof window !== 'undefined') {
        window.alert('This goal is already assigned. Please select a different goal.');
      } else {
        Alert.alert('Duplicate Goal', 'This goal is already assigned. Please select a different goal.');
      }
      return;
    }`;

const replacement = `    const currentStationGoals = slots[station].filter(Boolean);
    if (currentStationGoals.some(g => g?.id === goal.id)) {
      if (typeof window !== 'undefined') {
        window.alert('this goal is already assigned');
      } else {
        Alert.alert('Duplicate Goal', 'this goal is already assigned');
      }
      return;
    }`;

fs.writeFileSync("src/screens/programdirector/IupGenerationScreen.tsx", content.replace(target, replacement));
console.log("Success");

