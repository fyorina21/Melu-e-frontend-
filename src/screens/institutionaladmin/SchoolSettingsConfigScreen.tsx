import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getSchoolSettings, saveSchoolSettings } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

interface SchoolSettings {
  schoolName: string;
  term: string;
  academicYear: string;
  sessionLengthMinutes: number;
  defaultStudentsPerSession: number;
  maxStudentsPerTherapist: number;
}

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'SchoolSettingsConfig'>;

export default function SchoolSettingsConfigScreen({ navigation }: Props) {
  const [form, setForm] = useState<SchoolSettings>(DEFAULT);

  const load = useCallback(async () => {
    try {
      const { data } = await getSchoolSettings();
      setForm(data);
    } catch (err) {
      setForm(DEFAULT);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key: keyof SchoolSettings, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await saveSchoolSettings(form as unknown as Record<string, unknown>);
    } catch (err) {}
    Alert.alert('Saved', 'School settings updated.');
  };

  const Field = ({ label, value, onChangeText, numeric }: { label: string; value: string; onChangeText: (t: string) => void; numeric?: boolean }) => (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <TextInput style={styles.textInput} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'number-pad' : 'default'} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Schools" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>School Settings</Text><Text style={typography.caption}>MR-6 — term, session length and capacity defaults</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Field label="School Name" value={form.schoolName} onChangeText={(t) => set('schoolName', t)} />
          <Field label="Current Term" value={form.term} onChangeText={(t) => set('term', t)} />
          <Field label="Academic Year" value={form.academicYear} onChangeText={(t) => set('academicYear', t)} />
          <Field label="Session Length (minutes)" value={`${form.sessionLengthMinutes}`} onChangeText={(t) => set('sessionLengthMinutes', parseInt(t) || 0)} numeric />
          <Field label="Default Students Per Session" value={`${form.defaultStudentsPerSession}`} onChangeText={(t) => set('defaultStudentsPerSession', parseInt(t) || 0)} numeric />
          <Field label="Max Students Per Therapist" value={`${form.maxStudentsPerTherapist}`} onChangeText={(t) => set('maxStudentsPerTherapist', parseInt(t) || 0)} numeric />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Feather name="save" size={16} color={colors.navyText} />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEFAULT: SchoolSettings = {
  schoolName: 'Melu\'e Learning Academy',
  term: 'Term 3',
  academicYear: '2026',
  sessionLengthMinutes: 45,
  defaultStudentsPerSession: 3,
  maxStudentsPerTherapist: 18,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp },
  saveBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
