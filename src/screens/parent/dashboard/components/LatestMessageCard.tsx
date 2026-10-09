// src/screens/parent/dashboard/components/LatestMessageCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing, makeShadow } from '../../../../theme/colors';

const SKY = '#38BDF8';
const YELLOW = '#FCD34D';

interface LatestMessageCardProps {
  latestMessage: { from: string; preview: string; time?: string } | null;
  unreadCount: number;
  onOpenMessages: () => void;
  style?: ViewStyle;
}

export default function LatestMessageCard({
  latestMessage,
  unreadCount,
  onOpenMessages,
  style,
}: LatestMessageCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.latestMessageHeader}>
        <View style={styles.latestMessageMain}>
          <View style={styles.latestMessageLabelRow}>
            <Text style={styles.latestMessageLabel}>Latest Message</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
              </View>
            )}
          </View>
          <Text style={styles.latestMessageText}>
            {latestMessage ? (
              <>
                <Text style={styles.latestMessageSender}>{latestMessage.from}:</Text>{' '}
                {latestMessage.preview}
              </>
            ) : (
              'No messages yet'
            )}
          </Text>
        </View>
        <View style={styles.messageIconCircle}>
          <Feather name="message-circle" size={20} color={SKY} />
        </View>
      </View>
      <TouchableOpacity
        style={styles.openMessagesBtn}
        onPress={onOpenMessages}
        accessibilityRole="button"
        accessibilityLabel="Open Messages"
      >
        <Text style={styles.openMessagesBtnText}>Open Messages</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.xl,
    gap: spacing.md,
    ...makeShadow(1, 3, 0.05, '0, 0, 0', 1),
  },
  latestMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  latestMessageMain: {
    flex: 1,
    minWidth: 0,
  },
  latestMessageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  latestMessageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unreadPill: {
    backgroundColor: '#EF4444',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  latestMessageText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  latestMessageSender: {
    fontWeight: '600',
    color: SKY,
  },
  messageIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMessagesBtn: {
    backgroundColor: YELLOW,
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  openMessagesBtnText: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 13,
  },
});
