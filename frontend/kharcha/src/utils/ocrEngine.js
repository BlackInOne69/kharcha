import { NativeModules, Platform } from 'react-native';

export const runOnDeviceOCR = async (uri) => {
  if (!uri) {
    return { fullText: '', lines: [], engine: 'none' };
  }

  try {
    if (NativeModules?.MlkitOcr?.detectFromUri) {
      const res = await NativeModules.MlkitOcr.detectFromUri(uri);
      const lines = Array.isArray(res?.lines) ? res.lines : [];
      return {
        fullText: res?.text || lines.join('\n'),
        lines,
        engine: 'mlkit-native',
      };
    }
  } catch (error) {
    console.warn('Mlkit OCR unavailable:', error?.message);
  }

  try {
    const maybeModule = await import('expo-text-recognition');
    if (maybeModule?.scanFromURLAsync) {
      const lines = await maybeModule.scanFromURLAsync(uri);
      return {
        fullText: (lines || []).join('\n'),
        lines: lines || [],
        engine: 'expo-text-recognition',
      };
    }
  } catch (error) {
    console.warn('expo-text-recognition unavailable:', error?.message);
  }

  if (Platform.OS === 'web') {
    try {
      const tesseract = await import('tesseract.js');
      const result = await tesseract.recognize(uri, 'eng');
      const fullText = result?.data?.text || '';
      const lines = fullText.split('\n').map((line) => line.trim()).filter(Boolean);
      return {
        fullText,
        lines,
        engine: 'tesseract-web',
      };
    } catch (error) {
      console.warn('tesseract.js unavailable:', error?.message);
    }
  }

  return {
    fullText: '',
    lines: [],
    engine: 'fallback-none',
  };
};
