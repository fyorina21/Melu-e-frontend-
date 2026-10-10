import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { typography } from '../../../theme/typography';
import { Button } from '../../../shared/components';
import { type AbcItem, type ListTab, CATEGORY_OPTIONS } from '../abcTypes';

export interface AbcTableProps {
  tab: ListTab;
  items: AbcItem[];
  onUpdate: (items: AbcItem[]) => void;
  onDeleteItem: (id: string) => void;
  onStatusToggle: (id: string) => void;
}

export function AbcTable({ tab, items, onUpdate, onDeleteItem, onStatusToggle }: AbcTableProps) {
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newCategory, setNewCategory] = useState('Physical');
  const [newType, setNewType] = useState('');
  const [newCategoryDropdownOpen, setNewCategoryDropdownOpen] = useState(false);

  const startEdit = (item: AbcItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDefinition(item.definition || '');
    setEditCategory(item.category || 'Physical');
    setEditType(item.type || '');
    setEditStatus(item.status);
    setCategoryDropdownOpen(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCategoryDropdownOpen(false);
  };

  const commitEdit = () => {
    if (!editName.trim() || !editingId) return;
    const updated = items.map((i) =>
      i.id === editingId
        ? {
            ...i,
            name: editName.trim(),
            status: editStatus,
            ...(tab === 'Behaviors'
              ? { definition: editDefinition.trim(), category: editCategory }
              : {}),
            ...(tab === 'Antecedents' || tab === 'Consequences' ? { type: editType.trim() } : {}),
          }
        : i,
    );
    onUpdate(updated);
    setEditingId(null);
    setCategoryDropdownOpen(false);
  };

  const handleSaveAdd = () => {
    if (!newName.trim()) return;
    const newItem: AbcItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      status: 'Active',
      ...(tab === 'Behaviors' ? { definition: newDefinition.trim(), category: newCategory } : {}),
      ...(tab === 'Antecedents' || tab === 'Consequences'
        ? { type: newType.trim() || 'General' }
        : {}),
    };
    onUpdate([...items, newItem]);
    setIsAdding(false);
    setNewName('');
    setNewDefinition('');
    setNewCategory('Physical');
    setNewType('');
    setNewCategoryDropdownOpen(false);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewName('');
    setNewDefinition('');
    setNewCategory('Physical');
    setNewType('');
    setNewCategoryDropdownOpen(false);
  };

  const isBehaviors = tab === 'Behaviors';
  const hasType = tab === 'Antecedents' || tab === 'Consequences';

  return (
    <View style={styles.table}>
      {/* Header Row */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, { flex: isBehaviors ? 3 : 4 }]}>
          {isBehaviors
            ? 'BEHAVIOR NAME'
            : tab === 'Locations'
              ? 'LOCATION NAME'
              : `${tab.toUpperCase()} NAME`}
        </Text>
        {isBehaviors && <Text style={[styles.th, { flex: 4 }]}>DEFINITION</Text>}
        {isBehaviors && <Text style={[styles.th, { flex: 2 }]}>CATEGORY</Text>}
        {hasType && <Text style={[styles.th, { flex: 3 }]}>TYPE</Text>}
        <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
        <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
      </View>

      {/* Rows */}
      {items.map((item) => {
        const isEditing = editingId === item.id;

        if (isEditing) {
          return (
            <View key={item.id} style={[styles.tableRow, styles.editingRow]}>
              <View style={{ flex: isBehaviors ? 3 : 4, paddingRight: spacing.sm }}>
                <TextInput
                  style={styles.tableInput}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  placeholder="Name"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              {isBehaviors && (
                <View style={{ flex: 4, paddingRight: spacing.sm }}>
                  <TextInput
                    style={styles.tableInput}
                    value={editDefinition}
                    onChangeText={setEditDefinition}
                    placeholder="Definition"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>
              )}

              {isBehaviors && (
                <View style={{ flex: 2, paddingRight: spacing.sm, position: 'relative' }}>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  >
                    <Text style={styles.dropdownText}>{editCategory || 'Physical'}</Text>
                    <Feather name="chevron-down" size={14} color={colors.navyText} />
                  </TouchableOpacity>
                  {categoryDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.dropdownItem,
                            editCategory === cat && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setEditCategory(cat);
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {hasType && (
                <View style={{ flex: 3, paddingRight: spacing.sm }}>
                  <TextInput
                    style={styles.tableInput}
                    value={editType}
                    onChangeText={setEditType}
                    placeholder="Type"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>
              )}

              <View style={{ flex: 2 }}>
                <TouchableOpacity
                  style={
                    editStatus === 'Active' ? styles.statusActiveBadge : styles.statusInactiveBadge
                  }
                  onPress={() =>
                    setEditStatus((prev) => (prev === 'Active' ? 'Inactive' : 'Active'))
                  }
                >
                  <Text
                    style={
                      editStatus === 'Active' ? styles.statusActiveText : styles.statusInactiveText
                    }
                  >
                    {editStatus}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionsCol}>
                <TouchableOpacity onPress={commitEdit} style={styles.actionIconBtn}>
                  <Feather name="check" size={16} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEdit} style={styles.actionIconBtn}>
                  <Feather name="x" size={16} color={colors.mutedText} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        return (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.cellTextBold, { flex: isBehaviors ? 3 : 4 }]}>{item.name}</Text>
            {isBehaviors && (
              <Text style={[styles.cellText, { flex: 4 }]}>{item.definition || '—'}</Text>
            )}
            {isBehaviors && (
              <Text style={[styles.cellText, { flex: 2 }]}>{item.category || '—'}</Text>
            )}
            {hasType && <Text style={[styles.cellText, { flex: 3 }]}>{item.type || '—'}</Text>}

            <View style={{ flex: 2 }}>
              <TouchableOpacity
                style={
                  item.status === 'Active' ? styles.statusActiveBadge : styles.statusInactiveBadge
                }
                onPress={() => onStatusToggle(item.id)}
              >
                <Text
                  style={
                    item.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText
                  }
                >
                  {item.status}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsCol}>
              <TouchableOpacity
                onPress={() => startEdit(item)}
                style={styles.actionIconBtn}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Feather name="edit-2" size={15} color={colors.bodyText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDeleteItem(item.id)}
                style={styles.actionIconBtn}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Feather name="trash-2" size={15} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Inline Add Row */}
      {isAdding && (
        <View style={[styles.tableRow, styles.addingRow]}>
          <View style={{ flex: isBehaviors ? 3 : 4, paddingRight: spacing.sm }}>
            <TextInput
              style={styles.tableInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Name *"
              placeholderTextColor={colors.mutedText}
              autoFocus
            />
          </View>

          {isBehaviors && (
            <View style={{ flex: 4, paddingRight: spacing.sm }}>
              <TextInput
                style={styles.tableInput}
                value={newDefinition}
                onChangeText={setNewDefinition}
                placeholder="Definition"
                placeholderTextColor={colors.mutedText}
              />
            </View>
          )}

          {isBehaviors && (
            <View style={{ flex: 2, paddingRight: spacing.sm, position: 'relative' }}>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setNewCategoryDropdownOpen(!newCategoryDropdownOpen)}
              >
                <Text style={styles.dropdownText}>{newCategory}</Text>
                <Feather name="chevron-down" size={14} color={colors.navyText} />
              </TouchableOpacity>
              {newCategoryDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        newCategory === cat && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setNewCategory(cat);
                        setNewCategoryDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {hasType && (
            <View style={{ flex: 3, paddingRight: spacing.sm }}>
              <TextInput
                style={styles.tableInput}
                value={newType}
                onChangeText={setNewType}
                placeholder="Type (e.g. Social)"
                placeholderTextColor={colors.mutedText}
              />
            </View>
          )}

          <View style={{ flex: 2 }}>
            <View style={styles.statusActiveBadge}>
              <Text style={styles.statusActiveText}>Active</Text>
            </View>
          </View>

          <View style={styles.actionsCol}>
            <TouchableOpacity onPress={handleSaveAdd} style={styles.actionIconBtn}>
              <Feather name="check" size={16} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelAdd} style={styles.actionIconBtn}>
              <Feather name="x" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add New Item Button Row */}
      {!isAdding && (
        <View style={styles.addBtnContainer}>
          <Button
            label={`+ Add ${tab.slice(0, -1)}`}
            variant="outline"
            size="sm"
            onPress={() => setIsAdding(true)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { width: '100%' },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  editingRow: {
    backgroundColor: '#F8FAFC',
  },
  addingRow: {
    backgroundColor: '#FEF9C3',
    borderBottomColor: colors.primaryYellow,
  },
  cellText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  tableInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.navyText,
    backgroundColor: '#FFFFFF',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: { fontSize: 13, color: colors.navyText },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemActive: { backgroundColor: '#FEF9C3' },
  dropdownItemText: { fontSize: 13, color: colors.navyText },
  statusActiveBadge: {
    backgroundColor: colors.statusCompletedBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusActiveText: { fontSize: 11, fontWeight: '700', color: colors.statusCompletedText },
  statusInactiveBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusInactiveText: { fontSize: 11, fontWeight: '700', color: colors.mutedText },
  actionsCol: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconBtn: {
    padding: 4,
  },
  addBtnContainer: {
    padding: spacing.md,
    alignItems: 'flex-start',
  },
});

export default AbcTable;
