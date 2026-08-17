import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ParentNav, { PARENT_ROUTE_BY_TAB } from './components/ParentNav';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getParentDocuments, downloadDocument } from '../../api/parentApi';
import type { ParentStackParamList } from '../../types';

interface DocEntry {
  id: string;
  title: string;
  date: string;
  category: string;
}

const CATEGORIES = [
  { key: 'Progress Reports', icon: 'trending-up' as const },
  { key: 'Assessment Reports', icon: 'clipboard' as const },
  { key: 'Attendance Reports', icon: 'calendar' as const },
  { key: 'Therapy Notes', icon: 'file-text' as const },
  { key: 'Invoices', icon: 'dollar-sign' as const },
  { key: 'Consent Forms', icon: 'shield' as const },
];

const DATE_FILTERS = ['All', 'Last 30 days', 'Last 90 days', 'This year'];

const isWithin = (dateStr: string, filter: string) => {
  if (filter === 'All') return true;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return true;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (filter === 'Last 30 days') return now - d <= 30 * day;
  if (filter === 'Last 90 days') return now - d <= 90 * day;
  if (filter === 'This year') return new Date(dateStr).getFullYear() === new Date().getFullYear();
  return true;
};

type Props = NativeStackScreenProps<ParentStackParamList, 'ParentReports'>;

export default function ParentReportsScreen({ navigation }: Props) {
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [previewDoc, setPreviewDoc] = useState<DocEntry | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getParentDocuments();
      setDocs(data);
    } catch (err) {
      setDocs(DEMO_DOCS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = docs
    .filter(
      (d) =>
        (categoryFilter === 'All' || d.category === categoryFilter) &&
        isWithin(d.date, dateFilter) &&
        (!search ||
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.category.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredByCategory = (category: string) => filtered.filter((d) => d.category === category);

  const FilterChips = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} style={[styles.filterChip, value === opt && styles.filterChipActive]} onPress={() => onChange(opt)}>
          <Text style={[typography.body, value === opt && { color: colors.navyText, fontWeight: '700' }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const handleView = (doc: DocEntry) => {
    setPreviewDoc(doc);
  };

  const handleDownload = async (doc: DocEntry) => {
    try {
      await downloadDocument(doc.id);
    } catch (err) {}
    Alert.alert('Download requested', `"${doc.title}" will download once a file-service endpoint exists.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ParentNav activeTab="Reports" onTabPress={(t) => t !== 'Reports' && navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Reports & Documents</Text>
          <Text style={typography.caption}>MR-50 — reports and files shared with your family</Text>
        </View>
      </View>

      <View style={styles.filtersRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or category..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.chipRow}>
          <Text style={[typography.label, styles.filterLabel]}>Category</Text>
          <FilterChips options={['All', ...CATEGORIES.map((c) => c.key)]} value={categoryFilter} onChange={setCategoryFilter} />
        </View>
        <View style={styles.chipRow}>
          <Text style={[typography.label, styles.filterLabel]}>Date</Text>
          <FilterChips options={DATE_FILTERS} value={dateFilter} onChange={setDateFilter} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.caption}>{filtered.length} document(s) found</Text>
        {filtered.length === 0 && <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center', padding: spacing.xl }]}>No documents match these filters.</Text>}
        {CATEGORIES.map((cat) => {
          const items = filteredByCategory(cat.key);
          if (items.length === 0) return null;
          return (
            <View key={cat.key} style={styles.card}>
              <View style={styles.categoryHeader}>
                <Feather name={cat.icon} size={16} color={colors.primaryYellowDark} />
                <Text style={typography.h3}>{cat.key}</Text>
                <Text style={[typography.caption, { marginLeft: 'auto' }]}>{items.length} item(s)</Text>
              </View>
              {items.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <Feather name="file" size={16} color={colors.mutedText} />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{doc.title}</Text>
                    <Text style={typography.caption}>{doc.date}</Text>
                  </View>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleView(doc)}>
                    <Feather name="eye" size={14} color={colors.navyText} />
                    <Text style={styles.actionBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(doc)}>
                    <Feather name="download" size={14} color={colors.navyText} />
                    <Text style={styles.actionBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <ExportPreviewModal
        visible={!!previewDoc}
        title={previewDoc?.title ?? 'Document'}
        filename={`${(previewDoc?.title ?? 'Document').replace(/\s+/g, '_')}.txt`}
        content={
          previewDoc
            ? [
                previewDoc.title,
                `Category: ${previewDoc.category} · Date: ${previewDoc.date}`,
                '',
                'This is a client-side preview of the document record. The full document will render here once a backend serves the actual file URL.',
              ].join('\n')
            : ''
        }
        onClose={() => setPreviewDoc(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_DOCS: DocEntry[] = [
  { id: 'd1', title: 'Quarterly Progress Report — Q3', date: 'Aug 10, 2026', category: 'Progress Reports' },
  { id: 'd2', title: 'ABLLS Assessment Summary', date: 'Jul 28, 2026', category: 'Assessment Reports' },
  { id: 'd3', title: 'Monthly Attendance Report', date: 'Aug 1, 2026', category: 'Attendance Reports' },
  { id: 'd4', title: 'Session Notes — July', date: 'Jul 31, 2026', category: 'Therapy Notes' },
  { id: 'd5', title: 'Invoice — August', date: 'Aug 5, 2026', category: 'Invoices' },
  { id: 'd6', title: 'Consent — Photograph Release', date: 'Jun 12, 2026', category: 'Consent Forms' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  filtersRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  chipRow: { gap: spacing.xs },
  filterLabel: { paddingVertical: spacing.xs },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, backgroundColor: colors.bgApp },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
});
