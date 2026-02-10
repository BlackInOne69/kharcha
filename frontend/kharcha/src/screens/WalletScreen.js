import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, ActivityIndicator, Alert, FlatList, Image } from 'react-native';

// ... (existing imports)

// ... (inside WalletScreen)

// DELETE getWalletIcon function if it exists as we will use getWalletVisuals inside renderWalletItem or separate function.

const getWalletVisuals = (name, type) => {
    const lowerName = name.toLowerCase();
    // eSewa
    if (lowerName.includes('esewa')) {
        return {
            type: 'image',
            // Wikimedia Commons Thumbnail
            source: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Esewa_logo.png/600px-Esewa_logo.png' },
            color: '#41A124'
        };
    }
    // Khalti
    if (lowerName.includes('khalti')) {
        return {
            type: 'image',
            // Wikimedia Commons Thumbnail
            source: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Khalti_Digital_Wallet_Logo.png/600px-Khalti_Digital_Wallet_Logo.png' },
            color: '#5C2D91'
        };
    }
    // Cash
    if (lowerName.includes('cash') || type === 'cash') {
        return {
            type: 'icon',
            name: 'cash',
            color: '#10B981'
        };
    }
    // Bank
    if (type === 'bank' || lowerName.includes('bank')) {
        return {
            type: 'icon',
            name: 'bank',
            color: '#3B82F6'
        };
    }
    // Default
    return {
        type: 'icon',
        name: 'wallet',
        color: '#2DD4BF'
    };
};

const renderWalletItem = (wallet) => {
    const visuals = getWalletVisuals(wallet.name, wallet.type);

    return (
        <TouchableOpacity
            key={wallet.id}
            className="bg-surface-glass border border-white/5 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/5 mb-3"
        >
            <View className="flex-row items-center gap-4">
                <View
                    className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg overflow-hidden bg-surface-dark border border-white/10 relative p-1"
                    style={{ borderColor: visuals.color + '40' }}
                >
                    {visuals.type === 'image' ? (
                        <Image
                            source={visuals.source}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    ) : (
                        <MaterialCommunityIcons name={visuals.name} size={24} color={visuals.color} />
                    )}
                </View>
                <View>
                    <Text className="text-sm font-bold text-white mb-0.5 font-display">{wallet.name}</Text>
                    <Text className="text-[10px] text-text-muted font-mono tracking-wide">
                        {wallet.identifier || wallet.type}
                    </Text>
                </View>
            </View>
            <View className="items-end">
                <Text className="text-sm font-bold text-white font-mono">NPR {parseFloat(wallet.balance).toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );
};
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getWallets, createWallet, createIncome, getIncomeCategories, createIncomeCategory } from '../api/apiService';

