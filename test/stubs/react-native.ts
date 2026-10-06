export const Platform = {
  OS: 'web',
  select: (obj: Record<string, unknown>) => obj.web ?? obj.default,
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
  hairlineWidth: 1,
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};

export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const TextInput = 'TextInput';
export const Modal = 'Modal';
export const ActivityIndicator = 'ActivityIndicator';
export const ScrollView = 'ScrollView';
export const SafeAreaView = 'SafeAreaView';
export const KeyboardAvoidingView = 'KeyboardAvoidingView';

export const Animated = {
  Value: class {
    val: number;
    constructor(val: number) {
      this.val = val;
    }
    setValue(v: number) {
      this.val = v;
    }
  },
  timing: () => ({ start: (cb?: any) => cb?.(), stop: () => {} }),
  sequence: () => ({ start: (cb?: any) => cb?.(), stop: () => {} }),
  loop: () => ({ start: () => {}, stop: () => {} }),
  View: 'Animated.View',
};
