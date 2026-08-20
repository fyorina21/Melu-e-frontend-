import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { parentApi } from '../../api';
import type { ParentStackParamList } from '../../types';

type Category = 'Behavior' | 'Achievement' | 'Concern' | 'General';
type AckStatus = 'Acknowledged' | 'Pending' | 'Needs Response';

interface Observation {
  id: string;
  date: string;
  time: string;
  category: Category;
  text: string;
  status: AckStatus;
  teamResponse?: string;
  therapistName?: string;
  location?: string;
  duration?: string;
}

interface ObsPayload {
  category: Category;
  date: string;
  time: string;
  text: string;
  location: string;
  duration: string;
}

const CATEGORY_STYLE: Record<Category, { bg: string; text: string; border: string }> = {
  Achievement: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  Behavior: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  Concern: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  General: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
};

const STATUS_CONFIG: Record<AckStatus, { label: string; bg: string; text: string; border: string; icon: keyof typeof Feather.glyphMap }> = {
  Acknowledged: { label: 'Acknowledged', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', icon: 'check-circle' },
  Pending: { label: 'Pending', bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: 'clock' },
  'Needs Response': { label: 'Needs Response', bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: 'alert-circle' },
};

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTime() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(isoTime: string) {
  if (!isoTime) return '';
  const [h, m] = isoTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDisplayDate(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

function toObservation(raw: any): Observation {
  if ((raw as any)?.category) {
    return {
      id: String(raw.id),
      date: String(raw.date ?? todayISO()),
      time: String(raw.time ?? ''),
      category: (['Behavior', 'Achievement', 'Concern', 'General'].includes(raw.category) ? raw.category : 'General') as Category,
      text: String(raw.text ?? raw.behavior ?? ''),
      status: (['Acknowledged', 'Pending', 'Needs Response'].includes(raw.status)
        ? raw.status
        : raw.acknowledged === 'acknowledged'
          ? 'Acknowledged'
          : raw.acknowledged === 'pending'
            ? 'Pending'
            : 'Needs Response') as AckStatus,
      teamResponse: raw.teamResponse ?? undefined,
      therapistName: raw.therapistName ?? undefined,
      location: raw.location ?? undefined,
      duration: raw.duration ?? undefined,
    };
  }
  return {
    id: String(raw.id),
    date: String(raw.date ?? todayISO()),
    time: String(raw.time ?? ''),
    category: 'General',
    text: String(raw.behavior ?? ''),
    status: (raw.acknowledged === 'acknowledged' ? 'Acknowledged' : raw.acknowledged === 'pending' ? 'Pending' : 'Needs Response') as AckStatus,
    teamResponse: raw.teamResponse ?? undefined,
  };
}

function AddObservationModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: ObsPayload) => void;
}) {
  const [form, setForm] = useState<ObsPayload>({ category: 'General', date: todayISO(), time: nowTime(), text: '', location: 'Home', duration: '' });

  useEffect(() => {
    if (visible) setForm({ category: 'General', date: todayISO(), time: nowTime(), text: '', location: 'Home', duration: '' });
  }, [visible]);

  const set = (patch: Partial<ObsPayload>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={typography.h2}>Add Observation</Text>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: '70%' }} contentContainerStyle={styles.sheetBody}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryChips}>
                {(['Behavior', 'Achievement', 'Concern', 'General'] as Category[]).map((c) => {
                  const cs = CATEGORY_STYLE[c];
                  const selected = form.category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => set({ category: c })}
                      style={[styles.chip, { borderColor: selected ? cs.text : colors.border, backgroundColor: selected ? cs.bg : colors.bgCard }]}
                    >
                      <Text style={[styles.chipText, { color: selected ? cs.text : colors.bodyText }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.fieldFlex}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput style={styles.input} value={form.date} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedText} onChangeText={(v) => set({ date: v })} />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={styles.fieldLabel}>Time</Text>
                <TextInput style={styles.input} value={form.time} placeholder="HH:MM" placeholderTextColor={colors.mutedText} onChangeText={(v) => set({ time: v })} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Observation <Text style={{ color: '#F87171' }}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
                placeholder="Describe what you observed..."
                placeholderTextColor={colors.mutedText}
                value={form.text}
                onChangeText={(v) => set({ text: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.categoryChips}>
                {['Home', 'School', 'Community', 'Other'].map((loc) => {
                  const selected = form.location === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => set({ location: loc })}
                      style={[styles.chip, { borderColor: selected ? colors.statusInProgressText : colors.border, backgroundColor: selected ? colors.statusInProgressBg : colors.bgCard }]}
                    >
                      <Text style={[styles.chipText, { color: selected ? colors.statusInProgressText : colors.bodyText }]}>{loc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Duration <Text style={{ fontWeight: '400', color: colors.mutedText }}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10 minutes"
                placeholderTextColor={colors.mutedText}
                value={form.duration}
                onChangeText={(v) => set({ duration: v })}
              />
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { opacity: form.text.trim() ? 1 : 0.4 }]}
              disabled={!form.text.trim()}
              onPress={() => onSave(form)}
            >
              <Text style={styles.saveBtnText}>Submit Observation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StrategyModal({ visible, onClose, onSend }: { visible: boolean; onClose: () => void; onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={typography.h2}>Request a Home Strategy</Text>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <Text style={styles.strategyHint}>Describe what you'd like help with and the team will send you a strategy.</Text>
            <TextInput
              style={[styles.input, styles.strategyArea]}
              multiline
              textAlignVertical="top"
              placeholder="Describe the situation or behavior you need support with..."
              placeholderTextColor={colors.mutedText}
              value={text}
              onChangeText={setText}
            />
          </View>
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.blueBtn, { opacity: text.trim() ? 1 : 0.4 }]}
              disabled={!text.trim()}
              onPress={() => { onSend(text); setText(''); }}
            >
              <Text style={styles.blueBtnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeObservationLogScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'HomeObservationLog'>) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await parentApi.observations({});
      setObservations(Array.isArray(rows) ? rows.map(toObservation) : []);
    } catch (err) {
      setObservations(DEMO_OBSERVATIONS.map(toObservation));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmitObservation = async (payload: ObsPayload) => {
    setShowAddModal(false);
    try {
      await parentApi.createObservation({
        behavior: payload.text,
        context: `${payload.location}${payload.duration ? ` · ${payload.duration}` : ''}`,
        notes: `Category: ${payload.category}`,
      });
      await load();
    } catch (err) {
      const newObs: Observation = {
        id: `local-${Date.now()}`,
        date: payload.date,
        time: payload.time,
        category: payload.category,
        text: payload.text,
        status: 'Pending',
        location: payload.location,
        duration: payload.duration,
      };
      setObservations((prev) => [newObs, ...prev]);
    }
    Alert.alert('Observation submitted!');
  };

  const handleSubmitStrategy = () => {
    setShowStrategyModal(false);
    Alert.alert('Strategy request sent to the team!');
  };

  const handleScheduleMeeting = () => {
    Alert.alert('Meeting request sent!');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Observations" onTabPress={(t) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Home Observations</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Feather name="plus" size={16} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Observation</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Recording what you see at home helps the therapy team understand Student A better. Share behaviors, achievements, or concerns.
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Observation History</Text>
          <View style={styles.list}>
            {observations.map((obs) => {
              const isExpanded = expandedIds.has(obs.id);
              const sc = STATUS_CONFIG[obs.status];
              const cc = CATEGORY_STYLE[obs.category];
              return (
                <View key={obs.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardMeta}>{formatDisplayDate(obs.date)}{obs.time ? ` · ${formatTime(obs.time)}` : ''}</Text>
                    <View style={[styles.badge, styles.categoryBadge, { backgroundColor: cc.bg, borderColor: cc.border }]}>
                      <Text style={[styles.badgeText, { color: cc.text }]}>{obs.category}</Text>
                    </View>
                    <View style={[styles.badge, styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border, marginLeft: 'auto' }]}>
                      <Feather name={sc.icon} size={12} color={sc.text} />
                      <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardText}>{obs.text}</Text>

                  {obs.status === 'Acknowledged' && obs.teamResponse && (
                    <View style={styles.responseBox}>
                      <View style={styles.responseHeader}>
                        <Feather name="message-square" size={13} color="#0EA5E9" />
                        <Text style={styles.responseLabel}>Team Response</Text>
                      </View>
                      <Text style={styles.responseText}>{obs.teamResponse}</Text>
                      {obs.therapistName && <Text style={styles.responseAuthor}>— {obs.therapistName}</Text>}
                    </View>
                  )}

                  <TouchableOpacity style={styles.expandBtn} onPress={() => toggleExpand(obs.id)}>
                    <Text style={styles.expandBtnText}>{isExpanded ? 'Hide Details' : 'View Details'}</Text>
                    <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={13} color="#0284C7" />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.detailBox}>
                      <Text style={styles.detailRow}><Text style={styles.detailLabel}>Category: </Text>{obs.category}</Text>
                      <Text style={styles.detailRow}><Text style={styles.detailLabel}>Date: </Text>{formatDisplayDate(obs.date)}</Text>
                      <Text style={styles.detailRow}><Text style={styles.detailLabel}>Time: </Text>{obs.time ? formatTime(obs.time) : '—'}</Text>
                      {obs.location ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Location: </Text>{obs.location}</Text> : null}
                      {obs.duration ? <Text style={styles.detailRow}><Text style={styles.detailLabel}>Duration: </Text>{obs.duration}</Text> : null}
                      <Text style={styles.detailRow}><Text style={styles.detailLabel}>Status: </Text>{obs.status}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need support from the team?</Text>
          <Text style={styles.supportSubtitle}>Reach out to your therapy team for strategies or to schedule a meeting.</Text>
          <View style={styles.supportRow}>
            <TouchableOpacity style={styles.strategyBtn} onPress={() => setShowStrategyModal(true)}>
              <Text style={styles.strategyBtnText}>Request a home strategy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.meetingBtn} onPress={handleScheduleMeeting}>
              <Text style={styles.meetingBtnText}>Schedule a meeting</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AddObservationModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSubmitObservation} />
      <StrategyModal visible={showStrategyModal} onClose={() => setShowStrategyModal(false)} onSend={handleSubmitStrategy} />
    </SafeAreaView>
  );
}

const DEMO_OBSERVATIONS: any[] = [
  {
    id: '1',
    date: '2026-08-15',
    time: '08:30',
    category: 'Achievement',
    text: "Student A said 'more juice' without prompting at breakfast! First spontaneous request at home.",
    status: 'Acknowledged',
    teamResponse: "That's wonderful! This aligns perfectly with the verbal requesting goal we've been working on.",
    therapistName: 'Teacher A',
    location: 'Home',
    duration: '—',
  },
  {
    id: '2',
    date: '2026-08-13',
    time: '16:15',
    category: 'Behavior',
    text: 'Had a 10-minute tantrum when iPad time ended. Screaming and crying.',
    status: 'Acknowledged',
    teamResponse: "Thank you for sharing. We'll review the transition strategies and send you a tip sheet.",
    therapistName: 'Teacher A',
    location: 'Home',
    duration: '10 minutes',
  },
  {
    id: '3',
    date: '2026-08-11',
    time: '07:00',
    category: 'Concern',
    text: 'Not sleeping well — waking multiple times. Seems more irritable at therapy time.',
    status: 'Needs Response',
    location: 'Home',
  },
  {
    id: '4',
    date: '2026-08-04',
    time: '15:00',
    category: 'General',
    text: 'Practiced counting to 5 with blocks. Managed to count to 4 independently!',
    status: 'Acknowledged',
    teamResponse: 'Great practice at home! Counting skills are improving steadily — keep it up.',
    therapistName: 'Teacher A',
    location: 'Home',
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: '#FCD34D', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 13 },
  content: { padding: spacing.lg, gap: spacing.lg },
  banner: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: radius.lg, padding: spacing.lg },
  bannerText: { fontSize: 13, lineHeight: 20, color: '#075985' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: spacing.md },
  list: { gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.lg },
  cardTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardMeta: { fontSize: 12, color: colors.mutedText, fontWeight: '500' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3, borderWidth: 1 },
  categoryBadge: {},
  statusBadge: {},
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardText: { fontSize: 14, lineHeight: 20, color: '#374151' },
  responseBox: { marginTop: spacing.md, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#E0F2FE', borderRadius: radius.md, padding: spacing.md },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  responseLabel: { fontSize: 11, fontWeight: '600', color: '#0369A1' },
  responseText: { fontSize: 13, lineHeight: 19, color: '#0C4A6E' },
  responseAuthor: { fontSize: 11, color: '#0284C7', marginTop: 5, fontWeight: '500' },
  expandBtn: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandBtnText: { fontSize: 12, fontWeight: '500', color: '#0284C7' },
  detailBox: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 3 },
  detailRow: { fontSize: 11, color: colors.mutedText },
  detailLabel: { fontWeight: '600', color: '#4B5563' },
  supportCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.lg },
  supportTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText, marginBottom: 2 },
  supportSubtitle: { fontSize: 13, color: colors.mutedText, marginBottom: spacing.md },
  supportRow: { flexDirection: 'row', gap: spacing.sm },
  strategyBtn: { flex: 1, borderWidth: 2, borderColor: '#38BDF8', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  strategyBtnText: { fontSize: 13, fontWeight: '600', color: '#0284C7' },
  meetingBtn: { flex: 1, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  meetingBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeIconBtn: { padding: 6 },
  sheetBody: { paddingVertical: spacing.lg, gap: spacing.lg },
  strategyHint: { fontSize: 13, color: colors.mutedText, marginBottom: spacing.md },
  field: { gap: spacing.sm },
  fieldFlex: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  row: { flexDirection: 'row', gap: spacing.md },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  chipText: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14, color: colors.navyText, backgroundColor: colors.bgCard },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  strategyArea: { minHeight: 120 },
  sheetFooter: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  saveBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCD34D', borderRadius: radius.md, paddingVertical: spacing.md },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  blueBtn: { flex: 1, backgroundColor: '#38BDF8', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  blueBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
});