import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill from '../../components/StatusPill';
import ParentNav, { PARENT_ROUTE_BY_TAB } from './components/ParentNav';
import { getObservations, createObservation, getRequestedLogs } from '../../api/parentApi';
import type { ParentStackParamList } from '../../types';

interface RequestedLog {
  id: string;
  requestNote: string;
  suggestedBehavior: string;
  suggestedContext: string;
}

interface Observation {
  id: string;
  date: string;
  behavior: string;
  context: string;
  acknowledged: string;
  teamResponse: string | null;
}

type ObservationPayload = {
  behavior: string;
  context: string;
  notes: string;
};

function ObservationFormModal({ visible, prefill, onClose, onSave }: {
  visible: boolean;
  prefill: RequestedLog | null | undefined;
  onClose: () => void;
  onSave: (payload: ObservationPayload) => void;
}) {
  const [behavior, setBehavior] = useState('');
  const [context, setContext] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (prefill) { setBehavior(prefill.suggestedBehavior || ''); setContext(prefill.suggestedContext || ''); setNotes(''); }
    else { setBehavior(''); setContext(''); setNotes(''); }
  }, [prefill, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h3}>{prefill ? 'Requested Observation' : 'Add Observation'}</Text>
          <View style={styles.field}><Text style={typography.label}>What did you observe?</Text><TextInput style={styles.textInput} value={behavior} onChangeText={setBehavior} /></View>
          <View style={styles.field}><Text style={typography.label}>When / Where</Text><TextInput style={styles.textInput} value={context} onChangeText={setContext} /></View>
          <View style={styles.field}><Text style={typography.label}>Additional Notes</Text><TextInput style={[styles.textInput, styles.textArea]} multiline value={notes} onChangeText={setNotes} /></View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => { if (!behavior.trim()) { Alert.alert('Please describe what you observed'); return; } onSave({ behavior, context, notes }); }}
            >
              <Text style={styles.saveBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeObservationLogScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'HomeObservationLog'>) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [requestedLogs, setRequestedLogs] = useState<RequestedLog[]>([]);
  const [formTarget, setFormTarget] = useState<RequestedLog | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const { data } = await getObservations({});
      setObservations(data);
    } catch (err) {
      setObservations(DEMO_OBSERVATIONS);
    }
    try {
      const { data } = await getRequestedLogs();
      setRequestedLogs(data);
    } catch (err) {
      setRequestedLogs(DEMO_REQUESTED);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload: ObservationPayload) => {
    const newEntry: Observation = { id: `local-${Date.now()}`, date: 'Just now', ...payload, acknowledged: 'pending', teamResponse: null };
    setObservations((prev) => [newEntry, ...prev]);
    try { await createObservation(payload); } catch (err) {}
    setFormTarget(undefined);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ParentNav activeTab="Observations" onTabPress={(t) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Home Observation Log</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormTarget(null)}>
          <Feather name="plus" size={14} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Observation</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {requestedLogs.length > 0 && (
          <View style={styles.card}>
            <Text style={typography.h3}>Requested by the Team</Text>
            {requestedLogs.map((r) => (
              <View key={r.id} style={styles.requestRow}>
                <Text style={typography.body}>{r.requestNote}</Text>
                <TouchableOpacity style={styles.fillInBtn} onPress={() => setFormTarget(r)}>
                  <Text style={styles.fillInBtnText}>Fill In</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={typography.h3}>Observation History</Text>
          {observations.map((o) => (
            <View key={o.id} style={styles.obsRow}>
              <View style={styles.obsHeaderRow}>
                <Text style={typography.bodyBold}>{o.date}</Text>
                <StatusPill
                  status={o.acknowledged === 'acknowledged' ? 'approved' : o.acknowledged === 'pending' ? 'pending' : 'notStarted'}
                  label={o.acknowledged === 'acknowledged' ? 'Acknowledged' : 'Pending Review'}
                />
              </View>
              <Text style={typography.body}>{o.behavior}</Text>
              <Text style={typography.caption}>{o.context}</Text>
              {o.teamResponse && (
                <View style={styles.teamResponseBox}>
                  <Text style={typography.caption}>Team response: {o.teamResponse}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <ObservationFormModal visible={formTarget !== undefined} prefill={formTarget} onClose={() => setFormTarget(undefined)} onSave={handleSave} />
    </SafeAreaView>
  );
}

const DEMO_OBSERVATIONS: Observation[] = [
  { id: '1', date: 'Aug 10, 2026', behavior: 'Requested juice independently at dinner', context: 'Home, dinner time', acknowledged: 'acknowledged', teamResponse: 'Wonderful, matches what we\u2019re seeing in session!' },
];
const DEMO_REQUESTED: RequestedLog[] = [
  { id: 'r1', requestNote: 'Please log any instances of tooth brushing independence this week.', suggestedBehavior: 'Tooth brushing', suggestedContext: 'Home, bedtime routine' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  fillInBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  fillInBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  obsRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  obsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamResponseBox: { backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
