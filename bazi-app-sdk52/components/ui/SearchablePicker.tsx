import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, FlatList, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';

interface SearchablePickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchablePicker({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: SearchablePickerProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? options.filter((o) => o.includes(search.trim()))
    : options;

  return (
    <>
      <Pressable
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => !disabled && setVisible(true)}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder || '请选择'}
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
            <Pressable onPress={() => { setVisible(false); setSearch(''); }}>
              <Text style={styles.doneBtn}>完成</Text>
            </Pressable>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="搜索…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus={false}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isActive = item === value;
              return (
                <Pressable
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => {
                    onChange(item);
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {item}
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
  disabled: {
    backgroundColor: Colors.surface,
    opacity: 0.6,
  },
  triggerText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    flex: 1,
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
    maxHeight: '70%',
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
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
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
