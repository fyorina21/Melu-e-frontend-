const fs = require("fs");
let content = fs.readFileSync("src/screens/programdirector/ProgramDirectorDashboardScreen.tsx", "utf-8");

const searchStr = `interface DashboardData {`;
const replacement = `interface DashboardData {
  notifications?: { id: string | number; text: string; urgent: boolean }[];`;

if (content.includes(searchStr)) {
  fs.writeFileSync("src/screens/programdirector/ProgramDirectorDashboardScreen.tsx", content.replace(searchStr, replacement));
  console.log("Success");
} else {
  console.log("Not found");
}

