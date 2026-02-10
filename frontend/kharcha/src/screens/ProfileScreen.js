// kharcha/src/screens/ProfileScreen.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import EditProfileModal from '../components/EditProfileModal';
import CustomHeader from '../components/CustomHeader';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
};

const MenuItem = ({ icon, title, onPress, showSwitch = false, value, onValueChange, color }) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={showSwitch}
        className="flex-row items-center p-4 mb-2 rounded-2xl bg-surface-glass border border-white/5"
    >
        <View className={`w-10 h-10 rounded-xl items-center justify-center bg-primary/10 mr-4`}>
            <MaterialCommunityIcons name={icon} size={22} color={color || "#2DD4BF"} />
        </View>
        <Text className="flex-1 text-base text-white font-body">{title}</Text>
        {showSwitch ? (
            <Switch
                trackColor={{ false: "#52525B", true: "#0D9488" }}
                thumbColor={value ? "#FFFFFF" : "#F4F4F5"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={onValueChange}
                value={value}
            />
        ) : (
            <MaterialCommunityIcons name="chevron-right" size={20} color="#52525B" />
        )}
    </TouchableOpacity>
);

const ProfileScreen = () => {
    const { isDarkMode, colors, toggleTheme } = useContext(ThemeContext);
    const { userName, fullName, userEmail, profileImage, logout, isLoading: authLoading, error: authError, fetchUserProfile, id } = useContext(AuthContext);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    // Fetch user profile on component mount
    useEffect(() => {
        // Only fetch if currently logged in and we have an ID
        if (id) {
            fetchUserProfile();
        }
    }, [id]); // Only re-fetch if the user ID changes (e.g. login/logout)

    // Show a full-screen loader only if AuthContext is loading initially and no ID is present
    if (authLoading && !id) {
        return (
            <View className="flex-1 justify-center items-center bg-background-dark">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-white font-body">Loading profile...</Text>
            </View>
        );
    }

    // Show an error screen if AuthContext has an error and no ID is present
    if (authError && !id) {
        return (
            <View className="flex-1 justify-center items-center bg-background-dark p-6">
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-400 text-lg mb-4 text-center mt-4 font-body">{authError}</Text>
                <TouchableOpacity onPress={fetchUserProfile} className="bg-primary p-4 rounded-xl px-8 shadow-glow">
                    <Text className="text-white font-bold font-body">Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background-dark">
            <CustomHeader title="Profile" showBackButton={true} showProfileIcon={false} />
            <ScrollView className="flex-1 px-6 pt-6">

                {/* Profile Card */}
                <View className="items-center mb-8">
                    <View className="relative">
                        {profileImage ? (
                            <View className="w-24 h-24 rounded-full border-2 border-accent shadow-glow overflow-hidden">
                                <Image source={{ uri: profileImage }} style={{ width: 92, height: 92 }} />
                            </View>
                        ) : (
                            <View className="w-24 h-24 rounded-full border-2 border-accent shadow-glow bg-surface-dark items-center justify-center">
                                <Text className="text-accent text-3xl font-bold font-mono-custom">{getInitial(fullName || userName)}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border border-background-dark"
                            onPress={() => setIsEditModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="pencil" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-2xl font-bold text-white mt-4 font-display">{fullName || userName}</Text>
                    <Text className="text-sm text-text-muted font-body">{userEmail}</Text>
                </View>

                {/* Account Settings Section */}
                <View className="mb-8">
                    <Text className="text-text-muted text-xs font-bold uppercase tracking-wider mb-4 font-display">Account Settings</Text>

                    {/* Dark/Light Mode Toggle */}
                    {/* <MenuItem 
                        icon={isDarkMode ? "weather-night" : "white-balance-sunny"}
                        title="Dark Mode"
                        showSwitch={true}
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                    /> */}

                    <MenuItem
                        icon="account-edit-outline"
                        title="Edit Profile"
                        onPress={() => setIsEditModalVisible(true)}
                    />

                    <MenuItem
                        icon="lock-reset"
                        title="Change Password"
                        onPress={() => setIsEditModalVisible(true)}
                    />

                    <MenuItem
                        icon="bell-ring-outline"
                        title="Notifications"
                        onPress={() => { }}
                    />
                </View>

                {/* Actions Section */}
                <View className="mb-24">
                    <Text className="text-text-muted text-xs font-bold uppercase tracking-wider mb-4 font-display">Actions</Text>

                    <MenuItem
                        icon="chart-box-outline"
                        title="Export Data"
                        onPress={() => { }}
                    />

                    <MenuItem
                        icon="logout"
                        title="Log Out"
                        onPress={logout}
                        color="#EF4444"
                    />
                </View>
            </ScrollView>

            {/* Edit Profile Modal Component */}
            <EditProfileModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
            />
        </View>
    );
};

export default ProfileScreen;
