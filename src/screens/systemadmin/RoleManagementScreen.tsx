import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';

interface RoleItem {
  id: string;
  name: string;
  description: string;
  staffCount: number;
  type: 'System' | 'Custom';
}

const INITIAL_ROLES: RoleItem[] = [
  { id: '1', name: 'teacher', description: 'Direct therapy provider', staffCount: 8, type: 'System' },
  { id: '2', name: 'coordinator', description: 'Coordinates caseloads and scheduling', staffCount: 2, type: 'System' },
  { id: '3', name: 'director', description: 'Clinical oversight and approval', staffCount: 1, type: 'System' },
  { id: '4', name: 'institutional_admin', description: 'Clinical configuration and management', staffCount: 1, type: 'System' },
  { id: '5', name: 'sysadmin', description: 'Full system access and configuration', staffCount: 1, type: 'System' },
];

export default function RoleManagementScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'RoleManagement'>) {
  const [roles, setRoles] = useState<RoleItem[]>(INITIAL_ROLES);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      Alert.alert('Validation Error', 'Role name is required.');
      return;
    }

    const newRole: RoleItem = {
      id: `custom-${Date.now()}`,
      name: newRoleName.trim().toLowerCase().replace(/\s+/g, '_'),
      description: newDescription.trim(),
      staffCount: 0,
      type: 'Custom',
    };

    setRoles((prev) => [...prev, newRole]);
    setNewRoleName('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleCancelAdd = () => {
    setNewRoleName('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleSaveChanges = () => {
    Alert.alert('Success', 'Role configuration saved successfully.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Role Management"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />

      {/* Screen Sub-header / Breadcrumb Header */}
      <View style={styles.subHeader}>
        <View style={styles.titleRow}>
          <Text style={typography.h1}>Role Management</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SCR-SYS-002</Text>
          </View>
        </View>
        <Text style={styles.breadcrumbText}>
          <Feather name="settings" size={12} color={colors.mutedText} /> System Configuration / Role Management
        </Text>
        <Text style={typography.caption}>
          SCR-SYS-002 · Configure staff roles and their descriptions
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Roles Table Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={typography.h2}>Roles</Text>
            {!isAdding && (
              <TouchableOpacity style={styles.addRoleBtn} onPress={() => setIsAdding(true)}>
                <Feather name="plus" size={14} color="#0284C7" />
                <Text style={styles.addRoleBtnText}>Add Role</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Table Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.columnHeader, { flex: 1.5 }]}>ROLE NAME</Text>
            <Text style={[styles.columnHeader, { flex: 2.5 }]}>DESCRIPTION</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>STAFF COUNT</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>TYPE</Text>
            <Text style={[styles.columnHeader, { flex: 0.8, textAlign: 'right' }]}>ACTIONS</Text>
          </View>

          {/* Existing Roles List */}
          {roles.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[typography.bodyBold, { flex: 1.5 }]}>{item.name}</Text>
              <Text style={[typography.body, { flex: 2.5, color: colors.bodyText }]} numberOfLines={1}>
                {item.description || '—'}
              </Text>
              <Text style={[typography.body, { flex: 1, textAlign: 'center' }]}>{item.staffCount}</Text>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={[styles.typePill, item.type === 'Custom' && styles.typePillCustom]}>
                  <Text style={styles.typePillText}>{item.type}</Text>
                </View>
              </View>
              <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                {item.type === 'Custom' && (
                  <TouchableOpacity
                    onPress={() => setRoles((prev) => prev.filter((r) => r.id !== item.id))}
                  >
                    <Feather name="trash-2" size={14} color={colors.statusRevisionText} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* Inline Add Role Input Row */}
          {isAdding && (
            <View style={[styles.tableRow, styles.addRow]}>
              <View style={{ flex: 1.5, paddingRight: spacing.xs }}>
                <TextInput
                  style={styles.input}
                  placeholder="Role name"
                  placeholderTextColor={colors.mutedText}
                  value={newRoleName}
                  onChangeText={setNewRoleName}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ flex: 2.5, paddingRight: spacing.xs }}>
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  placeholderTextColor={colors.mutedText}
                  value={newDescription}
                  onChangeText={setNewDescription}
                />
              </View>
              <Text style={[typography.body, { flex: 1, textAlign: 'center' }]}>0</Text>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={[styles.typePill, styles.typePillCustom]}>
                  <Text style={styles.typePillText}>Custom</Text>
                </View>
              </View>
              <View style={{ flex: 0.8, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm }}>
                <TouchableOpacity onPress={handleAddRole}>
                  <Feather name="check" size={16} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelAdd}>
                  <Feather name="x" size={16} color={colors.mutedText} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Primary Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
          <Feather name="save" size={16} color={colors.navyText} />
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  subHeader: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  badge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRoleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addRow: {
    backgroundColor: '#F1F5F9',
  },
  typePill: {
    backgroundColor: '#0F172A',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typePillCustom: {
    backgroundColor: '#475569',
  },
  typePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 13,
    backgroundColor: colors.bgCard,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
});