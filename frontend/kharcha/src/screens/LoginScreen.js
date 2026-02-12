import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useContext, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDecay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated, // Renamed to avoid conflict with Reanimated's Animated
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GridMotionBackground from '../components/GridMotionBackground';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_BASE_URL = 'http://127.0.0.1:8000';

const GlassInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  isPassword,
  showPassword,
  togglePassword,
  isDarkMode,
  colors,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputBackground = isDarkMode ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.95)';
  const borderBase = isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)';
  const iconColor = isDarkMode ? '#A1A1AA' : '#6B7280';

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <View style={styles.inputLeftIcon}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: inputBackground,
              borderColor: isFocused ? (colors.accent || colors.primary) : borderBase,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.subtext}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          selectionColor={colors.accent || colors.primary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity style={styles.inputRightIcon} onPress={togglePassword}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const { login, register } = useContext(AuthContext);
  const { colors, isDarkMode, setScheme } = useContext(ThemeContext);
  const { width } = useWindowDimensions();

  // Background animation shared values
  const globalOffset = useSharedValue(0);
  const userDrag = useSharedValue(0);
  const isInteracting = useSharedValue(false);

  // Gesture handler for manual grid sliding
  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])  // Easier horizontal activation
    .failOffsetY([-50, 50])  // Allow more vertical drift before failing
    .onStart(() => {
      cancelAnimation(userDrag);
      isInteracting.value = true;
    })
    .onUpdate((e) => {
      userDrag.value -= e.changeX;
    })
    .onFinalize((e) => {
      isInteracting.value = false;
      userDrag.value = withDecay({
        velocity: -e.velocityX,
        deceleration: 0.997,
      });
    });

  const [isLoginMode, setIsLoginMode] = useState(true);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  const toggleMode = () => {
    RNAnimated.sequence([
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setIsLoginMode(!isLoginMode);
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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
      Alert.alert(
        'Permission required',
        'Permission to access media library is needed to upload a profile picture.'
      );
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
            errorMessage = errorData.errors.map((e) => e.detail || JSON.stringify(e)).join('\n');
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            errorMessage = Object.values(errorData).flat().join('\n');
          }
        } catch (_jsonError) {
          // Keep fallback error message.
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
    } catch (_error) {
      setLoading(false);
      Alert.alert('Error', 'Network error. Please check your connection.');
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== signupConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (
      !signupUsername ||
      !signupEmail ||
      !signupPassword ||
      !signupFirstName ||
      !signupLastName ||
      !signupPhoneNumber
    ) {
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
        const type = match ? `image/${match[1]}` : 'image';
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
          errorMessage = data.errors.map((e) => e.detail || JSON.stringify(e)).join('\n');
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          errorMessage = Object.values(data).flat().join('\n');
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (_error) {
      setLoading(false);
      Alert.alert('Error', 'Network error.');
    }
  };

  const horizontalPadding = width < 360 ? 16 : 24;
  const cardBackground = isDarkMode ? 'rgba(24,24,27,0.72)' : 'rgba(255,255,255,0.74)';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)';
  const pickerBackground = isDarkMode ? 'rgba(24,24,27,0.88)' : 'rgba(255,255,255,0.92)';
  const pickerBorder = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)';

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <GridMotionBackground
          isDarkMode={isDarkMode}
          colors={colors}
          globalOffset={globalOffset}
          userDrag={userDrag}
          isInteracting={isInteracting}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: horizontalPadding,
              paddingVertical: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            <RNAnimated.View style={[styles.formWrap, { opacity: fadeAnim }]}>
              <BlurView
                intensity={100}
                tint={isDarkMode ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDarkMode ? 'rgba(24,24,27,0.85)' : 'rgba(255,255,255,0.85)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    overflow: 'hidden' // Ensure children don't overflow blur
                  }
                ]}
              >
                <View style={styles.headerWrap}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {isLoginMode ? 'Welcome Back' : 'Create Account'}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.subtext }]}>
                    {isLoginMode
                      ? 'Please authenticate to access your financial data.'
                      : 'Initialize your secure financial environment locally on this device.'}
                  </Text>
                </View>

                <View>
                  {isLoginMode ? (
                    <>
                      <View style={styles.labeledInputBlock}>
                        <Text style={[styles.inputLabel, { color: colors.subtext }]}>Email / Username</Text>
                        <GlassInput
                          icon="email-outline"
                          placeholder="user@example.com"
                          value={loginEmail}
                          onChangeText={setLoginEmail}
                          isDarkMode={isDarkMode}
                          colors={colors}
                        />
                      </View>

                      <View style={styles.passwordBlock}>
                        <View style={styles.passwordLabelRow}>
                          <Text style={[styles.inputLabel, { color: colors.subtext }]}>Password</Text>
                          <TouchableOpacity>
                            <Text style={[styles.forgotText, { color: colors.accent || colors.primary }]}>
                              Forgot_Password?
                            </Text>
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
                          isDarkMode={isDarkMode}
                          colors={colors}
                        />
                      </View>
                    </>
                  ) : (
                    <View>
                      <View style={styles.nameRow}>
                        <View style={styles.rowInput}>
                          <GlassInput
                            icon="account-outline"
                            placeholder="First Name"
                            value={signupFirstName}
                            onChangeText={setSignupFirstName}
                            isDarkMode={isDarkMode}
                            colors={colors}
                          />
                        </View>
                        <View style={styles.rowInput}>
                          <GlassInput
                            icon="account-outline"
                            placeholder="Last Name"
                            value={signupLastName}
                            onChangeText={setSignupLastName}
                            isDarkMode={isDarkMode}
                            colors={colors}
                          />
                        </View>
                      </View>

                      <GlassInput
                        icon="at"
                        placeholder="Username"
                        value={signupUsername}
                        onChangeText={setSignupUsername}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      />
                      <GlassInput
                        icon="email-outline"
                        placeholder="Email Address"
                        value={signupEmail}
                        onChangeText={setSignupEmail}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      />
                      <GlassInput
                        icon="phone-outline"
                        placeholder="Phone Number"
                        value={signupPhoneNumber}
                        onChangeText={setSignupPhoneNumber}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      />

                      <GlassInput
                        icon="lock-outline"
                        placeholder="Password"
                        value={signupPassword}
                        onChangeText={setSignupPassword}
                        secureTextEntry={!showSignupPassword}
                        isPassword
                        showPassword={showSignupPassword}
                        togglePassword={() => setShowSignupPassword(!showSignupPassword)}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      />
                      <GlassInput
                        icon="lock-check-outline"
                        placeholder="Confirm Password"
                        value={signupConfirmPassword}
                        onChangeText={setSignupConfirmPassword}
                        secureTextEntry={true}
                        isDarkMode={isDarkMode}
                        colors={colors}
                      />

                      <TouchableOpacity
                        onPress={pickImage}
                        style={[
                          styles.imagePicker,
                          {
                            backgroundColor: pickerBackground,
                            borderColor: pickerBorder,
                          },
                        ]}
                      >
                        {signupProfileImage ? (
                          <>
                            <Image source={{ uri: signupProfileImage }} style={styles.selectedImage} />
                            <Text style={[styles.imageSelectedText, { color: colors.text }]}>Image Selected</Text>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="camera-plus-outline"
                              size={24}
                              color={colors.subtext}
                            />
                            <Text style={[styles.imagePickerText, { color: colors.subtext }]}>
                              Upload Profile Picture
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={isLoginMode ? handleLogin : handleSignup}
                    disabled={loading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>{isLoginMode ? 'Sign In' : 'Register'}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footerRow}>
                    <Text style={[styles.footerText, { color: colors.subtext }]}>
                      {isLoginMode ? 'New user? ' : 'Already have an account? '}
                    </Text>
                    <TouchableOpacity onPress={toggleMode}>
                      <Text style={[styles.footerLink, { color: colors.primary }]}>
                        {isLoginMode ? 'Create account' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            </RNAnimated.View>
          </ScrollView>

          <View style={styles.footerSpace} />
        </KeyboardAvoidingView>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    position: 'relative',
  },
  formWrap: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  headerWrap: {
    marginBottom: 22,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 8,
    fontFamily: 'Rubik-Bold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Rubik-Regular',
  },
  labeledInputBlock: {
    marginBottom: 8,
  },
  passwordBlock: {
    marginBottom: 14,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Rubik-Bold',
  },
  forgotText: {
    fontSize: 11,
    fontFamily: 'CaskaydiaCove-Regular',
  },
  inputWrapper: {
    marginBottom: 10,
  },
  inputContainer: {
    position: 'relative',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 2,
  },
  inputRightIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 2,
  },
  input: {
    width: '100%',
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 42,
    paddingRight: 42,
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  rowInput: {
    flex: 1,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedImage: {
    width: 40,
    height: 40,
    borderRadius: 999,
    marginRight: 12,
  },
  imageSelectedText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
  },
  imagePickerText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Rubik-Regular',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
    marginRight: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
  },
  footerSpace: {
    paddingBottom: 8,
  },
});

export default LoginScreen;
