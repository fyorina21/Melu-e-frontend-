const fs = require("fs");
let content = fs.readFileSync("src/screens/director/DirectorSchedulingScreen.tsx", "utf-8");

const target = "  saveBtnDisabled: { opacity: 0.4 },\r\n  saveBtnText: { fontWeight: '700', color: colors.navyText },\r\n});";

const replacement = `  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontWeight: '700', color: colors.navyText },

  /* IUP-style student dropdown rows */
  emptyListText: { padding: 12, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  studentDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentDropdownItemActive: { backgroundColor: '#FEF9C3' },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarActive: { backgroundColor: '#FDE047' },
  studentAvatarText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  studentDropdownName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  studentDropdownNameActive: { fontWeight: '700' },
  studentDropdownSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusActiveText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPendingText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  checkmarkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});`;

if (!content.includes("saveBtnText: { fontWeight: '700', color: colors.navyText },")) {
  console.log("Target not found");
  process.exit(1);
}

// Replace the last occurrence of the closing styles
const idx = content.lastIndexOf("saveBtnDisabled: { opacity: 0.4 },");
const endIdx = content.indexOf("});", idx);
const newContent = content.substring(0, idx) + replacement;
fs.writeFileSync("src/screens/director/DirectorSchedulingScreen.tsx", newContent);
console.log("Success");
