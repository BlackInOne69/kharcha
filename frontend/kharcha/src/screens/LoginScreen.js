import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Your current API Base URL

// Reusable Input Component (Moved outside to prevent focus loss)
const GlassInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, isPassword, showPassword, togglePassword }) => (
  <View className="mb-4">
    <View className="relative">
      <View className="absolute inset-y-0 left-0 pl-4 flex items-center justify-center pointer-events-none z-10">
        <MaterialCommunityIcons name={icon} size={20} color="#A1A1AA" />
      </View>
      <TextInput
        className="w-full pl-12 pr-12 py-4 bg-[#18181B] border border-white/10 rounded-2xl text-white font-body placeholder:text-gray-600 focus:border-[#2DD4BF] focus:bg-[#27272A]"
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        selectionColor="#2DD4BF"
        style={{ fontSize: 16 }}
      />
      {isPassword && (
        <TouchableOpacity
          className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center"
          onPress={togglePassword}
        >
          <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={20} color="#52525B" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);

  const [isLoginMode, setIsLoginMode] = useState(true);

  // Animation for mode switch
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleMode = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setIsLoginMode(!isLoginMode);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhoneNumber, setSignupPhoneNumber] = useState('');
  const [signupProfileImage, setSignupProfileImage] = useState(null);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is needed to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSignupProfileImage(result.assets[0].uri);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter both username/email and password.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(e => e.detail || JSON.stringify(e)).join('\n');
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            errorMessage = Object.values(errorData).flat().join('\n');
          }
        } catch (jsonError) {
          // Fallback
        }
        Alert.alert('Login failed', errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLoading(false);

      if (data.details) {
        login(
          data.access,
          data.details.username || loginEmail,
          data.details.email || '',
          data.details.image || null,
          data.details.id
        );
        if (data.refresh) {
          await AsyncStorage.setItem('refresh_token', data.refresh);
        }
      } else {
        Alert.alert('Error', 'Login failed: Access token not received.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Network error. Please check your connection.');
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== signupConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!signupUsername || !signupEmail || !signupPassword || !signupFirstName || !signupLastName || !signupPhoneNumber) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', signupFirstName);
      formData.append('last_name', signupLastName);
      formData.append('username', signupUsername);
      formData.append('email', signupEmail);
      formData.append('password', signupPassword);
      formData.append('phone_number', signupPhoneNumber);

      if (signupProfileImage) {
        const filename = signupProfileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('profile_image', { uri: signupProfileImage, name: filename, type });
      }

      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setLoading(false);

      if (response.status === 201) {
        Alert.alert('Success', 'Account created successfully! Please log in.');
        toggleMode();
        // Clear signup form
        setSignupFirstName('');
        setSignupLastName('');
        setSignupUsername('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setSignupPhoneNumber('');
        setSignupProfileImage(null);
      } else {
        let errorMessage = 'Registration failed.';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(e => e.detail || JSON.stringify(e)).join('\n');
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          errorMessage = Object.values(data).flat().join('\n');
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Network error.');
    }
  };

  return (
    <View className="flex-1 bg-background-dark relative">
      {/* Background Blobs - Static visual elements */}
      <View className="absolute top-[-50] right-[-50] w-96 h-96 bg-[#0D9488] opacity-10 rounded-full blur-[80px]" />
      <View className="absolute bottom-[-50] left-[-50] w-80 h-80 bg-[#2DD4BF] opacity-5 rounded-full blur-[80px]" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, width: '100%', maxWidth: 400, alignSelf: 'center' }}>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-bold text-white mb-2 font-display">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text className="text-text-muted text-sm leading-relaxed font-body">
                {isLoginMode
                  ? 'Please authenticate to access your financial data.'
                  : 'Initialize your secure financial environment locally on this device.'}
              </Text>
            </View>

            {/* Form Fields */}
            <View>
              {isLoginMode ? (
                // Login Form
                <>
                  <View className="mb-2">
                    <Text className="text-xs font-bold text-text-muted ml-1 mb-2 uppercase tracking-wide">Email / Username</Text>
                    <GlassInput
                      icon="email-outline"
                      placeholder="user@example.com"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                    />
                  </View>

                  <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-2 ml-1">
                      <Text className="text-xs font-bold text-text-muted uppercase tracking-wide">Password</Text>
                      <TouchableOpacity>
                        <Text className="text-[10px] text-accent font-mono">Forgot_Password?</Text>
                      </TouchableOpacity>
                    </View>
                    <GlassInput
                      icon="lock-outline"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      isPassword
                      showPassword={showLoginPassword}
                      togglePassword={() => setShowLoginPassword(!showLoginPassword)}
                    />
                  </View>
                </>
              ) : (
                // Signup Form
                <View>
                  <View className="flex-row gap-2 mb-2">
                    <View className="flex-1">
                      <GlassInput
                        icon="account-outline"
                        placeholder="First Name"
                        value={signupFirstName}
                        onChangeText={setSignupFirstName}
                      />
                    </View>
                    <View className="flex-1">
                      <GlassInput
                        icon="account-outline"
                        placeholder="Last Name"
                        value={signupLastName}
                        onChangeText={setSignupLastName}
                      />
                    </View>
                  </View>

                  <GlassInput icon="at" placeholder="Username" value={signupUsername} onChangeText={setSignupUsername} />
                  <GlassInput icon="email-outline" placeholder="Email Address" value={signupEmail} onChangeText={setSignupEmail} />
                  <GlassInput icon="phone-outline" placeholder="Phone Number" value={signupPhoneNumber} onChangeText={setSignupPhoneNumber} />

                  <GlassInput
                    icon="lock-outline"
                    placeholder="Password"
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    secureTextEntry={!showSignupPassword}
                    isPassword
                    showPassword={showSignupPassword}
                    togglePassword={() => setShowSignupPassword(!showSignupPassword)}
                  />
                  <GlassInput
                    icon="lock-check-outline"
                    placeholder="Confirm Password"
                    value={signupConfirmPassword}
                    onChangeText={setSignupConfirmPassword}
                    secureTextEntry={true}
                  />

                  {/* Profile Image Picker */}
                  <TouchableOpacity
                    onPress={pickImage}
                    className="flex-row items-center justify-center p-4 bg-[#18181B] border border-white/10 border-dashed rounded-2xl mb-4"
                  >
                    {signupProfileImage ? (
                      <>
                        <Image source={{ uri: signupProfileImage }} className="w-10 h-10 rounded-full mr-3" />
                        <Text className="text-white text-sm font-bold">Image Selected</Text>
                      </>
                    ) : (
                      <>
                        <MaterialCommunityIcons name="camera-plus-outline" size={24} color="#A1A1AA" className="mr-2" />
                        <Text className="text-text-muted text-sm ml-2">Upload Profile Picture</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={isLoginMode ? handleLogin : handleSignup}
                disabled={loading}
                className="w-full bg-[#2DD4BF] py-4 rounded-2xl shadow-glow active:scale-[0.98] flex-row justify-center items-center mt-2 mb-8"
                style={{
                  shadowColor: '#2DD4BF',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  elevation: 5
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#18181B" />
                ) : (
                  <>
                    <Text className="text-[#18181B] font-bold text-lg mr-2 font-display">
                      {isLoginMode ? 'Sign In' : 'Register'}
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#18181B" />
                  </>
                )}
              </TouchableOpacity>

              {/* Footer toggle area */}
              <View className="flex-row justify-center items-center">
                <Text className="text-text-muted text-sm font-body">
                  {isLoginMode ? "New user? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text className="text-accent font-bold text-sm font-body">
                    {isLoginMode ? "Create account" : "Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer space */}
        <View className="pb-8" />
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
