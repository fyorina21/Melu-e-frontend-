import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { type LevelItem, COLOR_SWATCHES } from '../types';

interface PromptLevelsTableProps {
  levels: LevelItem[];
  loading: boolean;
  actionLoadingId: string | null;
  editingId: string | null;
  editBuf: { name: string; color: string; order: number };
  onEditBufChange: React.Dispatch<
    React.SetStateAction<{ name: string; color: string; order: number }>
  >;
  addingLevel: boolean;
  newLevel: { name: string; color: string; order: number };
  onNewLevelChange: React.Dispatch<
    React.SetStateAction<{ name: string; color: string; order: number }>
  >;
  submitting: boolean;
  deleteConfirmId: string | null;
  onStartEdit: (level: LevelItem) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onSaveAdd: () => void;
  onConfirmDelete: (id: string) => void;
  onStartDelete: (id: string) => void;
  onCancelDelete: () => void;
}

export const PromptLevelsTable: React.FC<PromptLevelsTableProps> = React.memo(
  ({
    levels,
    loading,
    actionLoadingId,
    editingId,
    editBuf,
    onEditBufChange,
    addingLevel,
    newLevel,
    onNewLevelChange,
    submitting,
    deleteConfirmId,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onStartAdd,
    onCancelAdd,
    onSaveAdd,
    onConfirmDelete,
    onStartDelete,
    onCancelDelete,
  }) => {
    const renderSwatches = (selected: string, onSelect: (c: string) => void) => (
      <View style={styles.swatchRow}>
        {COLOR_SWATCHES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onSelect(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              selected === c ? styles.swatchSelected : styles.swatchUnselected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select color ${c}`}
          />
        ))}
      </View>
    );

    const renderEditActions = (lv: LevelItem) => {
      const id = lv.id;
      if (actionLoadingId === id) {
        return (
          <View style={styles.actionRow}>
            <ActivityIndicator size="small" color="#0284C7" />
          </View>
        );
      }
      if (deleteConfirmId === id) {
        return (
          <View style={styles.deleteConfirmRow}>
            <Text style={styles.deleteConfirmText}>Delete?</Text>
            <TouchableOpacity
              onPress={() => onConfirmDelete(id)}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel="Confirm delete prompt level"
            >
              <Feather name="check" size={14} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancelDelete}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel delete prompt level"
            >
              <Feather name="x" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => onStartEdit(lv)}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Edit prompt level ${lv.name}`}
          >
            <Feather name="edit-3" size={14} color={colors.navyText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onStartDelete(id)}
            style={[styles.actionBtn, styles.deleteBtn]}
            accessibilityRole="button"
            accessibilityLabel={`Delete prompt level ${lv.name}`}
          >
            <Feather name="trash-2" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          <View style={styles.tableHeaderTitleGroup}>
            <Text style={styles.tableHeaderText}>Prompt Levels</Text>
            {loading && <ActivityIndicator size="small" color="#0284C7" />}
          </View>
          <TouchableOpacity
            onPress={onStartAdd}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Add prompt level"
          >
            <Feather name="plus" size={14} color="#0284C7" />
            <Text style={styles.addBtnText}>Add Prompt Level</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.tableColHeader, { flex: 1 }]}>NAME</Text>
          <Text style={[styles.tableColHeader, { flex: 1 }]}>COLOR</Text>
          <Text style={[styles.tableColHeader, { flex: 1 }]}>ORDER</Text>
          <Text style={[styles.tableColHeader, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.tableColHeader, { flex: 1 }]}>ACTIONS</Text>
        </View>

        {levels.map((lv) => (
          <View key={lv.id} style={styles.tableRow}>
            {editingId === lv.id ? (
              <>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <TextInput
                    value={editBuf.name}
                    onChangeText={(e) => onEditBufChange((b) => ({ ...b, name: e }))}
                    style={styles.inlineInput}
                  />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  {renderSwatches(editBuf.color, (c) =>
                    onEditBufChange((b) => ({ ...b, color: c })),
                  )}
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <TextInput
                    value={String(editBuf.order)}
                    onChangeText={(e) => onEditBufChange((b) => ({ ...b, order: Number(e) || 0 }))}
                    style={[styles.inlineInput, { width: 60 }]}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={[styles.badge, styles.badgeActive]}>
                    <Text style={styles.badgeText}>Active</Text>
                  </View>
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {actionLoadingId === lv.id ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => onSaveEdit(lv.id)}
                        style={styles.actionBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Save prompt level changes"
                      >
                        <Feather name="check" size={14} color={colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={onCancelEdit}
                        style={[styles.actionBtn, { backgroundColor: colors.mutedText }]}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel editing prompt level"
                      >
                        <Feather name="x" size={14} color={colors.white} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.cellText}>{lv.name}</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={[styles.colorDot, { backgroundColor: lv.color }]} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.cellText}>{lv.order}</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={[styles.badge, styles.badgeActive]}>
                    <Text style={styles.badgeText}>Active</Text>
                  </View>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>{renderEditActions(lv)}</View>
              </>
            )}
          </View>
        ))}

        {addingLevel && (
          <View style={[styles.tableRow, styles.addingRow]}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TextInput
                value={newLevel.name}
                onChangeText={(e) => onNewLevelChange((n) => ({ ...n, name: e }))}
                placeholder="Name"
                style={styles.inlineInput}
              />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              {renderSwatches(newLevel.color, (c) => onNewLevelChange((n) => ({ ...n, color: c })))}
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TextInput
                value={String(newLevel.order)}
                onChangeText={(e) => onNewLevelChange((n) => ({ ...n, order: Number(e) || 0 }))}
                style={[styles.inlineInput, { width: 60 }]}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={[styles.badge, styles.badgeActive]}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#22C55E" />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={onSaveAdd}
                    style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
                    accessibilityRole="button"
                    accessibilityLabel="Save new prompt level"
                  >
                    <Feather name="check" size={14} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onCancelAdd}
                    style={[styles.actionBtn, { backgroundColor: colors.mutedText }]}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel adding prompt level"
                  >
                    <Feather name="x" size={14} color={colors.white} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableContainer: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  tableHeaderText: { fontSize: 14, fontWeight: '600', color: '#1A2233' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#0284C7', fontSize: 13, fontWeight: '600' },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 8,
  },
  addingRow: { backgroundColor: 'rgba(34,197,94,0.06)' },
  cellText: { fontSize: 14, fontWeight: '600', color: '#1A2233', textAlign: 'center' },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  swatchRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  swatchSelected: { borderColor: '#1A2233', transform: [{ scale: 1.1 }] },
  swatchUnselected: { borderColor: 'transparent' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'center' },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  actionRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  deleteBtn: { backgroundColor: '#EF4444' },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  deleteConfirmText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'center',
  },
});
