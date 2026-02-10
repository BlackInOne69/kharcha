import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createExpense, fetchExpenseCategories } from '../../api/expenseApi';
import { palette, typography } from '../../theme/designSystem';

const PAYMENT_METHODS = ['cash', 'esewa', 'khalti', 'bank', 'card', 'other'];

const confidenceColor = (value) => {
  if (value === 'high') return '#16A34A';
  if (value === 'medium') return '#D97706';
  return '#B91C1C';
};

export default function ReviewExpenseScreen({ route, navigation }) {
  const { extracted = {}, image, sourceType = 'manual' } = route.params || {};

  const [amount, setAmount] = useState(extracted.amount || '');
  const [merchant, setMerchant] = useState(extracted.merchant || '');
  const [date, setDate] = useState(extracted.date || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [ocrText, setOcrText] = useState(extracted.ocrText || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');

  const showMessage = (title, message, type = 'info') => {
    setStatusType(type);
    setStatusMessage(`${title}: ${message}`);
    if (type === 'success') {
      return;
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchExpenseCategories();
        const list = Array.isArray(response) ? response : (response.results || []);
        setCategories(list);
      } catch (error) {
        console.warn('Category load failed:', error.message);
      }
    };

    loadCategories();
  }, []);

  const lowConfidenceFields = useMemo(() => {
    const entry = extracted.fieldConfidence || {};
    return Object.keys(entry).filter((key) => entry[key] === 'low');
  }, [extracted.fieldConfidence]);

  const save = async () => {
    if (!amount || Number.isNaN(Number(amount))) {
      showMessage('Amount required', 'Enter a valid amount before saving.', 'error');
      return;
    }

    setSaving(true);
    setStatusMessage('Saving expense...');
    setStatusType('info');
    try {
      await createExpense({
        amount: Number(amount).toFixed(2),
        description: merchant || 'Receipt expense',
        merchant,
        expense_date: date,
        date,
        category_id: categoryId,
        payment_method: paymentMethod,
        source_type: sourceType,
        note,
        ocr_text: ocrText,
        ai_confidence: extracted.confidence ? (extracted.confidence * 100).toFixed(2) : '',
        engine_used: extracted.engine || 'offline-rule-engine',
        ai_amount: extracted.amount || '',
        ai_date: extracted.date || '',
        ai_merchant: extracted.merchant || '',
        image,
        split_type: 'equal',
      });

      showMessage('Saved', 'Expense saved successfully.', 'success');
      setTimeout(() => {
        navigation.navigate('Main', { screen: 'Home' });
      }, 900);
    } catch (error) {
      showMessage('Save failed', error.message || 'Could not save expense.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <Text style={{ fontFamily: typography.family.sans, fontWeight: '700', fontSize: typography.size.lg, color: palette.ink }}>
          Review & Edit
        </Text>

        {image?.uri ? (
          <Image source={{ uri: image.uri }} style={{ width: '100%', height: 180, borderRadius: 14 }} resizeMode="cover" />
        ) : null}

        {lowConfidenceFields.length > 0 ? (
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10 }}>
            <Text style={{ color: '#92400E', fontFamily: typography.family.sans }}>
              Low confidence: {lowConfidenceFields.join(', ')}. Please verify before saving.
            </Text>
          </View>
        ) : null}

        {statusMessage ? (
          <View
            style={{
              backgroundColor: statusType === 'error' ? '#FEE2E2' : statusType === 'success' ? '#DCFCE7' : '#E0F2FE',
              borderRadius: 12,
              padding: 10,
            }}
          >
            <Text style={{ color: statusType === 'error' ? '#B91C1C' : statusType === 'success' ? '#166534' : '#075985', fontWeight: '600' }}>
              {statusMessage}
            </Text>
          </View>
        ) : null}

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>Amount *</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={{ fontSize: 32, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: palette.line, paddingVertical: 6, color: palette.ink }}
            placeholder="0.00"
            placeholderTextColor={palette.muted}
          />
          <Text style={{ color: confidenceColor(extracted?.fieldConfidence?.amount), marginTop: 4 }}>
            amount confidence: {extracted?.fieldConfidence?.amount || 'low'}
          </Text>
        </View>

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 10, backgroundColor: palette.paper, color: palette.ink }}
            placeholderTextColor={palette.muted}
          />
        </View>

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>Merchant</Text>
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 10, backgroundColor: palette.paper, color: palette.ink }}
            placeholderTextColor={palette.muted}
          />
        </View>

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCategoryId(item.id)}
                style={{
                  borderWidth: 1,
                  borderColor: categoryId === item.id ? palette.accent : palette.line,
                  backgroundColor: categoryId === item.id ? palette.accentSoft : palette.paper,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                onPress={() => setPaymentMethod(method)}
                style={{
                  borderWidth: 1,
                  borderColor: paymentMethod === method ? palette.accent : palette.line,
                  backgroundColor: paymentMethod === method ? palette.accentSoft : palette.paper,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ textTransform: 'capitalize' }}>{method}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional notes"
            placeholderTextColor={palette.muted}
            style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 10, backgroundColor: palette.paper, color: palette.ink }}
          />
        </View>

        <View>
          <Text style={{ fontFamily: typography.family.sans, color: palette.ink, marginBottom: 4 }}>OCR Text (local)</Text>
          <TextInput
            value={ocrText}
            onChangeText={setOcrText}
            multiline
            numberOfLines={5}
            style={{
              minHeight: 100,
              borderWidth: 1,
              borderColor: palette.line,
              borderRadius: 12,
              padding: 10,
              backgroundColor: palette.paper,
              fontFamily: typography.family.mono,
              color: palette.ink,
            }}
            placeholderTextColor={palette.muted}
          />
        </View>

        <TouchableOpacity
          disabled={saving}
          onPress={save}
          style={{ backgroundColor: palette.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Save Expense</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
