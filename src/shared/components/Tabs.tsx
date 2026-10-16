import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  activeTabStyle?: StyleProp<ViewStyle>;
  tabTextStyle?: StyleProp<TextStyle>;
  activeTabTextStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  scrollable = false,
  style,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  testID = 'tabs',
}: TabsProps<T>) {
  const renderTab = (tab: TabItem<T>) => {
    const isActive = tab.id === activeTab;
    const isDisabled = tab.disabled;

    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabBase,
          variant === 'underline' && styles.tabUnderline,
          variant === 'underline' && isActive && styles.tabUnderlineActive,
          variant === 'pills' && styles.tabPill,
          variant === 'pills' && isActive && styles.tabPillActive,
          variant === 'segmented' && styles.tabSegmented,
          variant === 'segmented' && isActive && styles.tabSegmentedActive,
          isDisabled && styles.tabDisabled,
          tabStyle,
          isActive && activeTabStyle,
        ]}
        onPress={() => !isDisabled && onChange(tab.id)}
        disabled={isDisabled}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled: isDisabled }}
        accessibilityLabel={`${tab.label}${tab.badge ? `, ${tab.badge} items` : ''}`}
        activeOpacity={0.7}
      >
        {tab.icon && (
          <Feather
            name={tab.icon}
            size={16}
            color={
              isActive
                ? variant === 'pills'
                  ? colors.navyText
                  : colors.primaryBlue
                : colors.bodyText
            }
            style={styles.tabIcon}
          />
        )}
        <Text
          style={[
            styles.tabText,
            isActive && styles.tabTextActive,
            variant === 'pills' && isActive && styles.tabPillTextActive,
            tabTextStyle,
            isActive && activeTabTextStyle,
          ]}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && (
          <View
            style={[
              styles.badge,
              isActive && variant === 'pills' ? styles.badgePillActive : styles.badgeDefault,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isActive && variant === 'pills' && styles.badgePillTextActive,
              ]}
            >
              {tab.badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const containerStyle = [
    styles.container,
    variant === 'underline' && styles.containerUnderline,
    variant === 'segmented' && styles.containerSegmented,
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={containerStyle}
        testID={testID}
      >
        {tabs.map(renderTab)}
      </ScrollView>
    );
  }

  return (
    <View style={containerStyle} testID={testID} accessibilityRole="tablist">
      {tabs.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerSegmented: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  tabBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tabUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabUnderlineActive: {
    borderBottomColor: colors.primaryBlue,
  },
  tabPill: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
    marginRight: spacing.sm,
  },
  tabPillActive: {
    backgroundColor: colors.primaryYellow,
  },
  tabSegmented: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tabSegmentedActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabIcon: {
    marginRight: spacing.xs + 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.bodyText,
  },
  tabTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
  tabPillTextActive: {
    color: colors.navyText,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: spacing.xs + 2,
  },
  badgeDefault: {
    backgroundColor: '#E5E7EB',
  },
  badgePillActive: {
    backgroundColor: 'rgba(26, 34, 51, 0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
  badgePillTextActive: {
    color: colors.navyText,
  },
});

export default Tabs;
