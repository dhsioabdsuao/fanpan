import { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Rect, Circle, Path, ClipPath, Defs, G, Text as SvgText } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  opacity?: number;
}

export default function TaijiBackground({ opacity = 0.7 }: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 180000, // 180s — slower, more meditative
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ rotate }], opacity }]} pointerEvents="none">
      <Svg viewBox="0 0 1000 1000" style={styles.svg}>
        <Defs>
          {/* S-curve dividing the entire viewport — yin bg clip */}
          <ClipPath id="yin-bg">
            <Path d="M 0,0 L 500,0 C 300,250 700,750 500,1000 L 0,1000 Z" />
          </ClipPath>

          {/* S-curve for the taiji yang-half */}
          <ClipPath id="taiji-yang">
            <Path d="M 500,60 A 440,440 0 0,1 500,940 A 220,220 0 0,0 500,500 A 220,220 0 0,1 500,60 Z" />
          </ClipPath>
        </Defs>

        {/* Background split */}
        <Rect x="0" y="0" width="1000" height="1000" fill="#f5f0e8" />
        <Rect x="0" y="0" width="1000" height="1000" fill="#1f1d1a" clipPath="url(#yin-bg)" />

        {/* Subtle S-curve divider line */}
        <Path
          d="M 500,-10 C 300,250 700,750 500,1010"
          fill="none"
          stroke="#a09888"
          strokeWidth="1"
          opacity="0.12"
        />

        {/* Taiji circle background — yin */}
        <Circle cx="500" cy="500" r="440" fill="#1f1d1a" />
        {/* Taiji circle — yang half */}
        <Circle cx="500" cy="500" r="440" fill="#f5f0e8" clipPath="url(#taiji-yang)" />

        {/* Fish eyes */}
        <Circle cx="420" cy="780" r="40" fill="#f5f0e8" />
        <Circle cx="580" cy="220" r="40" fill="#1f1d1a" />

        {/* Inner ring */}
        <Circle cx="500" cy="500" r="440" fill="none" stroke="#a09888" strokeWidth="1.5" opacity="0.15" />
        {/* Outer ring */}
        <Circle cx="500" cy="500" r="465" fill="none" stroke="#a09888" strokeWidth="0.5" opacity="0.08" />

        {/* Bagua trigrams */}
        <SvgText x="500" y="40" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☰</SvgText>
        <SvgText x="840" y="172" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☱</SvgText>
        <SvgText x="960" y="500" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☲</SvgText>
        <SvgText x="840" y="828" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☳</SvgText>
        <SvgText x="500" y="960" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☷</SvgText>
        <SvgText x="160" y="828" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☶</SvgText>
        <SvgText x="40" y="500" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☵</SvgText>
        <SvgText x="160" y="172" fontSize="34" fill="#a09888" opacity="0.18" textAnchor="middle" alignmentBaseline="central">☴</SvgText>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -10,
    overflow: 'hidden',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
