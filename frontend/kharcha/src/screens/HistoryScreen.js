import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { listExpenses } from '../api/expenseApi';
import { API_BASE_URL } from '../config/api';
import { palette, typography } from '../theme/designSystem';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sourceType, setSourceType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listExpenses({ month, paymentMethod, sourceType, search });
      setExpenses(Array.isArray(response) ? response : (response.results || []));
    } catch (error) {
      console.warn('Expense fetch failed:', error.message);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (focused) {
      fetchData();
    }
  }, [focused]);

  const filtered = useMemo(() => expenses, [expenses]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas, padding: 14 }}>
      <Text style={{ fontFamily: typography.family.sans, fontSize: typography.size.xl, fontWeight: '700', color: palette.ink }}>
        Expenses
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TextInput
          value={month}
          onChangeText={setMonth}
          placeholder="YYYY-MM"
          style={{ flex: 1, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 10, backgroundColor: '#fff' }}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          style={{ flex: 1, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 10, backgroundColor: '#fff' }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TextInput
          value={sourceType}
          onChangeText={setSourceType}
          placeholder="Source type"
          style={{ flex: 1, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 10, backgroundColor: '#fff' }}
        />
        <TextInput
          value={paymentMethod}
          onChangeText={setPaymentMethod}
          placeholder="Payment"
          style={{ flex: 1, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 10, backgroundColor: '#fff' }}
        />
      </View>

      <TouchableOpacity onPress={fetchData} style={{ marginTop: 10, backgroundColor: palette.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Apply Filters</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 30, gap: 10 }}
          renderItem={({ item }) => {
            const imageUrl = item.image ? `${API_BASE_URL}${item.image}` : null;
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('ExpenseDetail', { expense: item })}
                style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 12, flexDirection: 'row', gap: 10 }}
              >
                {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: 56, height: 56, borderRadius: 10 }} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: palette.ink }}>NPR {item.amount}</Text>
                  <Text style={{ color: palette.muted }}>{item.merchant || item.description || 'No merchant'}</Text>
                  <Text style={{ color: palette.muted, fontSize: 12 }}>
                    {item.expense_date || item.date} • {item.payment_method || 'cash'} • {item.source_type || 'manual'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={{ marginTop: 20, textAlign: 'center', color: palette.muted }}>No expenses found.</Text>}
        />
      )}
    </View>
  );
}
