import { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

interface Props {
  full: FullAnalysis;
}

export default function AnalysisBlock({ full }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { summary, analysis } = full.texts;

  // Parse the analysis text into sections
  const sections = analysis.split('\n\n').map((section) => {
    const match = section.match(/^\*\*(.+?)\*\*[：:]?\s*([\s\S]*)$/);
    if (match) {
      return { heading: match[1], body: match[2] };
    }
    return { heading: null, body: section };
  });

  return (
    <View style={styles.container}>
      {/* Summary box */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      {/* Analysis sections */}
      <View style={styles.analysisContent}>
        {sections.map((section, i) => (
          <View key={i} style={section.heading ? styles.sectionBlock : undefined}>
            {section.heading && (
              <Text style={styles.sectionHeading}>{section.heading}</Text>
            )}
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  summary: {
    backgroundColor: colors.analysisSummaryBg,
    borderWidth: 1,
    borderColor: colors.analysisSummaryBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  summaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: '#78350f',
    lineHeight: 22,
  },
  analysisContent: {
    gap: Spacing.md,
  },
  sectionBlock: {
    marginBottom: Spacing.xs,
  },
  sectionHeading: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
