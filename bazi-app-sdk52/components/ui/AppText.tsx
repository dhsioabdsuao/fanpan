import { Text, type TextProps } from 'react-native';
import { FontSize, FontWeight, FONT_SANS } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';

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
  const colors = useThemeColors();
  return (
    <Text
      style={[
        {
          fontSize: size,
          fontWeight: weight,
          fontFamily: FONT_SANS,
          color: muted ? colors.textMuted : color || colors.textPrimary,
          textAlign: center ? 'center' : 'auto',
        },
        style,
      ]}
      {...rest}
    />
  );
}
