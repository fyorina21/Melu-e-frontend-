import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import StudentAvatar from '../../../../components/StudentAvatar';
import type { StudentOption } from '../../../../api/optionsApi';

interface StudentSelectorRowProps {
  students: StudentOption[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
}

export const StudentSelectorRow: React.FC<StudentSelectorRowProps> = React.memo(
  ({ students, selectedStudentId, onSelectStudent }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const list = students.length > 0 ? students : [{ id: 's1', name: 'Student A', age: 0 }];

    const selectedStudent = useMemo(() => {
      return list.find((s) => s.id === selectedStudentId) || list[0] || null;
    }, [list, selectedStudentId]);

    const filteredStudents = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return list;
      return list.filter((s) => s.name?.toLowerCase().includes(q));
    }, [list, searchQuery]);

    const handleSelect = (id: string) => {
      onSelectStudent(id);
      setDropdownOpen(false);
      setSearchQuery('');
    };

    return (
      <View style={styles.container}>
        <View style={styles.triggerWrapper}>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setDropdownOpen((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityRole="combobox"
            accessibilityState={{ expanded: dropdownOpen }}
            accessibilityLabel={`Selected student: ${selectedStudent?.name ?? 'None'}. Click to choose another student.`}
          >
            <View style={styles.triggerLeft}>
              <StudentAvatar
                name={selectedStudent?.name}
                studentId={selectedStudent?.id}
                photoUrl={
                  (selectedStudent as any)?.photoUrl ||
                  (selectedStudent as any)?.headshotUrl ||
                  (selectedStudent as any)?.photo
                }
                size={36}
                style={{ marginRight: 10 }}
              />
              <View style={styles.nameBlock}>
                <Text style={styles.selectedName} numberOfLines={1}>
                  {selectedStudent ? selectedStudent.name : 'Choose a student...'}
                </Text>
                <Text style={styles.selectedMeta} numberOfLines={1}>
                  {selectedStudent
                    ? `${selectedStudent.phase ? `${selectedStudent.phase} · ` : ''}${selectedStudent.program || 'Caseload'}${selectedStudent.status ? ` · ${selectedStudent.status}` : ''}`
                    : 'Click to select from student caseload'}
                </Text>
              </View>
            </View>
            <View style={styles.triggerRight}>
              <Text style={styles.dropdownHint}>Select Student</Text>
              <Feather
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.bodyText}
              />
            </View>
          </TouchableOpacity>
        </View>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            <View style={styles.searchRow}>
              <Feather
                name="search"
                size={14}
                color={colors.mutedText}
                style={{ marginRight: 6 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students by name..."
                placeholderTextColor={colors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search students"
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
              {filteredStudents.length === 0 ? (
                <Text style={styles.emptyText}>No students found</Text>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => handleSelect(s.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select student ${s.name}`}
                    >
                      <StudentAvatar
                        name={s.name}
                        studentId={s.id}
                        photoUrl={
                          (s as any)?.photoUrl || (s as any)?.headshotUrl || (s as any)?.photo
                        }
                        size={32}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextActive,
                          ]}
                        >
                          {s.name}
                        </Text>
                        <Text style={styles.dropdownItemSub}>
                          {s.phase ? `${s.phase} · ` : ''}
                          {s.program || 'Caseload'}
                          {s.status ? ` · ${s.status}` : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather
                          name="check"
                          size={18}
                          color={colors.navyText}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 50,
  },
  triggerWrapper: {
    width: '100%',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  nameBlock: {
    flex: 1,
  },
  selectedName: {
    ...typography.bodyBold,
    fontSize: 15,
    color: colors.navyText,
  },
  selectedMeta: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 1,
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
  },
  dropdownMenu: {
    marginTop: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  searchInput: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
    padding: 0,
  },
  listScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.bodyText,
  },
  dropdownItemTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
