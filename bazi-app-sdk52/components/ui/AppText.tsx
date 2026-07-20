import { Text, type TextProps, StyleSheet } from 'react-native';
import { FontSize, FontWeight, FONT_SANS, Spacing } from '../../theme';

interface AppTextProps extends TextProps {
  size?: number;
  weight?: '400' | '500' | '600' | '700';
  color?: string;
  center?: boolean;
  muted?: boolean;
}

export default function AppText({
  style,
  size = FontSize.base,
  weight = FontWeight.regular,
  color,
  center,
  muted,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: size,
          fontWeight: weight,
          fontFamily: FONT_SANS,
          color: muted ? '#78716c' : color || '#1c1917',
          textAlign: center ? 'center' : 'auto',
        },
        style,
      ]}
      {...rest}
    />
  );
}
