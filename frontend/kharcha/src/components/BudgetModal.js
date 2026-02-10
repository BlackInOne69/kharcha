// kharcha/src/components/BudgetModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBudgets, createBudget, updateBudget } from '../api/apiService';

const BudgetModal = ({ isVisible, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingBudget, setExistingBudget] = useState(null);

    useEffect(() => {
        if (isVisible) {
            checkExistingBudget();
        }
    }, [isVisible]);

    const checkExistingBudget = async () => {
        setLoading(true);
        try {
            const data = await getBudgets();
            // Find a budget that looks like a global monthly budget
            // Check for current month first
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

            // Assuming backend returns paginated response { results: [] }
            const budgets = data.results || [];

            // Ideally we find one for this month passed, or one with no category?
            // Since we modified backend to allow category=null, let's look for that
            const found = budgets.find(b => !b.category);

            if (found) {
                setExistingBudget(found);
                setAmount(found.amount ? String(found.amount) : String(parseInt(found.allowed_expense || 0)));
            } else if (budgets.length > 0) {
                // Fallback to first available if no specific global match found
                const first = budgets[0];
                setExistingBudget(first);
                setAmount(first.amount ? String(first.amount) : String(parseInt(first.allowed_expense || 0)));
            } else {
                setExistingBudget(null);
                setAmount('');
            }
        } catch (e) {
            console.log("Error fetching budget:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            Alert.alert('Invalid Amount', 'Please enter a valid number');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                amount: parseFloat(amount),
                // Only send month if creating, though update ignores it usually
                month: new Date().toISOString().slice(0, 10),
            };

            if (existingBudget) {
                await updateBudget(existingBudget.id, payload);
            } else {
                await createBudget(payload);
            }

            Alert.alert('Success', 'Monthly budget updated!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to save budget');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end"
                >
                    <View className="bg-background-dark rounded-t-3xl border-t border-white/10 h-[60%] w-full overflow-hidden">
                        <View className="flex-row items-center justify-between p-6 border-b border-white/5 bg-surface-glass backdrop-blur-xl">
                            <Text className="text-xl font-bold text-white font-display">Set Monthly Budget</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-surface-dark/50 border border-white/10">
                                <MaterialCommunityIcons name="close" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 24 }} className="flex-1">
                            <Text className="text-text-muted text-sm font-body mb-6">
                                Set a global spending limit for this month. We'll track your daily expenses against this amount.
                            </Text>

                            <View className="mb-8">
                                <Text className="text-white text-sm font-medium mb-2 font-body ml-1">Monthly Limit (NPR)</Text>
                                <View className="bg-surface-glass border border-white/10 rounded-xl px-4 py-3 flex-row items-center">
                                    <Text className="text-accent font-bold text-lg mr-2">NPR</Text>
                                    <TextInput
                                        className="flex-1 text-white font-mono-custom text-xl"
                                        placeholder="50000"
                                        placeholderTextColor="#52525B"
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={loading}
                                className={`bg-primary p-4 rounded-xl items-center shadow-glow ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg font-display">Save Budget</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default BudgetModal;