const WalletScreen = () => {
    const navigation = useNavigation();

    // Data State
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalBalance, setTotalBalance] = useState("0.00");

    // Modal States
    const [addFundsVisible, setAddFundsVisible] = useState(false);
    const [createWalletVisible, setCreateWalletVisible] = useState(false);

    // Form States - Add Funds
    const [fundAmount, setFundAmount] = useState('');
    const [fundDescription, setFundDescription] = useState('Added Funds');
    const [selectedWalletId, setSelectedWalletId] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [submittingFund, setSubmittingFund] = useState(false);

    // Form States - Create Wallet
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletType, setNewWalletType] = useState('digital');
    const [newWalletIcon, setNewWalletIcon] = useState('wallet');
    const [newWalletIdentifier, setNewWalletIdentifier] = useState('');
    const [submittingWallet, setSubmittingWallet] = useState(false);

    const fetchData = async () => {
        try {
            const [walletsData, categoriesData] = await Promise.all([
                getWallets(),
                getIncomeCategories()
            ]);

            // Handle pagination (Django REST Framework returns { results: [...] } if paginated)
            const walletsList = walletsData.results || walletsData;
            const categoriesList = categoriesData.results || categoriesData;

            // Ensure we have arrays
            const safeWallets = Array.isArray(walletsList) ? walletsList : [];
            let safeCategories = Array.isArray(categoriesList) ? categoriesList : [];

            // If no categories exist, create a default 'Deposit' category
            if (safeCategories.length === 0) {
                try {
                    const defaultCategory = await createIncomeCategory({ name: 'Deposit', icon: 'bank-transfer' });
                    safeCategories = [defaultCategory];
                } catch (err) {
                    console.error("Failed to create default category", err);
                }
            }

            setWallets(safeWallets);
            setCategories(safeCategories);

            // Calculate total balance
            const total = safeWallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);
            setTotalBalance(total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

            // Set default selections if available
            if (safeWallets.length > 0) setSelectedWalletId(safeWallets[0].id);
            if (safeCategories.length > 0) setSelectedCategoryId(safeCategories[0].id);

        } catch (error) {
            console.error("Failed to fetch wallet data", error);
            // Alert.alert("Error", "Failed to load wallet data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddFunds = async () => {
        if (!fundAmount || !selectedWalletId || !selectedCategoryId) {
            Alert.alert("Error", "Please fill in amount, wallet, and category.");
            return;
        }

        setSubmittingFund(true);
        try {
            await createIncome({
                amount: parseFloat(fundAmount),
                description: fundDescription,
                wallet_id: selectedWalletId,
                category_id: selectedCategoryId,
                group: 'Wallet Fund'
            });
            Alert.alert("Success", "Funds added successfully!");
            setAddFundsVisible(false);
            setFundAmount('');
            fetchData(); // Refresh data to show updated balance
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to add funds.");
        } finally {
            setSubmittingFund(false);
        }
    };

    const handleCreateWallet = async () => {
        if (!newWalletName) {
            Alert.alert("Error", "Please enter a wallet name.");
            return;
        }
        setSubmittingWallet(true);
        try {
            await createWallet({
                name: newWalletName,
                type: newWalletType,
                icon: newWalletIcon, // simplified for now
                identifier: newWalletIdentifier,
                color: "#2DD4BF" // default color
            });
            Alert.alert("Success", "Wallet created successfully!");
            setCreateWalletVisible(false);
            setNewWalletName('');
            setNewWalletIdentifier('');
            fetchData();
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to create wallet.");
        } finally {
            setSubmittingWallet(false);
        }
    };

    const getWalletVisuals = (name, type) => {
        const lowerName = name.toLowerCase();
        // eSewa
        if (lowerName.includes('esewa')) {
            return {
                type: 'image',
                // Using a public URL for eSewa icon - reliable source needed
                source: { uri: 'https://play-lh.googleusercontent.com/fkHae_i6VdaY_z_5h_fF7sC6Xh_p0gX_6Xz_5h_fF7sC6Xh_p0gX_6Xz_5h_fF7sC6X=w240-h480-rw' },
                color: '#41A124'
            };
        }
        // Khalti
        if (lowerName.includes('khalti')) {
            return {
                type: 'image',
                // Using a public URL for Khalti icon
                source: { uri: 'https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/082021/khalti_logo.png' },
                color: '#5C2D91'
            };
        }
        // Cash
        if (lowerName.includes('cash') || type === 'cash') {
            return {
                type: 'icon',
                name: 'cash',
                color: '#10B981'
            };
        }
        // Bank
        if (type === 'bank' || lowerName.includes('bank')) {
            return {
                type: 'icon',
                name: 'bank',
                color: '#3B82F6'
            };
        }
        // Default
        return {
            type: 'icon',
            name: 'wallet',
            color: '#2DD4BF'
        };
    };

    const renderWalletItem = (wallet) => {
        const visuals = getWalletVisuals(wallet.name, wallet.type);

        return (
            <TouchableOpacity
                key={wallet.id}
                className="bg-surface-glass border border-white/5 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/5 mb-3"
            >
                <View className="flex-row items-center gap-4">
                    <View
                        className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg overflow-hidden bg-surface-dark border border-white/10 relative"
                        style={{ borderColor: visuals.color + '40' }}
                    >
                        {visuals.type === 'image' ? (
                            <Image
                                source={visuals.source}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <MaterialCommunityIcons name={visuals.name} size={24} color={visuals.color} />
                        )}
                    </View>
                    <View>
                        <Text className="text-sm font-bold text-white mb-0.5 font-display">{wallet.name}</Text>
                        <Text className="text-[10px] text-text-muted font-mono tracking-wide">
                            {wallet.identifier || wallet.type}
                        </Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-sm font-bold text-white font-mono">NPR {parseFloat(wallet.balance).toLocaleString()}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-background-dark relative">
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center justify-between border-b border-white/5 bg-background-dark/95">
                <Text className="text-2xl font-bold text-white font-display">My Wallets</Text>

            </View>

            <ScrollView
                className="flex-1 px-5 py-6 space-y-6"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2DD4BF" />}
            >

                {/* Balance Card */}
                <View className="rounded-3xl p-6 relative overflow-hidden bg-surface-glass border border-white/5 shadow-glass mb-6">
                    <View className="absolute right-[-20] top-[-20] w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                    <View className="relative z-10">
                        <Text className="text-xs text-text-muted font-medium uppercase tracking-wider mb-2 font-body">Total Balance</Text>
                        <Text className="text-4xl font-bold text-white font-mono tracking-tight">NPR {totalBalance}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mb-8">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('LendBorrow')}
                        className="flex-1 bg-surface-glass border border-white/5 p-3 rounded-2xl items-center justify-center gap-2 active:scale-95 space-y-2">
                        <View className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 items-center justify-center">
                            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#2DD4BF" />
                        </View>
                        <Text className="text-[11px] font-medium text-text-muted font-body">Lend/Borrow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setCreateWalletVisible(true)}
                        className="flex-1 bg-surface-glass border border-white/5 p-3 rounded-2xl items-center justify-center gap-2 active:scale-95 space-y-2">
                        <View className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 items-center justify-center">
                            <MaterialCommunityIcons name="wallet-plus" size={20} color="#2DD4BF" />
                        </View>
                        <Text className="text-[11px] font-medium text-text-muted font-body">New Wallet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setAddFundsVisible(true)}
                        className="flex-1 bg-surface-glass border border-white/5 p-3 rounded-2xl items-center justify-center gap-2 active:scale-95 space-y-2">
                        <View className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 items-center justify-center">
                            <MaterialCommunityIcons name="credit-card-plus" size={20} color="#2DD4BF" />
                        </View>
                        <Text className="text-[11px] font-medium text-text-muted font-body">Add Funds</Text>
                    </TouchableOpacity>
                </View>

                {/* Accounts Section */}
                <View className="space-y-4 mb-20">
                    <View className="flex-row items-center justify-between px-1 mb-2">
                        <Text className="text-lg font-bold text-white tracking-tight font-display">Accounts</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator color="#2DD4BF" />
                    ) : wallets.length > 0 ? (
                        wallets.map(renderWalletItem)
                    ) : (
                        <View className="items-center py-6">
                            <Text className="text-text-muted">No wallets found. Create one to get started.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Add Funds Modal */}
            <Modal
                visible={addFundsVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAddFundsVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-background-dark rounded-t-3xl p-6 border-t border-white/10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white font-display">Add Funds</Text>
                            <TouchableOpacity onPress={() => setAddFundsVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4 mb-6">
                            {/* Wallet Selection */}
                            <View>
                                <Text className="text-text-muted text-xs uppercase mb-2 ml-1">Select Wallet</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                    {wallets.map(w => (
                                        <TouchableOpacity
                                            key={w.id}
                                            onPress={() => setSelectedWalletId(w.id)}
                                            className={`p-3 rounded-xl border ${selectedWalletId === w.id ? 'bg-accent/20 border-accent' : 'bg-surface-glass border-white/10'}`}
                                        >
                                            <Text className={`text-xs font-bold ${selectedWalletId === w.id ? 'text-accent' : 'text-text-muted'}`}>{w.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Category Selection (Simplified) */}
                            <View>
                                <Text className="text-text-muted text-xs uppercase mb-2 ml-1">Source / Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                    {categories.map(c => (
                                        <TouchableOpacity
                                            key={c.id}
                                            onPress={() => setSelectedCategoryId(c.id)}
                                            className={`p-3 rounded-xl border ${selectedCategoryId === c.id ? 'bg-accent/20 border-accent' : 'bg-surface-glass border-white/10'}`}
                                        >
                                            <Text className={`text-xs font-bold ${selectedCategoryId === c.id ? 'text-accent' : 'text-text-muted'}`}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View>
                                <Text className="text-text-muted text-xs uppercase mb-2 ml-1">Amount (NPR)</Text>
                                <TextInput
                                    className="bg-surface-glass border border-white/10 text-white p-4 rounded-xl font-mono text-lg"
                                    placeholder="0.00"
                                    placeholderTextColor="#52525B"
                                    keyboardType="numeric"
                                    value={fundAmount}
                                    onChangeText={setFundAmount}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleAddFunds}
                            disabled={submittingFund}
                            className="w-full bg-accent py-4 rounded-2xl items-center justify-center"
                        >
                            {submittingFund ? <ActivityIndicator color="#18181B" /> : <Text className="text-[#18181B] font-bold text-lg">Add Funds</Text>}
                        </TouchableOpacity>
                        <View className="h-8" />
                    </View>
                </View>
            </Modal>

            {/* Create Wallet Modal */}
            <Modal
                visible={createWalletVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCreateWalletVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-background-dark rounded-t-3xl p-6 border-t border-white/10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white font-display">Create New Wallet</Text>
                            <TouchableOpacity onPress={() => setCreateWalletVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4 mb-6">
                            <TextInput
                                className="bg-surface-glass border border-white/10 text-white p-4 rounded-xl font-body"
                                placeholder="Wallet Name (e.g. Nabil Bank)"
                                placeholderTextColor="#52525B"
                                value={newWalletName}
                                onChangeText={setNewWalletName}
                            />
                            <TextInput
                                className="bg-surface-glass border border-white/10 text-white p-4 rounded-xl font-body"
                                placeholder="Identifier/ID (Optional)"
                                placeholderTextColor="#52525B"
                                value={newWalletIdentifier}
                                onChangeText={setNewWalletIdentifier}
                            />
                            {/* Type Selection */}
                            <View className="flex-row gap-2 mt-2">
                                {['digital', 'bank', 'cash'].map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setNewWalletType(type)}
                                        className={`flex-1 p-2 rounded-lg items-center justify-center border ${newWalletType === type ? 'bg-accent/20 border-accent' : 'bg-surface-glass border-white/10'}`}
                                    >
                                        <Text className={`text-[10px] uppercase font-bold ${newWalletType === type ? 'text-accent' : 'text-text-muted'}`}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleCreateWallet}
                            disabled={submittingWallet}
                            className="w-full bg-accent py-4 rounded-2xl items-center justify-center"
                        >
                            {submittingWallet ? <ActivityIndicator color="#18181B" /> : <Text className="text-[#18181B] font-bold text-lg">Create Wallet</Text>}
                        </TouchableOpacity>
                        <View className="h-8" />
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default WalletScreen;
