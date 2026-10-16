import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, shadows } from '../../../theme';
import { getItemScoreOptions, SCORE_COLOR, SCORE_LABEL, type Score } from '../abllsConfigHelper';
import { type SelectedItemState, getMaxCellsForItem, getFilledCells } from '../types';

export interface AbllsItemInspectorModalProps {
  selectedItem: SelectedItemState | null;
  onClose: () => void;
  onUpdateScore: (itemId: string, newScore: Score) => void;
}

export function AbllsItemInspectorModal({
  selectedItem,
  onClose,
  onUpdateScore,
}: AbllsItemInspectorModalProps) {
  if (!selectedItem) return null;

  const maxCells = getMaxCellsForItem(selectedItem);
  const filled = getFilledCells(selectedItem);

  return (
    <Modal visible={!!selectedItem} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.inspectorOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.inspectorContent} onStartShouldSetResponder={() => true}>
          <View style={styles.inspectorHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inspectorCode}>{selectedItem.id}</Text>
              <Text style={styles.inspectorDomain}>{selectedItem.domain}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={styles.inspectorBody}>
            <Text style={styles.inspectorDescLabel}>Skill Description</Text>
            <Text style={styles.inspectorDescText}>{selectedItem.description}</Text>

            <View style={styles.inspectorScoreRow}>
              <Text style={styles.inspectorScoreLabel}>Mastery Level:</Text>
              <View
                style={[
                  styles.inspectorScorePill,
                  {
                    backgroundColor:
                      selectedItem.score === 2
                        ? colors.statusCompletedBg
                        : selectedItem.score === 1
                          ? colors.warningLight
                          : selectedItem.score === 0
                            ? colors.errorLight
                            : '#F1F5F9',
                  },
                ]}
              >
                <Text
                  style={[styles.inspectorScoreText, { color: SCORE_COLOR[selectedItem.score] }]}
                >
                  {SCORE_LABEL[selectedItem.score]}
                </Text>
              </View>
            </View>

            {/* Interactive Score Selector */}
            <Text style={styles.inspectorScoreSelectorTitle}>Change Score / Mastery Level:</Text>
            <View style={styles.inspectorScoreBtnRow}>
              {getItemScoreOptions(selectedItem).map((opt) => {
                const sVal = opt.score;
                const isCur = selectedItem.score === sVal;
                const c = opt.color;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.inspectorQuickScoreBtn,
                      { borderColor: c },
                      isCur && { backgroundColor: c },
                    ]}
                    onPress={() => onUpdateScore(selectedItem.id, sVal)}
                  >
                    <Text
                      style={[styles.inspectorQuickScoreBtnText, { color: isCur ? '#FFFFFF' : c }]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Progress Tracker representation */}
            <View style={styles.inspectorCellsBox}>
              <Text style={styles.inspectorCellsLabel}>{`${maxCells}-Cell Progress Tracker:`}</Text>
              <View style={styles.inspectorCellsRow}>
                {Array.from({ length: maxCells }, (_, cIdx) => {
                  const isFilled = cIdx < filled;
                  const isNA = selectedItem.score === 'NA';
                  const scoreNum =
                    typeof selectedItem.score === 'number'
                      ? selectedItem.score
                      : parseInt(String(selectedItem.score), 10);
                  const cellColor =
                    selectedItem.score === 0
                      ? colors.error
                      : scoreNum >= 2
                        ? colors.success
                        : colors.warning;

                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.inspectorLargeCell,
                        {
                          backgroundColor: isFilled ? cellColor : isNA ? '#E2E8F0' : '#FFFFFF',
                          borderColor: '#475569',
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  inspectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  inspectorContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    maxWidth: 480,
    width: '100%',
    ...shadows.lg,
    overflow: 'hidden',
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inspectorCode: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.navyText,
  },
  inspectorDomain: {
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: '600',
    marginTop: 2,
  },
  inspectorBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  inspectorDescLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  inspectorDescText: {
    fontSize: 14,
    color: colors.navyText,
    lineHeight: 20,
  },
  inspectorScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inspectorScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  inspectorScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  inspectorScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  inspectorScoreSelectorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: 4,
  },
  inspectorScoreBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  inspectorQuickScoreBtn: {
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  inspectorQuickScoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inspectorCellsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  inspectorCellsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  inspectorCellsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  inspectorLargeCell: {
    flex: 1,
    height: 18,
    borderWidth: 1.5,
  },
});

export default AbllsItemInspectorModal;
