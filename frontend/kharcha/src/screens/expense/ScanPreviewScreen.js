import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { extractExpenseGist } from '../../utils/expenseExtractor';
import { runOnDeviceOCR } from '../../utils/ocrEngine';
import { palette, typography } from '../../theme/designSystem';

export default function ScanPreviewScreen({ navigation, route }) {
  const { sourceType, mode } = route.params || {};
  const [asset, setAsset] = useState(null);
  const [busy, setBusy] = useState(false);
  const [manualOcrText, setManualOcrText] = useState('');

  const isReady = useMemo(() => Boolean(asset?.uri), [asset]);

  useEffect(() => {
    const pick = async () => {
      const permission = mode === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission required', 'Enable camera/gallery permission to continue.');
        navigation.goBack();
        return;
      }

      const result = mode === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: true });

      if (result.canceled) {
        navigation.goBack();
        return;
      }

      setAsset(result.assets[0]);
    };

    pick();
  }, [mode, navigation]);

  const extract = async () => {
    if (!asset?.uri) return;
    setBusy(true);

    try {
      const ocr = await runOnDeviceOCR(asset.uri);
      const fullText = manualOcrText.trim() || ocr.fullText || '';
      const lines = fullText ? fullText.split('\n') : ocr.lines;
      const extracted = extractExpenseGist({ fullText, lines });

      navigation.navigate('ReviewExpense', {
        sourceType,
        image: asset,
        extracted: {
          ...extracted,
          engine: ocr.engine,
        },
      });
    } catch (error) {
      Alert.alert('Extraction failed', error.message || 'Could not extract receipt data.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <Text style={{ fontFamily: typography.family.sans, fontSize: typography.size.lg, color: palette.ink, fontWeight: '700' }}>
          Preview & Extract
        </Text>

        {asset?.uri ? (
          <Image source={{ uri: asset.uri }} style={{ width: '100%', height: 320, borderRadius: 18, backgroundColor: '#E5E7EB' }} resizeMode="cover" />
        ) : (
          <View style={{ height: 220, backgroundColor: '#E5E7EB', borderRadius: 14 }} />
        )}

        <Text style={{ fontFamily: typography.family.sans, color: palette.muted }}>
          Optional fallback: paste OCR text if your device OCR module is not installed yet.
        </Text>
        <TextInput
          multiline
          numberOfLines={5}
          value={manualOcrText}
          onChangeText={setManualOcrText}
          placeholder="Paste OCR text here (optional)"
          style={{
            minHeight: 100,
            borderWidth: 1,
            borderColor: palette.line,
            borderRadius: 14,
            padding: 12,
            fontFamily: typography.family.mono,
            color: palette.ink,
            backgroundColor: palette.paper,
          }}
        />

        <TouchableOpacity
          disabled={!isReady || busy}
          onPress={extract}
          style={{
            backgroundColor: !isReady || busy ? '#6B7280' : palette.accent,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Extract Expense Gist</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
