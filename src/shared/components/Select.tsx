import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, shadows } from '../../theme';
import { SearchInput } from './SearchInput';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps<T = string> {
  label?: string;
  placeholder?: string;
  options: SelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Select<T = string>({
  label,
  placeholder = 'Select an option...',
  options,
  value,
  onChange,
  error,
  disabled = false,
  searchable = false,
  style,
  testID = 'select',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions =
    searchable && searchQuery.trim()
      ? options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.description?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.trigger,
          isOpen && styles.triggerOpen,
          !!error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: isOpen, disabled }}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.valueText,
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Feather
          name="chevron-down"
          size={18}
          color={disabled ? colors.mutedText : colors.bodyText}
          style={[styles.arrowIcon, isOpen && styles.arrowIconOpen]}
        />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label || 'Select'}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={20} color={colors.navyText} />
                  </TouchableOpacity>
                </View>

                {searchable && (
                  <View style={styles.searchBox}>
                    <SearchInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Filter options..."
                    />
                  </View>
                )}

                <FlatList
                  data={filteredOptions}
                  keyExtractor={(_, index) => String(index)}
                  style={styles.optionsList}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                          item.disabled && styles.optionItemDisabled,
                        ]}
                        onPress={() => handleSelect(item)}
                        disabled={item.disabled}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={styles.optionTextContainer}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                              item.disabled && styles.disabledText,
                            ]}
                          >
                            {item.label}
                          </Text>
                          {item.description ? (
                            <Text style={styles.optionDescription}>{item.description}</Text>
                          ) : null}
                        </View>
                        {isSelected && (
                          <Feather name="check" size={18} color={colors.primaryBlue} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No matching options found</Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  triggerOpen: {
    borderColor: colors.primaryBlue,
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: colors.border,
    opacity: 0.6,
  },
  valueText: {
    fontSize: 14,
    color: colors.navyText,
    flex: 1,
  },
  placeholderText: {
    color: colors.mutedText,
  },
  disabledText: {
    color: colors.mutedText,
  },
  arrowIcon: {
    marginLeft: spacing.sm,
  },
  arrowIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    ...shadows.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  searchBox: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionsList: {
    maxHeight: 360,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: colors.statusInProgressBg,
  },
  optionItemDisabled: {
    opacity: 0.5,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.navyText,
  },
  optionLabelSelected: {
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.bodyText,
    marginTop: 2,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
});

export default Select;
