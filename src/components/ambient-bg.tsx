import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export function AmbientBg() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['rgba(62,224,183,0.18)', 'rgba(62,224,183,0)']}
        style={styles.mint}
      />
      <LinearGradient
        colors={['rgba(167,139,250,0.12)', 'rgba(167,139,250,0)']}
        style={styles.violet}
      />
      <LinearGradient
        colors={['rgba(245,193,76,0.08)', 'rgba(245,193,76,0)']}
        style={styles.gold}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mint: {
    position: 'absolute',
    top: -90,
    left: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  violet: {
    position: 'absolute',
    top: 220,
    right: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  gold: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
});
