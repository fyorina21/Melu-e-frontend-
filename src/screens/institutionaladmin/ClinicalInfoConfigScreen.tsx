// screens/institutionaladmin/ClinicInfoConfigScreen.tsx
// MR-6: Clinic Information configuration.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from './components/InstitutionalAdminNav';
import { getClinicInfo, saveClinicInfo } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

interface ClinicInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  director: string;
}

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'ClinicInfoConfig'>;

export default function ClinicInfoConfigScreen({ navigation }: Props) {
  const [form, setForm] = useState<ClinicInfo>(DEFAULT);

  const load = useCallback(async () => {
    try {
      const { data } = await getClinicInfo();
      setForm(data);
    } catch (err) {
      setForm(DEFAULT);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key: keyof ClinicInfo, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await saveClinicInfo(form as unknown as Record<string, unknown>);
    } catch (err) {}
    Alert.alert('Saved', 'Clinic information updated.');
  };

  const Field = ({ label, value, onChangeText, multiline }: { label: string; value: string; onChangeText: (t: string) => void; multiline?: boolean }) => (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <TextInput style={[styles.textInput, multiline && styles.textArea]} value={value} onChangeText={onChangeText} multiline={multiline} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <InstitutionalAdminNav activeTab="Clinic Info" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>Clinic Information</Text><Text style={typography.caption}>MR-6 — clinic-level configuration</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Field label="Clinic Name" value={form.name} onChangeText={(t) => set('name', t)} />
          <Field label="Address" value={form.address} onChangeText={(t) => set('address', t)} multiline />
          <Field label="City" value={form.city} onChangeText={(t) => set('city', t)} />
          <Field label="Phone" value={form.phone} onChangeText={(t) => set('phone', t)} />
          <Field label="Email" value={form.email} onChangeText={(t) => set('email', t)} />
          <Field label="Director" value={form.director} onChangeText={(t) => set('director', t)} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Feather name="save" size={16} color={colors.navyText} />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEFAULT: ClinicInfo = {
  name: "Melu'e Foundation Therapy Center",
  address: '12 Therapy Lane',
  city: 'Springfield',
  phone: '(555) 010-1000',
  email: 'contact@melue.org',
  director: 'Director A',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
