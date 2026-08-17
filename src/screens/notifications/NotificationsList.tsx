

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

export interface AppNotification {
  id: string;
  type: 'announcement' | 'goal' | 'appointment' | 'alert';
  title: string;
  body: string;
  date: string;
  read: boolean;
}

const TYPE_META: Record<AppNotification['type'], { icon: React.ComponentProps<typeof Feather>['name']; color: string }> = {
  announcement: { icon: 'info', color: colors.statusInProgressText },
  goal: { icon: 'target', color: colors.statusCompletedText },
  appointment: { icon: 'calendar', color: colors.statusPendingText },
  alert: { icon: 'alert-circle', color: colors.statusRevisionText },
};

const FILTER_LABEL_TO_TYPE: Record<string, AppNotification['type'] | 'unread' | 'archived'> = {
  Unread: 'unread',
  Announcements: 'announcement',
  Goals: 'goal',
  Appointments: 'appointment',
  Alerts: 'alert',
  Archived: 'archived',
};

const FILTERS = ['All', 'Unread', 'Announcements', 'Goals', 'Appointments', 'Alerts', 'Archived'];

interface Props {
  title: string;
  subtitle: string;
  fetchData: () => Promise<AppNotification[]>;
  demoData: AppNotification[];
  markRead: (id: string) => Promise<unknown>;
}

export default function NotificationsList({ title, subtitle, fetchData, demoData, markRead }: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState('All');
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setItems(await fetchData());
    } catch (err) {
      setItems(demoData);
    }
  }, [fetchData, demoData]);

  useEffect(() => { load(); }, [load]);

  const handlePress = (item: AppNotification) => {
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      try { markRead(item.id); } catch (err) {}
    }
  };

  const handleArchive = (item: AppNotification) => {
    setArchivedIds((prev) => new Set(prev).add(item.id));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = items.filter((n) => {
    const isArchived = archivedIds.has(n.id);
    const f = FILTER_LABEL_TO_TYPE[filter];
    if (f === 'archived') return isArchived;
    if (isArchived) return false;
    if (f === 'unread') return !n.read;
    if (!f) return true;
    return n.type === f;
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="bell" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>{title}</Text>
            <Text style={typography.caption}>{subtitle}</Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount} unread</Text></View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((n) => {
          const meta = TYPE_META[n.type];
          return (
            <View key={n.id} style={[styles.row, n.read && styles.rowRead]}>
              <TouchableOpacity style={styles.rowMain} onPress={() => handlePress(n)}>
                <View style={[styles.iconWrap, { backgroundColor: meta.color + '1A' }]}>
                  <Feather name={meta.icon} size={16} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, n.read && { color: colors.bodyText }]}>{n.title}</Text>
                  <Text style={typography.caption}>{n.body}</Text>
                  <Text style={styles.date}>{n.date}</Text>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.archiveBtn} onPress={() => handleArchive(n)}>
                <Feather name="archive" size={15} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
          );
        })}
        {filtered.length === 0 && <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center', padding: spacing.xl }]}>No notifications{filter !== 'All' ? ` in "${filter}"` : ''}.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unreadPill: { backgroundColor: colors.statusRevisionBg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  unreadPillText: { fontSize: 12, fontWeight: '700', color: colors.statusRevisionText },
  filtersRow: { padding: spacing.md, paddingBottom: 0, backgroundColor: colors.bgCard },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, backgroundColor: colors.bgApp },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  filterChipText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowRead: { opacity: 0.6 },
  archiveBtn: { padding: spacing.md, borderLeftWidth: 1, borderLeftColor: colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 11, color: colors.mutedText, marginTop: spacing.xs },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.statusRevisionText },
});
