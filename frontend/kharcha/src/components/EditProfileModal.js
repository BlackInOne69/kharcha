// kharcha/src/components/EditProfileModal.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
// Updated imports: updatePassword and uploadProfileImage from apiService
import { updatePassword, uploadProfileImage } from '../api/apiService';

const EditProfileModal = ({ isVisible, onClose }) => {
    const {
        userName,
        fullName: authFullName,
        profileImage: authProfileImage,
        id: userId, // userId is now consistently available from AuthContext
        updateProfile: authUpdateProfile, // Function to update username/full name from AuthContext
        fetchUserProfile, // Function to refresh AuthContext data after external updates (like image upload)
    } = useContext(AuthContext);

    const { colors, isDarkMode } = useContext(ThemeContext);

    const [newUsername, setNewUsername] = useState(userName);
    const [newFullName, setNewFullName] = useState(authFullName);
    const [currentLocalProfileImage, setCurrentLocalProfileImage] = useState(authProfileImage);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false); // Local loading for modal actions
    const [error, setError] = useState(null); // Local error for modal actions

    // Effect to reset form fields and errors when modal opens or auth data changes
    useEffect(() => {
        if (isVisible) {
            setNewUsername(userName);
            setNewFullName(authFullName);
            setCurrentLocalProfileImage(authProfileImage);
            setPasswordFieldsToDefault();
            setError(null); // Clear errors
        }
    }, [isVisible, userName, authFullName, authProfileImage]);

    // Helper to reset password fields
    const setPasswordFieldsToDefault = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };

    // Validation Functions
    const validateProfileForm = () => {
        if (!newUsername || !newFullName) {
            setError('Username and Full Name are required.');
            return false;
        }
        return true;
    };

    const validatePasswordForm = () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError('All password fields are required.');
            return false;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return false;
        }
        if (newPassword !== confirmNewPassword) {
            setError('New password and confirm password do not match.');
            return false;
        }
        return true;
    };

    // Handlers for API Calls
    const handleUpdateProfile = async () => {
        if (!validateProfileForm()) return;
        setIsLoading(true);
        setError(null);
        try {
            await authUpdateProfile({ // Call updateProfile from AuthContext
                username: newUsername,
                first_name: newFullName.split(' ')[0] || '', // Assuming Django needs first_name/last_name
                last_name: newFullName.split(' ').slice(1).join(' ') || '',
            });
            Alert.alert('Success', 'Profile updated successfully!');
            onClose(); // Close modal on success
        } catch (err) {
            const errorMessage = err.response?.data?.detail
                || err.response?.data?.username?.[0]
                || err.message
                || 'Failed to update profile. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!validatePasswordForm()) return;
        setIsLoading(true);
        setError(null);
        try {
            await updatePassword({ // Call updatePassword from apiService
                old_password: currentPassword,
                new_password1: newPassword,
                new_password2: confirmNewPassword,
            });
            Alert.alert('Success', 'Password updated successfully!');
            setPasswordFieldsToDefault(); // Clear password fields on success
            onClose(); // Close modal on success
        } catch (err) {
            const errorMessage = err.response?.data?.detail
                || err.response?.data?.old_password?.[0]
                || err.response?.data?.new_password1?.[0]
                || err.message
                || 'Failed to change password. Please check your current password.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async (source) => {
        let result;
        const options = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square crop
            quality: 0.7, // Reduce quality for faster upload
        };

        if (source === 'camera') {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant camera access to take a profile picture.');
                return;
            }
            result = await ImagePicker.launchCameraAsync(options);
        } else { // 'gallery'
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant media library access to pick a profile picture.');
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled && result.assets && result.assets.length > 0) {
            if (!userId) { // Ensure userId is available before upload
                Alert.alert('Error', 'User ID is missing. Cannot upload profile picture.');
                return;
            }
            const asset = result.assets[0];

            // Only update local state first
            setCurrentLocalProfileImage(asset.uri);

            // Create form data properly
            const formData = new FormData();
            formData.append('profile_image', {
                uri: asset.uri,
                name: 'profile_image.jpg',
                type: 'image/jpeg',
            });

            setIsLoading(true);
            setError(null);

            try {
                // We need to pass FormData, but the apiService.js uploadProfileImage function 
                // might be expecting just an object if it handles FormData creation internally.
                // Let's assume for now we need to pass the file object as the api logic suggests

                // Based on previous code:
                const imageData = {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    fileName: asset.fileName || 'profile.jpg',
                };

                await uploadProfileImage(userId, imageData); // Call uploadProfileImage from apiService
                await fetchUserProfile(); // Refresh AuthContext to get the new image URL from backend
                Alert.alert('Success', 'Profile picture updated!');
            } catch (err) {
                setError('Failed to upload profile picture. Please try again.');
                console.error('Image upload error:', err.response?.data || err.message);
                setCurrentLocalProfileImage(authProfileImage); // Revert UI on error
            } finally {
                setIsLoading(false);
            }
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            "Change Profile Picture",
            "Choose a source",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Gallery", onPress: () => pickImage('gallery') },
                { text: "Camera", onPress: () => pickImage('camera') },
            ]
        );
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
                    <View className="bg-background-dark rounded-t-3xl border-t border-white/10 h-[90%] w-full overflow-hidden">

                        {/* Header */}
                        <View className="flex-row items-center justify-between p-6 border-b border-white/5 bg-surface-glass backdrop-blur-xl">
                            <Text className="text-xl font-bold text-white font-display">Edit Profile</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-surface-dark/50 border border-white/10">
                                <MaterialCommunityIcons name="close" size={20} color="#A1A1AA" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                            className="flex-1"
                        >
                            {error ? (
                                <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                                    <Text className="text-red-400 font-body text-center">{error}</Text>
                                </View>
                            ) : null}

                            {/* Profile Picture Section */}
                            <View className="items-center mb-8">
                                <View className="relative">
                                    {currentLocalProfileImage ? (
                                        <View className="w-32 h-32 rounded-full border-4 border-surface-dark shadow-2xl overflow-hidden">
                                            <Image
                                                source={{ uri: currentLocalProfileImage }}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </View>
                                    ) : (
                                        <View className="w-32 h-32 rounded-full bg-surface-dark border-4 border-surface-glass items-center justify-center">
                                            <Text className="text-accent text-5xl font-bold font-mono-custom">
                                                {userName?.charAt(0).toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        onPress={showImagePickerOptions}
                                        className="absolute bottom-0 right-0 bg-primary p-3 rounded-2xl shadow-glow border-4 border-background-dark"
                                    >
                                        <MaterialCommunityIcons name="camera-plus" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Personal Information Fields */}
                            <View className="mb-8">
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-wider mb-4 font-display">Personal Information</Text>

                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-white text-sm font-medium mb-2 font-body ml-1">Username</Text>
                                        <View className="bg-surface-glass border border-white/10 rounded-xl px-4 py-3 flex-row items-center">
                                            <MaterialCommunityIcons name="account-outline" size={20} color="#A1A1AA" />
                                            <TextInput
                                                className="flex-1 ml-3 text-white font-body text-base"
                                                placeholder="Username"
                                                placeholderTextColor="#52525B"
                                                value={newUsername}
                                                onChangeText={setNewUsername}
                                                autoCapitalize="none"
                                                editable={!isLoading}
                                            />
                                        </View>
                                    </View>

                                    <View>
                                        <Text className="text-white text-sm font-medium mb-2 font-body ml-1">Full Name</Text>
                                        <View className="bg-surface-glass border border-white/10 rounded-xl px-4 py-3 flex-row items-center">
                                            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#A1A1AA" />
                                            <TextInput
                                                className="flex-1 ml-3 text-white font-body text-base"
                                                placeholder="Full Name"
                                                placeholderTextColor="#52525B"
                                                value={newFullName}
                                                onChangeText={setNewFullName}
                                                editable={!isLoading}
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleUpdateProfile}
                                        className={`bg-primary p-4 rounded-xl items-center shadow-glow mt-2 ${isLoading ? 'opacity-50' : ''}`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-bold text-lg font-display">Save Changes</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Change Password Section */}
                            <View>
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-wider mb-4 font-display">Change Password</Text>

                                <View className="space-y-4">
                                    <View className="bg-surface-glass border border-white/10 rounded-xl px-4 py-3 flex-row items-center">
                                        <MaterialCommunityIcons name="lock-outline" size={20} color="#A1A1AA" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white font-body text-base"
                                            placeholder="Current Password"
                                            placeholderTextColor="#52525B"
                                            secureTextEntry
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <View className="bg-surface-glass border border-white/10 rounded-xl px-4 py-3 flex-row items-center">
                                        <MaterialCommunityIcons name="lock-plus-outline" size={20} color="#A1A1AA" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white font-body text-base"
                                            placeholder="New Password (min 8 chars)"
                                            placeholderTextColor="#52525B"
                                            secureTextEntry
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <View className="bg-surface-glass border border-white/10 rounded-xl px-4 py-3 flex-row items-center">
                                        <MaterialCommunityIcons name="lock-check-outline" size={20} color="#A1A1AA" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white font-body text-base"
                                            placeholder="Confirm New Password"
                                            placeholderTextColor="#52525B"
                                            secureTextEntry
                                            value={confirmNewPassword}
                                            onChangeText={setConfirmNewPassword}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleChangePassword}
                                        className={`bg-surface-dark border border-primary/50 p-4 rounded-xl items-center mt-2 ${isLoading ? 'opacity-50' : ''}`}
                                        disabled={isLoading}
                                    >
                                        <Text className="text-primary font-bold text-lg font-display">Update Password</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default EditProfileModal;