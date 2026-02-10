import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { deleteExpense } from '../../api/expenseApi';
import { API_BASE_URL } from '../../config/api';
import { palette, typography } from '../../theme/designSystem';

const Row = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.line }}>
    <Text style={{ color: palette.muted }}>{label}</Text>
    <Text style={{ color: palette.ink, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value || '-'}</Text>
  </View>
);

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expense } = route.params || {};

  if (!expense) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No expense selected.</Text>
      </View>
    );
  }

  const imageUrl = expense.image?.startsWith('http') ? expense.image : (expense.image ? `${API_BASE_URL}${expense.image}` : null);

  const remove = async () => {
    try {
      await deleteExpense(expense.id);
      Alert.alert('Deleted', 'Expense and attachment deleted.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Delete failed', error.message || 'Could not delete expense.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <Text style={{ fontFamily: typography.family.sans, fontWeight: '700', fontSize: typography.size.lg, color: palette.ink }}>
          Expense Detail
        </Text>

        {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 220, borderRadius: 14 }} resizeMode="cover" /> : null}

        <View style={{ backgroundColor: palette.paper, borderRadius: 14, padding: 12 }}>
          <Row label="Amount" value={`NPR ${expense.amount}`} />
          <Row label="Date" value={expense.expense_date || expense.date} />
          <Row label="Merchant" value={expense.merchant || expense.description} />
          <Row label="Category" value={expense.category?.name} />
          <Row label="Payment" value={expense.payment_method} />
          <Row label="Source" value={expense.source_type} />
          <Row label="Confidence" value={expense.ai_confidence ? `${expense.ai_confidence}%` : '-'} />
          <Row label="Note" value={expense.note} />
        </View>

        <TouchableOpacity onPress={remove} style={{ backgroundColor: palette.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Delete Expense</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
