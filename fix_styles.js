const fs = require("fs");
let content = fs.readFileSync("src/screens/director/DirectorStudentProgressScreen.tsx", "utf-8");

const appendStyles = `
  dropdownItemSub: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },
  statusActive: { backgroundColor: "#DCFCE7" },
  statusActiveText: { fontSize: 10, fontWeight: "700", color: "#166534" },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusPendingText: { fontSize: 10, fontWeight: "700", color: "#B45309" },
});
`;

let newContent = content.replace("});", appendStyles);
fs.writeFileSync("src/screens/director/DirectorStudentProgressScreen.tsx", newContent);
console.log("Success");

