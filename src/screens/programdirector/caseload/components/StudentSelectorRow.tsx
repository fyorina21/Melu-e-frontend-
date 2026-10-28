import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import StudentAvatar from '../../../../components/StudentAvatar';
import type { StudentOption } from '../../../../api/optionsApi';

interface StudentSelectorRowProps {
  students: StudentOption[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
}

export const StudentSelectorRow: React.FC<StudentSelectorRowProps> = React.memo(
  ({ students, selectedStudentId, onSelectStudent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const list: StudentOption[] =
      students.length > 0
        ? students
        : [{ id: 's1', name: 'Student A', age: 6, program: 'Comprehensive ABA' }];

    const selectedStudent = useMemo(
      () => list.find((s) => s.id === selectedStudentId) || list[0],
      [list, selectedStudentId],
    );

    const filteredStudents = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return list;
      return list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.program && s.program.toLowerCase().includes(q)) ||
          s.id.toLowerCase().includes(q),
      );
    }, [list, searchQuery]);

    return (
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.sectionLabel}>Select Student</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{list.length} Students</Text>
          </View>
        </View>

        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            style={[styles.dropdownTrigger, isOpen && styles.dropdownTriggerOpen]}
            onPress={() => setIsOpen((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityRole="combobox"
            accessibilityLabel={`Select student dropdown, currently selected ${selectedStudent?.name}`}
            accessibilityState={{ expanded: isOpen }}
          >
            <View style={styles.triggerLeft}>
              <StudentAvatar
                name={selectedStudent?.name || 'Student'}
                studentId={selectedStudent?.id || ''}
                photoUrl={
                  (selectedStudent as any)?.photoUrl ||
                  (selectedStudent as any)?.headshotUrl ||
                  (selectedStudent as any)?.photo
                }
                size={34}
              />
              <View style={styles.triggerMeta}>
                <Text style={styles.selectedStudentName} numberOfLines={1}>
                  {selectedStudent?.name || 'Select a student'}
                </Text>
                <Text style={styles.selectedStudentSub} numberOfLines={1}>
                  {selectedStudent?.program || 'Comprehensive ABA'}
                  {selectedStudent?.age ? ` · Age ${selectedStudent.age}` : ''}
                  {selectedStudent?.phase ? ` · ${selectedStudent.phase}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.triggerRight}>
              <Feather
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.navyText}
              />
            </View>
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.dropdownMenu}>
              <View style={styles.searchBox}>
                <Feather
                  name="search"
                  size={15}
                  color={colors.mutedText}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students by name, program..."
                  placeholderTextColor={colors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Clear search"
                  >
                    <Feather name="x" size={14} color={colors.mutedText} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.listScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => {
                        onSelectStudent(s.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select student ${s.name}`}
                    >
                      <StudentAvatar
                        name={s.name}
                        studentId={s.id}
                        photoUrl={
                          (s as any)?.photoUrl || (s as any)?.headshotUrl || (s as any)?.photo
                        }
                        size={30}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.itemStudentName,
                            isSelected && styles.itemStudentNameActive,
                          ]}
                        >
                          {s.name}
                        </Text>
                        <Text style={styles.itemStudentSub}>
                          {s.program || 'Comprehensive ABA'}
                          {s.age ? ` · Age ${s.age}` : ''}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.selectedCheckWrap}>
                          <Feather name="check" size={15} color={colors.navyText} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No students found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 100,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bodyText,
  },
  dropdownWrap: {
    position: 'relative',
    zIndex: 100,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dropdownTriggerOpen: {
    borderColor: colors.navyText,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  triggerMeta: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  selectedStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  selectedStudentSub: {
    fontSize: 12,
    color: colors.bodyText,
    marginTop: 2,
  },
  triggerRight: {
    paddingLeft: spacing.xs,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.navyText,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    padding: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navyText,
    paddingVertical: 0,
  },
  listScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    borderRadius: radius.sm,
    marginVertical: 1,
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  itemStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  itemStudentNameActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
  itemStudentSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 1,
  },
  selectedCheckWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  emptyWrap: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
});
