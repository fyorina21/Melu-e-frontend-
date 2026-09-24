const fs = require("fs");
let content = fs.readFileSync("src/screens/director/DirectorStudentProgressScreen.tsx", "utf-8");

const replacement = `                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                          {s.name}
                        </Text>
                        <Text style={styles.dropdownItemSub}>
                          {s.assessmentStatus ?? s.status} • {s.program || 'ABA Therapy'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          s.status === 'Active' ? styles.statusActive : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            s.status === 'Active' ? styles.statusActiveText : styles.statusPendingText,
                          ]}
                        >
                          {s.status}
                        </Text>
                      </View>`;

let newContent = content.replace(/<Text style=\{\[styles\.dropdownItemText.*?<\/Text>\s*\{isSelected && <Feather.*?\/>\}/s, replacement);
if (newContent !== content) {
  fs.writeFileSync("src/screens/director/DirectorStudentProgressScreen.tsx", newContent);
  console.log("Success");
} else {
  console.log("Regex not found");
}

