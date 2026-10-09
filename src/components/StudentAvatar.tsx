// src/components/StudentAvatar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors } from '../theme/colors';
import { getStudentPhoto, resolveStudentPhotoUri } from '../utils/studentPhotoHelper';

export interface StudentAvatarProps {
  name?: string | null;
  studentId?: string | null;
  photoUrl?: string | null;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
  backgroundColor?: string;
  fontSize?: number;
  testID?: string;
}

const DEFAULT_AVATAR_COLORS = [
  '#38BDF8', // SKY
  '#34D399', // EMERALD
  '#FBBF24', // AMBER
  '#F472B6', // PINK
  '#A78BFA', // PURPLE
  '#FB923C', // ORANGE
  '#2DD4BF', // TEAL
  '#60A5FA', // BLUE
];

function getAvatarColor(name: string): string {
  if (!name) return colors.promptG || '#38BDF8';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_AVATAR_COLORS.length;
  return DEFAULT_AVATAR_COLORS[index];
}

export default function StudentAvatar({
  name,
  studentId,
  photoUrl,
  size = 40,
  borderRadius,
  style,
  imageStyle,
  textStyle,
  backgroundColor,
  fontSize,
  testID,
}: StudentAvatarProps) {
  const [loadError, setLoadError] = useState(false);

  // Look up photo from explicit prop or global registry
  const directResolved = resolveStudentPhotoUri(photoUrl);
  const registryPhoto = !directResolved
    ? getStudentPhoto(studentId || name, photoUrl)
    : directResolved;

  const currentPhoto = directResolved || registryPhoto;

  // Reset error if photo URL changes
  useEffect(() => {
    setLoadError(false);
  }, [currentPhoto]);

  const radiusVal = borderRadius !== undefined ? borderRadius : size / 2;
  const initial = (name?.trim() || studentId?.trim() || '?').charAt(0).toUpperCase();
  const bg = backgroundColor || getAvatarColor(name || studentId || '');
  const fontSz = fontSize || Math.max(10, Math.floor(size * 0.42));

  if (currentPhoto && !loadError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: radiusVal,
            backgroundColor: colors.border || '#E2E8F0',
          },
          style,
        ]}
        testID={testID}
      >
        <Image
          source={{ uri: currentPhoto }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: radiusVal,
            },
            imageStyle,
          ]}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: radiusVal,
          backgroundColor: bg,
        },
        style,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.initialText,
          {
            fontSize: fontSz,
            lineHeight: Math.floor(fontSz * 1.2),
          },
          textStyle,
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});
