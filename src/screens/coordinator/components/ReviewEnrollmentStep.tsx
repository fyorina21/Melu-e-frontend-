import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme/colors';
import type { WizardState } from '../enrollmentWizardTypes';

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewKey}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

interface ReviewEnrollmentStepProps {
  form: WizardState;
  reviewSections: Array<{ title: string; rows: [string, string][] }>;
  customSectionEntries: Array<{ title: string; rows: [string, string][] }>;
  remainingCustomRows: [string, string][];
}

export function ReviewEnrollmentStep({
  form,
  reviewSections,
  customSectionEntries,
  remainingCustomRows,
}: ReviewEnrollmentStepProps) {
  return (
    <View style={styles.stepBody}>
      <Text style={styles.reviewIntro}>
        Please review the enrollment details before confirming.
      </Text>

      <View style={styles.reviewCard}>
        {form.photoUri ? (
          <View style={styles.reviewPhotoHeader}>
            <Image source={{ uri: form.photoUri }} style={styles.reviewPhotoImage} />
            <View style={styles.reviewPhotoInfo}>
              <Text style={styles.reviewStudentName}>{form.name || 'New Student'}</Text>
              <Text style={styles.reviewStudentProgram}>{form.program} Program</Text>
            </View>
          </View>
        ) : null}

        {reviewSections.map((section) => (
          <ReviewSection key={section.title} title={section.title}>
            {section.rows.map(([label, value]) => (
              <ReviewRow key={label} label={label} value={value} />
            ))}
          </ReviewSection>
        ))}

        {customSectionEntries.map((section) => (
          <ReviewSection key={section.title} title={section.title}>
            {section.rows.map(([label, value]) => (
              <ReviewRow key={label} label={label} value={value} />
            ))}
          </ReviewSection>
        ))}

        {remainingCustomRows.length > 0 && (
          <ReviewSection title="Custom Fields">
            {remainingCustomRows.map(([label, value]) => (
              <ReviewRow key={label} label={label} value={value} />
            ))}
          </ReviewSection>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepBody: { gap: spacing.md },
  reviewIntro: { fontSize: 13, color: '#6B7280', marginBottom: spacing.sm },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  reviewPhotoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewPhotoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  reviewPhotoInfo: {
    flex: 1,
  },
  reviewStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewStudentProgram: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reviewSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#38BDF8',
    marginBottom: spacing.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    gap: spacing.md,
  },
  reviewKey: { fontSize: 13, color: '#6B7280', flexShrink: 1 },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
    textAlign: 'right',
  },
});
