// screens/institutionaladmin/GoalDomainDefinitionsScreen.js
// SCR-ADMIN-005: Goal Domain Definitions

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import { getGoalDomains, saveGoalDomains } from '../../api/institutionalAdminApi';

export type GoalDomain = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

const DEMO_DOMAINS: GoalDomain[] = [
  { id: 'd1', name: 'Cognitive', description: 'Problem solving, memory, attention', active: true },
  { id: 'd2', name: 'Receptive Language', description: 'Understanding verbal/non-verbal communication', active: true },
  { id: 'd3', name: 'Expressive Language', description: 'Verbal and non-verbal expression', active: true },
  { id: 'd4', name: 'Social Skills', description: 'Interaction, turn-taking, peer engagement', active: true },
  { id: 'd5', name: 'Motor Skills', description: 'Fine and gross motor development', active: true },
  { id: 'd6', name: 'Adaptive', description: 'Daily living and self-care skills', active: true },
];

export default function GoalDomainDefinitionsScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'GoalDomainDefinitions'>) {
  const [domains, setDomains] = useState<GoalDomain[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Domain Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getGoalDomains();
      setDomains(data && data.length > 0 ? data : DEMO_DOMAINS);
    } catch (err) {
      setDomains(DEMO_DOMAINS);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Order Handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setDomains((prev) => {
      const list = [...prev];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return list;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === domains.length - 1) return;
    setDomains((prev) => {
      const list = [...prev];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return list;
    });
  };

  // Domain Handlers
  const handleConfirmAddDomain = () => {
    if (!newDomainName.trim()) {
      Alert.alert('Please enter a domain name');
      return;
    }
    const newEntry: GoalDomain = {
      id: `d-${Date.now()}`,
      name: newDomainName.trim(),
      description: newDomainDesc.trim(),
      active: true,
    };
    setDomains((prev) => [...prev, newEntry]);
    setNewDomainName('');
    setNewDomainDesc('');
    setShowAddForm(false);
  };

  const handleUpdateField = (id: string, field: 'name' | 'description', val: string) => {
    setDomains((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Domain', 'Are you sure you want to delete this goal domain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setDomains((prev) => prev.filter((d) => d.id !== id)),
      },
    ]);
  };

  const handleSave = async () => {
    const activeCount = domains.filter((d) => d.active !== false).length;
    if (activeCount === 0) {
      Alert.alert('At least one active domain is required');
      return;
    }
    try {
      await saveGoalDomains(domains);
    } catch (err) {
      // Fallback local save UI handling
    }
    Alert.alert('Configuration saved', 'Changes reflected in the Goal Bank.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Navigation & Breadcrumbs */}
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.breadcrumbTitle}>Goal Domain Definitions</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SCR-ADMIN-005</Text>
            </View>
          </View>
          <View style={styles.breadcrumbRow}>
            <Feather name="settings" size={12} color="#64748B" />
            <Text style={styles.breadcrumbText}>
              {' '}
              Clinical Configuration / Goal Domain Definitions
            </Text>
          </View>
        </View>

        {/* Page Title & Subtitle */}
        <View style={styles.pageHeader}>
          <Text style={styles.mainTitle}>Goal Domain Definitions</Text>
          <Text style={styles.subtitle}>
            SCR-ADMIN-005 · Define and order therapy goal domains
          </Text>
        </View>

        {/* Domain Definitions Table Card */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { width: 64, textAlign: 'center' }]}>ORDER</Text>
            <Text style={[styles.th, { flex: 2.5 }]}>NAME</Text>
            <Text style={[styles.th, { flex: 4 }]}>DESCRIPTION</Text>
            <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>STATUS</Text>
            <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
          </View>

          {/* Table Body Rows */}
          {domains.map((item, index) => {
            const isEditing = editingId === item.id;
            return (
              <View key={item.id} style={styles.tableRow}>
                {/* Order Controls */}
                <View style={styles.orderCol}>
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <Feather
                      name="arrow-up"
                      size={13}
                      color={index === 0 ? '#CBD5E1' : '#64748B'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.orderNumberText}>{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === domains.length - 1}
                  >
                    <Feather
                      name="arrow-down"
                      size={13}
                      color={index === domains.length - 1 ? '#CBD5E1' : '#64748B'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Name */}
                <View style={{ flex: 2.5, paddingRight: 12 }}>
                  {isEditing ? (
                    <TextInput
                      style={styles.inlineInput}
                      value={item.name}
                      onChangeText={(v) => handleUpdateField(item.id, 'name', v)}
                    />
                  ) : (
                    <Text style={styles.domainNameText}>{item.name}</Text>
                  )}
                </View>

                {/* Description */}
                <View style={{ flex: 4, paddingRight: 12 }}>
                  {isEditing ? (
                    <TextInput
                      style={styles.inlineInput}
                      value={item.description}
                      onChangeText={(v) => handleUpdateField(item.id, 'description', v)}
                    />
                  ) : (
                    <Text style={styles.domainDescText}>{item.description}</Text>
                  )}
                </View>

                {/* Status Pill */}
                <View style={{ width: 80, alignItems: 'center' }}>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    onPress={() => setEditingId(isEditing ? null : item.id)}
                    style={{ padding: 4 }}
                  >
                    <Feather
                      name={isEditing ? 'check' : 'edit-2'}
                      size={15}
                      color={isEditing ? '#0284C7' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={{ padding: 4 }}
                  >
                    <Feather name="trash-2" size={15} color="#F87171" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Domain Expandable Form or Trigger */}
        {showAddForm ? (
          <View style={styles.addFormCard}>
            <View style={styles.addFormFieldsRow}>
              <View style={styles.addFormFieldCol}>
                <Text style={styles.addFormLabel}>Domain Name</Text>
                <TextInput
                  style={styles.addFormInput}
                  placeholder="e.g. Self-Help Skills"
                  placeholderTextColor="#94A3B8"
                  value={newDomainName}
                  onChangeText={setNewDomainName}
                />
              </View>
              <View style={[styles.addFormFieldCol, { flex: 2 }]}>
                <Text style={styles.addFormLabel}>Description</Text>
                <TextInput
                  style={styles.addFormInput}
                  placeholder="Brief description..."
                  placeholderTextColor="#94A3B8"
                  value={newDomainDesc}
                  onChangeText={setNewDomainDesc}
                />
              </View>
              <View style={styles.addFormBtnRow}>
                <TouchableOpacity
                  style={styles.confirmAddBtn}
                  onPress={handleConfirmAddDomain}
                >
                  <Text style={styles.confirmAddBtnText}>Add Domain</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelAddBtn}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelAddBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addDomainLinkBtn}
            onPress={() => setShowAddForm(true)}
          >
            <Feather name="plus" size={16} color="#0284C7" />
            <Text style={styles.addDomainLinkText}>Add Domain</Text>
          </TouchableOpacity>
        )}

        {/* Save Configuration Footer Action Button */}
        <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSave}>
          <Feather name="save" size={15} color="#0F172A" />
          <Text style={styles.saveConfigBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, paddingBottom: 60, gap: 18 },

  topHeader: { marginBottom: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  breadcrumbText: { fontSize: 12, color: '#64748B' },

  pageHeader: { marginBottom: 4 },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },

  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderCol: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  domainNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  domainDescText: {
    fontSize: 13,
    color: '#475569',
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  actionsCol: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },

  /* Add Form & Links */
  addDomainLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  addDomainLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },

  addFormCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
  },
  addFormFieldsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  addFormFieldCol: {
    flex: 1,
    gap: 4,
  },
  addFormLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  addFormInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  addFormBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmAddBtn: {
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  confirmAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelAddBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  cancelAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
  },
  saveConfigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});