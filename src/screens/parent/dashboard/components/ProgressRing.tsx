// src/screens/parent/dashboard/components/ProgressRing.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SKY = '#38BDF8';
const TRACK = '#F3F4F6';
const SEGMENT_COUNT = 48;
const SEGMENT_WIDTH = 7.5;

interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
}

export default function ProgressRing({ percent, size = 104, stroke = 10 }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const segments: React.ReactNode[] = [];

  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const angle = (i / SEGMENT_COUNT) * 360;
    const filled = (i / SEGMENT_COUNT) * 100 <= pct;
    segments.push(
      <View
        key={i}
        style={[
          styles.ringSegWrap,
          { width: size, height: size, transform: [{ rotate: `${angle}deg` }] },
        ]}
      >
        <View
          style={[
            styles.ringSeg,
            {
              width: SEGMENT_WIDTH,
              height: stroke,
              backgroundColor: filled ? SKY : TRACK,
            },
          ]}
        />
      </View>,
    );
  }

  const innerSize = Math.max(0, size - stroke * 2);

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      accessibilityLabel={`Progress ${pct} percent`}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: TRACK,
        }}
      />
      {segments}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={styles.ringText}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
  },
  ringSegWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
  },
  ringSeg: {
    borderRadius: 4,
  },
});
