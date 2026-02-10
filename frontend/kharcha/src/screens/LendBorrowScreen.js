import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getTransactions, createTransaction, markTransactionPaid, verifyTransaction } from '../api/apiService';

const LendBorrowScreen = () => {
    const navigation = useNavigation();
    const { userDetails } = useContext(AuthContext);

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('lend'); // 'lend' or 'borrow'

    // Summary States
    const [totalLent, setTotalLent] = useState(0);
    const [totalBorrowed, setTotalBorrowed] = useState(0);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newTransType, setNewTransType] = useState('L'); // 'L' or 'B'
    const [amount, setAmount] = useState('');
    const [participantId, setParticipantId] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
            calculateTotals(data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateTotals = (data) => {
        let lent = 0;
        let borrowed = 0;
        const currentUserId = userDetails?.id;

        data.forEach(t => {
            const isCompleted = t.status === 'D'; // Paid
            if (isCompleted) return; // Don't count paid transactions in outstanding balance

            const isInitiator = t.initiator === currentUserId;
            // Logic:
            // Type 'L' (Lend): Initiator GIVES to Participant.
            //    - If I am Initiator: I lent money. (Positive for me)
            //    - If I am Participant: I received money. (Negative/Debt for me)
            // Type 'B' (Borrow): Initiator TAKES from Participant.
            //    - If I am Initiator: I borrowed money. (Negative/Debt for me)
            //    - If I am Participant: I gave money. (Positive for me)

            if (t.transaction_type === 'L') {
                if (isInitiator) lent += parseFloat(t.amount);
                else borrowed += parseFloat(t.amount);
            } else if (t.transaction_type === 'B') {
                if (isInitiator) borrowed += parseFloat(t.amount);
                else lent += parseFloat(t.amount);
            }
        });

        setTotalLent(lent);
        setTotalBorrowed(borrowed);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleCreateTransaction = async () => {
        if (!amount || !participantId) {
            Alert.alert("Error", "Please fill in amount and participant username");
            return;
        }
        setIsSubmitting(true);
        try {
            await createTransaction({
                participant: participantId, // Send username string directly
                amount: parseFloat(amount),
                transaction_type: newTransType,
                description: description
            });
            setModalVisible(false);
            setAmount('');
            setParticipantId('');
            setDescription('');
            fetchData(); // Refresh list
            Alert.alert("Success", "Transaction created successfully");
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to create transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openModal = (type) => {
        setNewTransType(type === 'lend' ? 'L' : 'B');
        setModalVisible(true);
    };

    const renderItem = ({ item }) => {
        const isInitiator = item.initiator === userDetails?.id;
        // Determine role for display
        // If Type L: Initiator -> Participant
        // If Type B: Participant -> Initiator

        // Filter based on active tab
        // Tab 'Lend' (Assets): Show if I am the Lender
        // Tab 'Borrow' (Liabilities): Show if I am the Borrower

        let isLender = false;
        if (item.transaction_type === 'L') {
            isLender = isInitiator;
        } else {
            isLender = !isInitiator;
        }

        const showInLendTab = isLender;
        const showInBorrowTab = !isLender;

        if (activeTab === 'lend' && !showInLendTab) return null;
        if (activeTab === 'borrow' && !showInBorrowTab) return null;

        const otherPartyName = isInitiator ? item.participant_username : item.initiator_username;
        const formattedDate = new Date(item.created_at).toLocaleDateString();

        return (
            <View className="bg-surface-glass border border-white/5 p-4 rounded-2xl mb-3 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-full items-center justify-center border ${isLender ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <MaterialCommunityIcons
                            name={isLender ? "arrow-top-right" : "arrow-bottom-left"}
                            size={20}
                            color={isLender ? "#10B981" : "#EF4444"}
                        />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-sm font-display">
                            {isLender ? `Lent to @${otherPartyName}` : `Borrowed from @${otherPartyName}`}
                        </Text>
                        <Text className="text-text-muted text-xs font-mono">{formattedDate} • {item.status === 'P' ? 'Pending' : item.status === 'A' ? 'Accepted' : 'Paid'}</Text>
                    </View>
                </View>
                <View>
                    <Text className={`font-bold font-mono text-right ${isLender ? "text-emerald-400" : "text-red-400"}`}>
                        NPR {item.amount}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background-dark">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 border-b border-white/5 bg-background-dark/95 flex-row items-center gap-4">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 rounded-xl bg-surface-dark border border-white/5">
                    <MaterialCommunityIcons name="arrow-left" size={20} color="#F4F4F5" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-white font-display">Lending & Borrowing</Text>
            </View>

            <ScrollView
                className="flex-1 px-5 py-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2DD4BF" />}
            >
                {/* Summary Cards */}
                <View className="flex-row gap-3 mb-6">
                    <View className="flex-1 bg-surface-glass border border-white/5 p-4 rounded-3xl relative overflow-hidden">
                        <View className="absolute right-[-10] top-[-10] w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
                        <Text className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">To Collect</Text>
                        <Text className="text-2xl font-bold text-white font-mono">NPR {totalLent}</Text>
                    </View>
                    <View className="flex-1 bg-surface-glass border border-white/5 p-4 rounded-3xl relative overflow-hidden">
                        <View className="absolute right-[-10] top-[-10] w-20 h-20 bg-red-500/10 rounded-full blur-xl" />
                        <Text className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">To Pay</Text>
                        <Text className="text-2xl font-bold text-white font-mono">NPR {totalBorrowed}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row bg-surface-dark p-1 rounded-2xl mb-4 border border-white/5">
                    <TouchableOpacity
                        onPress={() => setActiveTab('lend')}
                        className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'lend' ? 'bg-[#2DD4BF]' : ''}`}
                    >
                        <Text className={`text-sm font-bold ${activeTab === 'lend' ? 'text-black' : 'text-text-muted'}`}>Lent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('borrow')}
                        className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'borrow' ? 'bg-[#2DD4BF]' : ''}`}
                    >
                        <Text className={`text-sm font-bold ${activeTab === 'borrow' ? 'text-black' : 'text-text-muted'}`}>Borrowed</Text>
                    </TouchableOpacity>
                </View>

                {/* Transactions List */}
                {loading ? (
                    <ActivityIndicator color="#2DD4BF" className="mt-10" />
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        scrollEnabled={false} // Since wrapped in ScrollView
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <MaterialCommunityIcons name="currency-usd-off" size={40} color="#52525B" />
                                <Text className="text-text-muted mt-2">No active transactions found</Text>
                            </View>
                        }
                    />
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => openModal(activeTab)}
                className="absolute bottom-6 right-6 w-14 h-14 bg-accent rounded-full items-center justify-center shadow-glow"
            >
                <MaterialCommunityIcons name="plus" size={28} color="#18181B" />
            </TouchableOpacity>

            {/* Add Transaction Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-background-dark rounded-t-3xl p-6 border-t border-white/10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white font-display">
                                {newTransType === 'L' ? 'New Lend Record' : 'New Borrow Record'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4 mb-6">
                            <View>
                                <Text className="text-text-muted text-xs uppercase mb-2 ml-1">Friend's Username (Participant)</Text>
                                <TextInput
                                    className="bg-surface-glass border border-white/10 text-white p-4 rounded-xl font-mono"
                                    placeholder="Enter username (e.g. ram)"
                                    placeholderTextColor="#52525B"
                                    autoCapitalize="none"
                                    value={participantId}
                                    onChangeText={setParticipantId}
                                />
                            </View>

                            <View>
                                <Text className="text-text-muted text-xs uppercase mb-2 ml-1">Amount (NPR)</Text>
                                <TextInput
                                    className="bg-surface-glass border border-white/10 text-white p-4 rounded-xl font-mono text-lg"
                                    placeholder="0.00"
                                    placeholderTextColor="#52525B"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>

                            <View>
                                <Text className="text-text-muted text-xs uppercase mb-2 ml-1">Description (Optional)</Text>
                                <TextInput
                                    className="bg-surface-glass border border-white/10 text-white p-4 rounded-xl font-body"
                                    placeholder="What is this for?"
                                    placeholderTextColor="#52525B"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleCreateTransaction}
                            disabled={isSubmitting}
                            className="w-full bg-accent py-4 rounded-2xl items-center justify-center"
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#18181B" />
                            ) : (
                                <Text className="text-[#18181B] font-bold text-lg">Save Record</Text>
                            )}
                        </TouchableOpacity>
                        <View className="h-8" />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default LendBorrowScreen;
