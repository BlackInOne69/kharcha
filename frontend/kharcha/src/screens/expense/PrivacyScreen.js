import { ScrollView, Text, View } from 'react-native';
import { palette, typography } from '../../theme/designSystem';

const points = [
  'OCR runs on-device by default (offline-first).',
  'Receipt image upload is optional and user-controlled.',
  'No receipt profiling to third parties by default.',
  'Data minimization: avoid PAN/VAT/phone/invoice IDs in stored fields.',
  'Delete any expense and attachment anytime.',
];

export default function PrivacyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <Text style={{ fontFamily: typography.family.sans, fontWeight: '700', fontSize: typography.size.xl, color: palette.ink }}>
          Privacy First
        </Text>
        <Text style={{ color: palette.muted, fontFamily: typography.family.sans }}>
          This app is designed for trust: AI suggests, you confirm.
        </Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10 }}>
          {points.map((point) => (
            <Text key={point} style={{ color: palette.ink, lineHeight: 22 }}>
              • {point}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
