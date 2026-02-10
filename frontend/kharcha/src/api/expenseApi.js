import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';

const authedFetch = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('access_token');
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : undefined,
  };
  if (!headers.Authorization) {
    delete headers.Authorization;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.detail || `Request failed (${response.status})`);
  }

  return data;
};

export const fetchExpenseCategories = () => authedFetch('/api/categories');

export const createExpense = async (payload) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'image' && value?.uri) {
      if (Platform.OS === 'web') {
        try {
          const res = await fetch(value.uri);
          const blob = await res.blob();
          formData.append('image', blob, value.fileName || 'receipt.jpg');
        } catch {
          // Keep expense save functional even if image upload fails on web.
        }
      } else {
        formData.append('image', {
          uri: value.uri,
          name: value.fileName || 'receipt.jpg',
          type: value.type || 'image/jpeg',
        });
      }
      continue;
    }
    formData.append(key, String(value));
  }

  return authedFetch('/api/expenses', {
    method: 'POST',
    body: formData,
  });
};

export const listExpenses = ({ month, year, category, paymentMethod, sourceType, search, limit }) => {
  const query = new URLSearchParams();
  if (month) query.append('month', month);
  if (year) query.append('year', year);
  if (category) query.append('category', category);
  if (paymentMethod) query.append('payment_method', paymentMethod);
  if (sourceType) query.append('source_type', sourceType);
  if (search) query.append('search', search);
  if (limit) query.append('page_size', limit);

  return authedFetch(`/api/expenses?${query.toString()}`);
};

export const updateExpense = (id, payload) => authedFetch(`/api/expenses/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

export const deleteExpense = (id) => authedFetch(`/api/expenses/${id}`, {
  method: 'DELETE',
});

export const fetchMonthlyAnalytics = ({ month, year }) => {
  const query = new URLSearchParams();
  if (month) query.append('month', month);
  if (year) query.append('year', year);
  return authedFetch(`/api/analytics/monthly/?${query.toString()}`);
};
