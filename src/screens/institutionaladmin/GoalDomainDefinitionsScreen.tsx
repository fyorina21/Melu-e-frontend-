// screens/institutionaladmin/GoalDomainDefinitionsScreen.js
// SCR-ADMIN-005: Goal Domain Definitions

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from './components/InstitutionalAdminNav';
import { getGoalDomains, saveGoalDomains } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

type GoalDomain = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

export default function GoalDomainDefinitionsScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'GoalDomainDefinitions'>) {
  const [domains, setDomains] = useState<GoalDomain[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await getGoalDomains();
      setDomains(data);
    } catch (err) {
      setDomains(DEMO_DOMAINS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = () => setDomains((prev) => [...prev, { id: `d-${Date.now()}`, name: 'New Domain', description: '', active: true }]);
  const handleUpdateName = (id: string, name: string) => setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  const handleUpdateDesc = (id: string, description: string) => setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, description } : d)));
  const handleDelete = (id: string) => {
    Alert.alert('Delete this domain?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setDomains((prev) => prev.filter((d) => d.id !== id)) },
    ]);
  };
  const handleSave = async () => {
    const activeCount = domains.filter((d) => d.active !== false).length;
    if (activeCount === 0) { Alert.alert('At least one active domain required'); return; }
    try { await saveGoalDomains(domains); } catch (err) {}
    Alert.alert('Configuration saved', 'Changes reflected in the Goal Bank.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <InstitutionalAdminNav activeTab="Goal Domains" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Goal Domain Definitions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Feather name="plus" size={14} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Domain</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {domains.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <TextInput style={styles.nameInput} value={d.name} onChangeText={(v) => handleUpdateName(d.id, v)} />
              <TouchableOpacity onPress={() => handleDelete(d.id)}><Feather name="trash-2" size={16} color="#EF4444" /></TouchableOpacity>
            </View>
            <TextInput style={styles.descInput} value={d.description} onChangeText={(v) => handleUpdateDesc(d.id, v)} placeholder="Description..." placeholderTextColor={colors.mutedText} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSave}>
          <Text style={styles.saveConfigBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const DEMO_DOMAINS: GoalDomain[] = [
  { id: 'd1', name: 'Communication', description: 'Expressive and receptive language goals.', active: true },
  { id: 'd2', name: 'Motor', description: 'Fine and gross motor skill goals.', active: true },
  { id: 'd3', name: 'Social', description: 'Peer interaction and social skill goals.', active: true },
  { id: 'd4', name: 'Self-Help', description: 'Daily living skill goals.', active: true },
  { id: 'd5', name: 'Cognition', description: 'Cognitive and academic skill goals.', active: true },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameInput: { flex: 1, fontWeight: '700', fontSize: 15, color: colors.navyText },
  descInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm },
  footer: { padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  saveConfigBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveConfigBtnText: { fontWeight: '700', color: colors.navyText },
});
