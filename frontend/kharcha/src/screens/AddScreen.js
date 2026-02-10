import { useNavigation } from '@react-navigation/native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { useState } from 'react';
import BudgetModal from '../components/BudgetModal';

const methods = [
  { title: 'Scan Receipt', subtitle: 'Use camera for paper bills', source_type: 'receipt', mode: 'camera', icon: 'camera-outline', color: '#2DD4BF' },
  { title: 'Upload Bill', subtitle: 'Pick receipt photo from gallery', source_type: 'receipt', mode: 'gallery', icon: 'image-outline', color: '#60A5FA' },
  { title: 'Upload Screenshot', subtitle: 'Import eSewa/Khalti/bank screenshot', source_type: 'screenshot', mode: 'gallery', icon: 'monitor-screenshot', color: '#A855F7' },
  { title: 'Manual Entry', subtitle: 'Skip OCR and enter directly', source_type: 'manual', mode: 'manual', icon: 'pencil-outline', color: '#F472B6' },
  { title: 'Set Monthly Budget', subtitle: 'Update your global spending limit', source_type: 'budget', mode: 'manual', icon: 'wallet-outline', color: '#10B981' },
];

export default function AddScreen() {
  const navigation = useNavigation();
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);

  const openMethod = (method) => {
    if (method.source_type === 'budget') {
      setIsBudgetModalVisible(true);
      return;
    }

    if (method.source_type === 'manual') {
      navigation.navigate('ReviewExpense', {
        sourceType: method.source_type,
        extracted: { amount: '', merchant: '', date: new Date().toISOString().slice(0, 10), confidence: 0.2, fieldConfidence: {} },
      });
      return;
    }

    navigation.navigate('ScanPreview', {
      sourceType: method.source_type,
      mode: method.mode,
    });
  };

  return (
    <View className="flex-1 bg-background-dark">
      <CustomHeader title="Add" subtitle="Expense" showBackButton={false} showProfileIcon={true} />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className="text-white font-bold text-2xl font-display mb-2">New Entry</Text>
          <Text className="text-text-muted font-body leading-5">
            Choose how you want to add your expense. OCR stays on-device for privacy.
          </Text>
        </View>

        <View className="gap-4">
          {methods.map((method, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openMethod(method)}
              className="flex-row items-center p-5 rounded-3xl bg-surface-glass border border-white/5 active:bg-surface-glass/80"
            >
              <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 border border-white/5 bg-surface-dark`}>
                <MaterialCommunityIcons name={method.icon} size={28} color={method.color} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg font-display mb-1">
                  {method.title}
                </Text>
                <Text className="text-text-muted text-sm font-body">
                  {method.subtitle}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#52525B" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('PrivacyPolicy')}
          className="mt-8 flex-row items-center justify-center p-4 rounded-xl bg-surface-glass border border-white/5"
        >
          <MaterialCommunityIcons name="shield-check-outline" size={20} color="#2DD4BF" />
          <Text className="ml-2 text-primary font-bold font-display">
            Privacy Promise
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BudgetModal
        isVisible={isBudgetModalVisible}
        onClose={() => setIsBudgetModalVisible(false)}
        onSuccess={() => {
          // Optional: Show toast or handle post-update actions
        }}
      />
    </View>
  );
}
