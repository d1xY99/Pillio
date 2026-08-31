import { SymbolView, type SymbolViewProps } from 'expo-symbols';

type IconSymbolProps = {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
};

export function IconSymbol({ name, size = 24, color }: IconSymbolProps) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={size}
      weight="medium"
      resizeMode="scaleAspectFit"
    />
  );
}
