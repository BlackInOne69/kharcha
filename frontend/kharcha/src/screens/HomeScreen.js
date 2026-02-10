import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { fetchEvents } from '../api/eventApi';
import { fetchLendLogs } from '../api/lendApi';
import { listExpenses } from '../api/expenseApi';
import { useContext, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View, Image, Animated } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const API_BASE_URL = 'http://127.0.0.1:8000';
const screenWidth = Dimensions.get('window').width;

// Helper component for the Custom Header
const Header = ({ userName }) => (
    <View className="pt-14 pb-4 px-6 flex-col justify-between border-b border-white/5 bg-background-dark/80 backdrop-blur-xl z-30">
        <View className="flex-row items-center justify-between">
            <View>
                <Text className="text-3xl font-bold tracking-tight text-white font-display">Namaste, {userName}</Text>
            </View>
            <TouchableOpacity className="relative p-2.5 rounded-xl bg-surface-dark border border-white/5 hover:bg-white/10 items-center justify-center">
                <MaterialIcons name="notifications" size={24} color="#A1A1AA" />
                <View className="absolute top-2.5 right-3 flex h-2 w-2">
                    <View className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <View className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </View>
            </TouchableOpacity>
        </View>
    </View>
);

const HomeScreen = () => {
    const { isDarkMode } = useContext(ThemeContext);
    const { userName } = useContext(AuthContext);
    const isFocused = useIsFocused();
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();

    // Data States
    const [expensesTotal, setExpensesTotal] = useState('0');
    const [budgets, setBudgets] = useState([]);
    const [events, setEvents] = useState([]);
    const [lendLogs, setLendLogs] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Animation Logic
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerHeight = 120; // Estimated height of header
    const diffClamp = Animated.diffClamp(scrollY, 0, headerHeight);
    const translateY = diffClamp.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [0, -headerHeight],
    });

    // Fetch Logic
    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/expense/report/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            const data = await response.json();
            setExpensesTotal(data?.total_expenses ?? '0');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadEvents = async () => {
        try {
            const data = await fetchEvents();
            setEvents(data.results || data);
        } catch (e) {
            setEvents([]);
        }
    };

    const loadLendLogs = async () => {
        try {
            const data = await fetchLendLogs();
            setLendLogs(data.results || data);
        } catch (e) {
            setLendLogs([]);
        }
    };

    const fetchBudgets = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/budget/budgets/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            const data = await response.json();
            if (response.ok && data.results) setBudgets(data.results);
        } catch (e) {
            setBudgets([]);
        }
    };

    const fetchLatestTransactions = async () => {
        try {
            const data = await listExpenses({ limit: 5 });
            setTransactions(data.results || data || []);
        } catch (e) {
            console.error("Failed to fetch transactions", e);
        }
    };

    const getCategoryIcon = (categoryName) => {
        const name = categoryName?.toLowerCase() || '';
        if (name.includes('food') || name.includes('dining')) return 'restaurant';
        if (name.includes('shop') || name.includes('grocer')) return 'shopping-cart';
        if (name.includes('transport') || name.includes('directions-bus')) return 'directions-bus';
        if (name.includes('house') || name.includes('rent')) return 'home';
        if (name.includes('entertain')) return 'movie';
        if (name.includes('health')) return 'local-hospital';
        return 'receipt';
    };

    const getCategoryColor = (categoryName) => {
        const name = categoryName?.toLowerCase() || '';
        if (name.includes('food')) return '#FB923C'; // Orange
        if (name.includes('shop')) return '#34D399'; // Emerald
        if (name.includes('transport')) return '#60A5FA'; // Blue
        if (name.includes('house')) return '#A855F7'; // Purple
        return '#A1A1AA'; // Gray
    };

    useEffect(() => {
        if (isFocused) {
            fetchDashboardData();
            loadEvents();
            loadLendLogs();
            fetchBudgets();
            fetchLatestTransactions();
        }
    }, [isFocused]);

    // UI Helpers
    // SVG Circular Progress
    const CircularProgress = ({ total, currency = "NPR" }) => {
        return (
            <View className="relative w-56 h-56 items-center justify-center mb-6 mt-2">
                <Svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Defs>
                        <SvgGradient id="gradientPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#0D9488" stopOpacity="1" />
                        </SvgGradient>
                        <SvgGradient id="gradientSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#D97706" stopOpacity="1" />
                        </SvgGradient>
                    </Defs>
                    {/* Background Circle */}
                    <Circle cx="50" cy="50" r="42" stroke="#27272A" strokeWidth="6" fill="transparent" />
                    {/* Progress Circle Primary */}
                    <Circle
                        cx="50" cy="50" r="42"
                        stroke="url(#gradientPrimary)"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={264} // 2 * PI * 42
                        strokeDashoffset={66} // 75% filled
                        strokeLinecap="round"
                    />
                    {/* Progress Circle Secondary (Wants) */}
                    <Circle
                        cx="50" cy="50" r="42"
                        stroke="url(#gradientSecondary)"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={264}
                        strokeDashoffset={230} // 25% filled roughly
                        strokeLinecap="round"
                        opacity={0.9}
                    />
                </Svg>
                <View className="absolute inset-0 items-center justify-center">
                    <Text className="text-text-muted text-[10px] uppercase tracking-[0.2em] font-bold mb-1 font-display">Total Spent</Text>
                    <Text className="text-4xl font-bold text-white tracking-tighter font-mono-custom">
                        {parseInt(total) > 1000 ? `${(parseInt(total) / 1000).toFixed(0)}k` : total}
                        <Text className="text-lg font-medium text-text-muted ml-1 font-display"> {currency}</Text>
                    </Text>
                </View>
            </View>
        );
    };

    const BudgetCard = ({ budget }) => {
        const spent = budget?.total_expense || 0;
        const limit = budget?.amount || budget?.allowed_expense || 70000;
        const usedPercent = limit > 0 ? Math.min((spent / limit) * 100, 100).toFixed(0) : 0;
        const remaining = limit - spent;

        return (
            <View className="glass-panel rounded-2xl shadow-lg p-5 bg-surface-glass border border-white/5 mb-6">
                <View className="flex-row justify-between items-end mb-3">
                    <View>
                        <Text className="text-lg font-bold text-white tracking-tight font-display">Monthly Budget</Text>
                        <Text className="text-xs text-text-muted mt-1 font-medium font-body">
                            Remaining: <Text className="text-white font-mono-custom">NPR {remaining.toLocaleString()}</Text>
                        </Text>
                    </View>
                    <View className="bg-primary/20 px-2 py-1 rounded border border-primary/20 shadow-glow">
                        <Text className="text-accent font-bold text-xs font-mono-custom">{usedPercent}% Used</Text>
                    </View>
                </View>

                <View className="w-full bg-surface-dark rounded-full h-2 overflow-hidden relative mb-3">
                    <View className="absolute inset-0 bg-white/5 w-full h-full" />
                    <View
                        className="bg-accent h-2 rounded-full shadow-glow"
                        style={{ width: `${usedPercent}%` }}
                    />
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-[10px] text-text-muted uppercase tracking-wider font-bold font-display">
                        Limit: <Text className="font-mono-custom">{parseInt(limit / 1000)}k NPR</Text>
                    </Text>
                    <View className="flex-row items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                        <MaterialIcons name="schedule" size={12} color="#A1A1AA" />
                        <Text className="text-[10px] text-text-muted font-body">Resets in 12 days</Text>
                    </View>
                </View>
            </View>
        );
    };

    const TransactionItem = ({ icon, color, bg, title, subtitle, amount, isPositive }) => (
        <View className="group flex-row items-center gap-4 bg-surface-dark/40 p-4 rounded-2xl border border-white/5 mb-3 shadow-sm">
            <View className={`w-10 h-10 rounded-xl items-center justify-center border border-${color}-500/20`} style={{ backgroundColor: bg }}>
                <MaterialIcons name={icon} size={20} color={color} />
            </View>
            <View className="flex-1 min-w-0">
                <Text className="text-white font-bold truncate text-sm font-display">{title}</Text>
                <Text className="text-xs text-text-muted truncate mt-0.5 font-medium font-body">{subtitle}</Text>
            </View>
            <View className="shrink-0">
                <Text className={`${isPositive ? 'text-accent' : 'text-white'} font-bold font-mono-custom tracking-tight`}>
                    {isPositive ? '+' : '-'}{amount} NPR
                </Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background-dark">
            {/* Animated Header */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    transform: [{ translateY }]
                }}
            >
                <Header userName={userName || "Aarav"} />
            </Animated.View>

            <Animated.ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingTop: 140, paddingBottom: 110 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Main Circular Progress Section */}
                <View className="glass-panel rounded-3xl p-6 items-center justify-center relative overflow-hidden shadow-glass mb-6 bg-surface-glass border border-white/5">
                    {/* Background Glows */}
                    <View className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20" />
                    <View className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[60px] -ml-16 -mb-16" />

                    <CircularProgress total={expensesTotal} />

                    <View className="flex-row justify-between w-full gap-4">
                        <View className="flex-1 flex-row items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                            <View className="w-2 h-8 rounded-full bg-accent" />
                            <View className="flex-col">
                                <Text className="text-xs text-text-muted font-medium uppercase tracking-wider font-display">Needs</Text>
                                <Text className="text-sm text-white font-bold font-mono-custom">75%</Text>
                            </View>
                        </View>
                        <View className="flex-1 flex-row items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                            <View className="w-2 h-8 rounded-full bg-amber-500" />
                            <View className="flex-col">
                                <Text className="text-xs text-text-muted font-medium uppercase tracking-wider font-display">Wants</Text>
                                <Text className="text-sm text-white font-bold font-mono-custom">25%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Monthly Budget Section */}
                <BudgetCard budget={budgets.find(b => !b.category) || budgets[0]} />

                {/* Transactions Section */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-5">
                        <Text className="text-xl font-bold text-white tracking-tight font-display">Transactions</Text>
                        <TouchableOpacity
                            className="flex-row items-center gap-1"
                            onPress={() => navigation.navigate('Stats')}
                        >
                            <Text className="text-accent text-xs font-bold uppercase tracking-wider font-display">See All</Text>
                            <MaterialIcons name="chevron-right" size={16} color="#2DD4BF" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-col gap-3">
                        {transactions.length > 0 ? transactions.map((t, i) => {
                            const icon = getCategoryIcon(t.category?.name);
                            const color = getCategoryColor(t.category?.name);
                            return (
                                <TransactionItem
                                    key={t.id || i}
                                    icon={icon}
                                    color={color}
                                    bg={`${color}20`} // 20 hex = 12% opacity roughly, or use rgba
                                    title={t.merchant || t.description || t.category?.name || "Expense"}
                                    subtitle={`${t.category?.name || 'Uncategorized'} • ${t.date}`}
                                    amount={Number(t.amount).toLocaleString()}
                                    isPositive={false}
                                />
                            );
                        }) : (
                            <View className="items-center py-4 bg-surface-glass border border-white/5 rounded-2xl">
                                <MaterialIcons name="receipt-long" size={32} color="#52525B" />
                                <Text className="text-text-muted mt-2 font-body">No recent transactions</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

export default HomeScreen;