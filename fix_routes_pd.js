const fs = require("fs");
let content = fs.readFileSync("src/api/mock/routes.ts", "utf-8");

const target = `      return {
        unreadCount: mockDb.all('notifications').filter((n) => !n.read).length,
        studentsInAssessment: Math.max(inAssessment, 1),`;

const replacement = `      const dbNotifs = mockDb.all('notifications');
      const pdNotifications = dbNotifs.map(n => ({
        id: n.id,
        text: n.type === 'progress' ? \`Goal update: \${n.payload?.name ?? 'Goal'}\` : n.type === 'observation' ? 'New home observation submitted' : 'New message received',
        urgent: !n.read
      }));
      return {
        notifications: pdNotifications.length > 0 ? pdNotifications : [
          { id: 1, text: '2 assessments awaiting your review', urgent: true },
          { id: 2, text: 'IUP renewal due this week', urgent: true },
        ],
        unreadCount: dbNotifs.filter((n) => !n.read).length,
        studentsInAssessment: Math.max(inAssessment, 1),`;

fs.writeFileSync("src/api/mock/routes.ts", content.replace(target, replacement));
console.log("Success");

