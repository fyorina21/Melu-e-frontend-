const fs = require("fs");
let content = fs.readFileSync("src/screens/director/DirectorSchedulingScreen.tsx", "utf-8");

const startMarker = "function AssignmentEditorModal({";
const endMarker = "export default function DirectorSchedulingScreen(";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log("Markers not found", startIdx, endIdx);
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const newModal = `function AssignmentEditorModal({
  visible,
  block,
  students,
  assignedIds,
  onClose,
  onSave,
}: {
  visible: boolean;
  block: ScheduleBlock | null;
  students: Option[];
  assignedIds?: string[];
  onClose: () => void;
  onSave: (blockId: string, studentIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(assignedIds || []);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    setSelected(assignedIds || []);
    setStudentSearch('');
  }, [assignedIds, visible]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const overCapacity = selected.length > CAPACITY;
  const filteredStudents = students.filter((s) =>
    String(s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (!block) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{block.teacherName} \u2014 {block.stationName}</Text>
              <Text style={styles.modalSub}>{block.startTime} \u2013 {block.endTime}</Text>
            </View>
            <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
              <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>
                {selected.length}/{CAPACITY} Students
              </Text>
            </View>
          </View>

          <View style={styles.modalSearchRow}>
            <Feather name="search" size={14} color={colors.mutedText} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search students by name..."
              placeholderTextColor={colors.mutedText}
              value={studentSearch}
              onChangeText={setStudentSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {filteredStudents.length === 0 && (
              <Text style={styles.emptyListText}>No students found.</Text>
            )}
            {filteredStudents.map((s) => {
              const isChecked = selected.includes(s.id);
              const sAny = s as any;
              const status: string = sAny.status || 'Active';
              const subtitle = sAny.program ? (status + ' \u00b7 ' + sAny.program) : status;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.studentDropdownItem, isChecked && styles.studentDropdownItemActive]}
                  onPress={() => toggle(s.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.studentAvatar, isChecked && styles.studentAvatarActive]}>
                    <Text style={styles.studentAvatarText}>{(s.name || 'S').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentDropdownName, isChecked && styles.studentDropdownNameActive]}>
                      {s.name}
                    </Text>
                    <Text style={styles.studentDropdownSub}>{subtitle}</Text>
                  </View>
                  <View style={[styles.statusBadge, status === 'Active' ? styles.statusActive : styles.statusPending]}>
                    <Text style={[styles.statusBadgeText, status === 'Active' ? styles.statusActiveText : styles.statusPendingText]}>
                      {status}
                    </Text>
                  </View>
                  {isChecked && (
                    <View style={styles.checkmarkBadge}>
                      <Feather name="check" size={12} color={colors.navyText} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, overCapacity && styles.saveBtnDisabled]}
              disabled={overCapacity}
              onPress={() => onSave(block.id, selected)}
            >
              <Text style={styles.saveBtnText}>Save Assignment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

`;

fs.writeFileSync("src/screens/director/DirectorSchedulingScreen.tsx", before + newModal + after);
console.log("Success");
