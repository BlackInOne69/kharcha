import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useState } from 'react';
import { Image, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { fetchUnreadCount } from '../api/notificationApi';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const CustomHeader = ({
    title,
    subtitle,
    showBackButton = false,
    showProfileIcon = false,
    isSmall = false,
    showTotalBalance = false,
    totalBalance = 'रू0',
    onFilterPress,
    onChatbotPress
}) => {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(ThemeContext);
    const { userName, profileImage } = useContext(AuthContext);
    const displayName = userName || 'User';
    const userInitial = displayName.charAt(0).toUpperCase();

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        let intervalId;
        const loadUnreadCount = async () => {
            setNotifLoading(true);
            try {
                const data = await fetchUnreadCount();
                if (mounted) setUnreadCount(data.unread_count || 0);
            } catch {
                if (mounted) setUnreadCount(0);
            } finally {
                if (mounted) setNotifLoading(false);
            }
        };
        loadUnreadCount();
        // Poll every 10 seconds
        intervalId = setInterval(loadUnreadCount, 10000);
        // Listen for notificationRead event to update unread count
        const handleNotificationRead = async (e) => {
            await loadUnreadCount();
        };
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('notificationRead', handleNotificationRead);
        }
        return () => {
            mounted = false;
            if (intervalId) clearInterval(intervalId);
            if (typeof window !== 'undefined' && window.removeEventListener) {
                window.removeEventListener('notificationRead', handleNotificationRead);
            }
        };
    }, []);

    // Always refresh notifications when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            const refresh = async () => {
                setNotifLoading(true);
                try {
                    const data = await fetchUnreadCount();
                    // Corrected: Use data.unread_count to get the correct value
                    if (isActive) setUnreadCount(data.unread_count || 0);
                } catch {
                    if (isActive) setUnreadCount(0);
                } finally {
                    if (isActive) setNotifLoading(false);
                }
            };
            refresh();
            return () => { isActive = false; };
        }, [])
    );

    const gradientColors = isDarkMode ? ['#4B0082', '#6A0DAD'] : ['#8A2BE2', '#640fa1ff'];
    const headerContainerClass = isSmall ? 'pb-4' : 'pb-6';

    const [chatbotHover, setChatbotHover] = useState(false);
    return (
        <View className={`bg-background-dark/80 backdrop-blur-xl border-b border-white/5 z-30 ${headerContainerClass} ${Platform.OS === 'android' ? 'pt-8' : ''}`}>
            <SafeAreaView>
                <View className="flex-row justify-between items-center px-6">
                    <View className="flex-row items-center">
                        {showBackButton && (
                            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 rounded-full bg-surface-dark/50 border border-white/10">
                                <MaterialCommunityIcons name="arrow-left" size={20} color="#2DD4BF" />
                            </TouchableOpacity>
                        )}
                        <View>
                            <Text className="text-white text-lg font-medium opacity-80 font-display">{title}</Text>
                            {subtitle && <Text className="text-white text-2xl font-bold mt-1 font-display">{subtitle}</Text>}
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {onFilterPress && (
                            <TouchableOpacity onPress={onFilterPress} className="w-10 h-10 rounded-xl bg-surface-dark border border-white/5 justify-center items-center mr-2">
                                <MaterialCommunityIcons name="filter-variant" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        )}
                        {/* Notification Icon */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Notifications')}
                            className="w-10 h-10 rounded-xl bg-surface-dark border border-white/5 justify-center items-center mr-2 relative"
                        >
                            <MaterialCommunityIcons name="bell-outline" size={20} color="#A1A1AA" />
                            {notifLoading ? null : unreadCount > 0 && (
                                <View className="absolute top-2 right-2 flex h-2 w-2">
                                    <View className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                                    <View className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </View>
                            )}
                        </TouchableOpacity>
                        {showProfileIcon && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Profile')}
                                className="w-10 h-10 rounded-xl bg-surface-dark border border-white/5 justify-center items-center overflow-hidden"
                            >
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={{ width: 40, height: 40, borderRadius: 12 }} />
                                ) : (
                                    <View className="w-full h-full items-center justify-center bg-primary/20">
                                        <Text className="text-accent font-bold text-lg font-mono-custom">{userInitial}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {showTotalBalance && !isSmall && (
                    <View className="mt-4 px-6">
                        <Text className="text-text-muted text-xs uppercase tracking-wider font-bold mb-1 font-display">Total Balance</Text>
                        <Text className="text-white text-4xl font-bold font-mono-custom">{totalBalance}</Text>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

export default CustomHeader;