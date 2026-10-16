import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounceMs?: number;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  onChangeText,
  onSearch,
  onClear,
  placeholder = 'Search...',
  debounceMs = 300,
  style,
  inputStyle,
  testID = 'search-input',
}: SearchInputProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (text: string) => {
    if (!isControlled) {
      setInternalValue(text);
    }
    onChangeText?.(text);

    if (onSearch) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearch(text);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChangeText?.('');
    onSearch?.('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Feather name="search" size={18} color={colors.mutedText} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        returnKeyType="search"
        onSubmitEditing={() => onSearch?.(value)}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x-circle" size={16} color={colors.mutedText} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.navyText,
    paddingVertical: 0,
    height: '100%',
  },
  clearBtn: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchInput;
