const fs = require("fs");
let content = fs.readFileSync("src/screens/programdirector/ProgramDirectorDashboardScreen.tsx", "utf-8");

const searchStr = `  const notifications = [
    { id: 1, text: '2 assessments awaiting your review', urgent: true },
    { id: 2, text: 'IUP renewal due this week', urgent: true },
    { id: 3, text: 'Caseload report ready for download', urgent: false },
    { id: 4, text: 'New parent message received', urgent: false },
  ];
  const urgentCount = notifications.filter((n) => n.urgent).length;`;

const replacement = `  const notifications = data.notifications ?? [];
  const urgentCount = notifications.filter((n) => n.urgent).length;`;

if (content.includes(searchStr)) {
  fs.writeFileSync("src/screens/programdirector/ProgramDirectorDashboardScreen.tsx", content.replace(searchStr, replacement));
  console.log("Success");
} else {
  console.log("Not found");
}

