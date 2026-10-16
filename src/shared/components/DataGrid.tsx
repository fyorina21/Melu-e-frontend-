import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, radius, spacing } from '../../theme/colors';
import { Skeleton } from './Skeleton';

export interface DataGridColumn<T> {
  key: string;
  header: string | React.ReactNode;
  width?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize?: number;
  emptyMessage?: string;
  onRowPress?: (item: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  minWidth?: number;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DataGrid<T>({
  data,
  columns,
  keyExtractor,
  estimatedItemSize = 56,
  emptyMessage = 'No records found.',
  onRowPress,
  loading = false,
  skeletonRows = 4,
  minWidth,
  headerComponent,
  footerComponent,
  style,
}: DataGridProps<T>) {
  const renderRow = ({ item, index }: { item: T; index: number }) => {
    const isClickable = Boolean(onRowPress);
    const RowWrapper = isClickable ? TouchableOpacity : View;
    const rowProps = isClickable
      ? {
          activeOpacity: 0.75,
          onPress: () => onRowPress?.(item),
        }
      : {};

    return (
      <RowWrapper
        {...rowProps}
        style={[
          styles.row,
          index === data.length - 1 && styles.lastRow,
          isClickable && styles.clickableRow,
        ]}
      >
        {columns.map((col) => {
          const colStyle: ViewStyle = {
            flex: col.flex ?? (col.width ? undefined : 1),
            width: col.width,
            alignItems:
              col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
            justifyContent: 'center',
          };

          return (
            <View key={col.key} style={[styles.cell, colStyle]}>
              {col.render ? (
                col.render(item, index)
              ) : (
                <Text style={styles.cellText}>{String((item as any)?.[col.key] ?? '')}</Text>
              )}
            </View>
          );
        })}
      </RowWrapper>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((col) => {
        const colStyle: ViewStyle = {
          flex: col.flex ?? (col.width ? undefined : 1),
          width: col.width,
          alignItems:
            col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
        };

        return (
          <View key={col.key} style={[styles.headerCell, colStyle]}>
            {typeof col.header === 'string' ? (
              <Text style={styles.headerText}>{col.header.toUpperCase()}</Text>
            ) : (
              col.header
            )}
          </View>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {renderHeader()}
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <View key={`skeleton-${i}`} style={[styles.row, styles.skeletonRow]}>
            {columns.map((col, cIdx) => (
              <View
                key={`sk-${col.key}-${cIdx}`}
                style={[
                  styles.cell,
                  {
                    flex: col.flex ?? (col.width ? undefined : 1),
                    width: col.width,
                  },
                ]}
              >
                <Skeleton width="80%" height={16} />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  const tableContent = (
    <View style={minWidth ? { minWidth } : { width: '100%' }}>
      {headerComponent}
      {renderHeader()}
      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlashList
          data={data}
          renderItem={renderRow}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
        />
      )}
      {footerComponent}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {minWidth ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          {tableContent}
        </ScrollView>
      ) : (
        tableContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  clickableRow: {
    cursor: 'pointer' as any,
  },
  cell: {
    paddingHorizontal: spacing.xs,
  },
  cellText: {
    fontSize: 13,
    color: colors.navyText,
  },
  skeletonRow: {
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
});

export default DataGrid;
