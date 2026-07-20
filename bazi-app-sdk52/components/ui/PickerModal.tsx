import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';

interface PickerOption {
  value: string;
  label: string;
}

interface PickerModalProps {
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PickerModal({ options, value, onChange, placeholder }: PickerModalProps) {
  const [visible, setVisible] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder || '请选择'}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>请选择</Text>
            <Pressable onPress={() => setVisible(false)}>
              <Text style={styles.doneBtn}>完成</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isActive = item.value === value;
              return (
                <Pressable
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => {
                    onChange(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {isActive && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
    backgroundColor: Colors.background,
  },
  triggerText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  arrow: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '60%',
    paddingBottom: Spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  sheetTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  doneBtn: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.goldText,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceBorder,
  },
  optionActive: {
    backgroundColor: '#f5f0e8',
  },
  optionText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  optionTextActive: {
    fontWeight: FontWeight.semibold,
  },
  checkmark: {
    fontSize: FontSize.lg,
    color: Colors.goldText,
    fontWeight: FontWeight.bold,
  },
});
