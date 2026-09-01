import { StyleSheet, View } from 'react-native';

export function TabGlyph({
  route,
  color,
}: {
  route: string;
  color: string;
}) {
  if (route === 'index') {
    return (
      <View style={styles.box}>
        <View style={[styles.sun, { backgroundColor: color }]} />
        <View style={[styles.ray, { backgroundColor: color, top: 0 }]} />
        <View style={[styles.ray, { backgroundColor: color, bottom: 0 }]} />
        <View style={[styles.rayH, { backgroundColor: color, left: 0 }]} />
        <View style={[styles.rayH, { backgroundColor: color, right: 0 }]} />
      </View>
    );
  }
  if (route === 'stack') {
    return (
      <View style={styles.box}>
        <View style={[styles.capsule, { backgroundColor: color, transform: [{ rotate: '-28deg' }] }]} />
      </View>
    );
  }
  if (route === 'habits') {
    return (
      <View style={styles.box}>
        <View style={[styles.habitOuter, { borderColor: color }]} />
        <View style={[styles.habitCheck, { backgroundColor: color }]} />
      </View>
    );
  }
  if (route === 'train') {
    return (
      <View style={[styles.box, styles.row]}>
        <View style={[styles.plate, { backgroundColor: color }]} />
        <View style={[styles.bar, { backgroundColor: color }]} />
        <View style={[styles.plate, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={[styles.box, styles.row, { alignItems: 'flex-end', gap: 2 }]}>
      <View style={[styles.col, { height: 7, backgroundColor: color }]} />
      <View style={[styles.col, { height: 11, backgroundColor: color }]} />
      <View style={[styles.col, { height: 16, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  sun: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 4,
    borderRadius: 1,
  },
  rayH: {
    position: 'absolute',
    width: 4,
    height: 2,
    borderRadius: 1,
  },
  capsule: {
    width: 16,
    height: 8,
    borderRadius: 8,
  },
  plate: {
    width: 7,
    height: 14,
    borderRadius: 3,
  },
  bar: {
    width: 8,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  col: {
    width: 4,
    borderRadius: 2,
  },
  habitOuter: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 2,
  },
  habitCheck: {
    position: 'absolute',
    width: 7,
    height: 3,
    borderRadius: 1,
    transform: [{ rotate: '-40deg' }, { translateY: 1 }],
  },
});
