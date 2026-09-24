import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { SystemAdminStackParamList } from '../../types';
import { useToast } from '../../context/ToastContext';

type Props = NativeStackScreenProps<SystemAdminStackParamList, 'RoleManagement'>;

const mockRoles = [
  { id: '1', name: 'System Admin', description: 'Full system access and configuration', count: 1, system: true },
  { id: '2', name: 'Program Director', description: 'Oversees program curriculum and scheduling', count: 2, system: true },
  { id: '3', name: 'Teacher / BCBA', description: 'Manages students and conducts assessments', count: 5, system: true },
  { id: '4', name: 'Assistant', description: 'Assists in classrooms', count: 12, system: false },
];

function Badge({ children, system }: { children: React.ReactNode; system?: boolean }) {
  return (
    <View style={[styles.badge, system ? styles.badgeSystem : styles.badgeCustom]}>
      <Text style={[styles.badgeText, system ? styles.badgeSystemText : styles.badgeCustomText]}>{children}</Text>
    </View>
  );
}

export default function RoleManagementScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [roles, setRoles] = useState(mockRoles);
  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const saveEdit = (id: string) => {
    if (!editForm.name.trim()) return;
    setRoles(rs => rs.map(r => r.id === id ? { ...r, name: editForm.name, description: editForm.description } : r));
    setEditingRole(null);
  };

  const addRole = () => {
    if (!newRole.name.trim()) return;
    setRoles((rs) => [...rs, { id: String(Date.now()), ...newRole, count: 0, system: false }]);
    setNewRole({ name: '', description: '' });
    setAddingRole(false);
  };

  const handleSave = () => {
    showToast('Role changes saved successfully', 'success');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Role Management</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={typography.h2}>Role Management</Text>
          <Text style={typography.caption}>SCR-SYS-002 • Configure staff roles and their descriptions</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={typography.bodyBold}>Roles</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddingRole(true)}>
              <Feather name="plus" size={14} color={colors.primaryBlue} />
              <Text style={styles.addBtnText}>Add Role</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, { flex: 2 }]}>Role Name</Text>
              <Text style={[styles.headerText, { flex: 3 }]}>Description</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Staff Count</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Type</Text>
              <Text style={[styles.headerText, { width: 70, textAlign: 'center' }]}>Actions</Text>
            </View>

            {roles.map((role) => (
              <View key={role.id} style={[styles.tableRow, editingRole === role.id && styles.addingRow]}>
                {editingRole === role.id ? (
                  <>
                    <View style={{ flex: 2, paddingRight: spacing.xs }}>
                      <TextInput
                        style={styles.input}
                        value={editForm.name}
                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                        placeholder="Role name"
                        autoFocus
                      />
                    </View>
                    <View style={{ flex: 3, paddingRight: spacing.xs }}>
                      <TextInput
                        style={styles.input}
                        value={editForm.description}
                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, description: text }))}
                        placeholder="Description"
                      />
                    </View>
                    <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{role.count}</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Badge system={role.system}>{role.system ? 'System' : 'Custom'}</Badge>
                    </View>
                    <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
                      <TouchableOpacity onPress={() => saveEdit(role.id)}>
                        <Feather name="check" size={18} color={colors.statusApprovedText} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingRole(null)}>
                        <Feather name="x" size={18} color={colors.statusRevisionText} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.cellTextBold, { flex: 2 }]}>{role.name}</Text>
                    <Text style={[styles.cellText, { flex: 3 }]} numberOfLines={2}>{role.description}</Text>
                    <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{role.count}</Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Badge system={role.system}>{role.system ? 'System' : 'Custom'}</Badge>
                    </View>
                    <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
                      <TouchableOpacity onPress={() => { setEditingRole(role.id); setEditForm({ name: role.name, description: role.description }); }}>
                        <Feather name="edit-2" size={16} color={colors.primaryBlue} />
                      </TouchableOpacity>
                      {!role.system && (
                        <TouchableOpacity onPress={() => setRoles((rs) => rs.filter((r) => r.id !== role.id))}>
                          <Feather name="trash-2" size={16} color={colors.statusRevisionText} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            ))}

            {addingRole && (
              <View style={[styles.tableRow, styles.addingRow]}>
                <View style={{ flex: 2, paddingRight: spacing.xs }}>
                  <TextInput
                    style={styles.input}
                    value={newRole.name}
                    onChangeText={(text) => setNewRole((n) => ({ ...n, name: text }))}
                    placeholder="Role name"
                    placeholderTextColor={colors.mutedText}
                    autoFocus
                  />
                </View>
                <View style={{ flex: 3, paddingRight: spacing.xs }}>
                  <TextInput
                    style={styles.input}
                    value={newRole.description}
                    onChangeText={(text) => setNewRole((n) => ({ ...n, description: text }))}
                    placeholder="Description"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>
                <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>0</Text>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Badge>Custom</Badge>
                </View>
                <View style={{ width: 70, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
                  <TouchableOpacity onPress={addRole}>
                    <Feather name="check" size={18} color={colors.statusApprovedText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAddingRole(false)}>
                    <Feather name="x" size={18} color={colors.statusRevisionText} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.saveMainBtn} onPress={handleSave}>
          <Feather name="save" size={16} color={colors.navyText} />
          <Text style={styles.saveMainBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: '#334155', fontSize: 14, fontWeight: '500' },
  headerTitle: { ...typography.h3, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.xl },
  sectionHeader: { gap: spacing.xs },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addBtnText: { color: colors.primaryBlue, fontWeight: '600', fontSize: 13 },
  table: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerText: { fontSize: 11, fontWeight: '600', color: colors.mutedText, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  addingRow: { backgroundColor: '#F0F9FF' },
  cellText: { fontSize: 13, color: colors.bodyText },
  cellTextBold: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badgeSystem: { backgroundColor: colors.statusInProgressBg },
  badgeSystemText: { color: colors.statusInProgressText, fontSize: 11, fontWeight: '600' },
  badgeCustom: { backgroundColor: colors.statusPendingBg },
  badgeCustomText: { color: colors.statusPendingText, fontSize: 11, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, fontSize: 13, backgroundColor: colors.bgCard },
  saveMainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primaryYellow, padding: spacing.md, borderRadius: radius.md, alignSelf: 'flex-start', paddingHorizontal: spacing.xl },
  saveMainBtnText: { color: colors.navyText, fontWeight: '700', fontSize: 14 },
});
