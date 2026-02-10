import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext } from 'react';
// CHANGE: Import StatusBar
import { StatusBar, View } from 'react-native';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ThemeContext, ThemeProvider } from './src/context/ThemeContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AddScreen from './src/screens/AddScreen';
import EventExpenseScreen from './src/screens/EventExpenseScreen';
import EventScreen from './src/screens/EventScreen';
import GroupExpenseScreen from './src/screens/GroupExpenseScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SymbolIcon from './src/components/icons/SymbolIcon';
import ExpenseDetailScreen from './src/screens/expense/ExpenseDetailScreen';
import InsightsScreen from './src/screens/expense/InsightsScreen';
import PrivacyScreen from './src/screens/expense/PrivacyScreen';
import ReviewExpenseScreen from './src/screens/expense/ReviewExpenseScreen';
import ScanPreviewScreen from './src/screens/expense/ScanPreviewScreen';

import './global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Updated to match the HTML mockup design
function MainTabs() {
    const { colors } = useContext(ThemeContext);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(24, 24, 27, 0.95)', // background-dark with 95% opacity
                    borderTopColor: 'rgba(255, 255, 255, 0.05)',
                    borderTopWidth: 1,
                    height: 88, // 5.5rem equivalent
                    paddingBottom: 10,
                    paddingTop: 8,
                    elevation: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -5 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                },
                tabBarActiveTintColor: '#2DD4BF', // accent color
                tabBarInactiveTintColor: '#A1A1AA', // text-muted
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name="home"
                            size={24}
                            color={color}
                            style={{
                                shadowColor: focused ? '#2DD4BF' : 'transparent',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 8,
                            }}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Stats"
                component={InsightsScreen}
                options={{
                    tabBarLabel: 'Stats',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="chart-bar" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Scan"
                component={AddScreen}
                options={{
                    tabBarLabel: 'Add',
                    tabBarIcon: () => (
                        <View style={{
                            position: 'absolute',
                            top: -40,
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            backgroundColor: '#0D9488', // primary color
                            shadowColor: '#0D9488',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.4,
                            shadowRadius: 20,
                            elevation: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}>
                            <MaterialCommunityIcons name="plus" size={36} color="#FFFFFF" />
                        </View>
                    ),
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: 'bold',
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: '#2DD4BF',
                        marginTop: 20, // Extra margin because icon is elevated
                    },
                }}
            />
            <Tab.Screen
                name="Wallet"
                component={GroupsScreen}
                options={{
                    tabBarLabel: 'Wallet',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="wallet" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="account" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

function AppNavigation() {
    const { isLoggedIn } = useContext(AuthContext);
    // CHANGE: Destructure `navigationTheme` from the ThemeContext
    const { isDarkMode, navigationTheme } = useContext(ThemeContext);

    // CHANGE: Determine the status bar style based on the theme
    const barStyle = isDarkMode ? 'light-content' : 'dark-content';

    // Lazy import to avoid circular dependency
    const SetBudgetGoal = require('./src/screens/SetBudgetGoal').default;

    return (
        // CHANGE: Pass the dynamic navigationTheme to the container
        <NavigationContainer theme={navigationTheme}>
            {/* CHANGE: Add the StatusBar component to sync with the theme */}
            <StatusBar barStyle={barStyle} backgroundColor={navigationTheme.colors.card} />

            <Stack.Navigator
                // You can still keep headerShown: false if you have custom headers,
                // but if you want to use the navigator's built-in header,
                // removing this will allow the theme to style it automatically.
                screenOptions={{ headerShown: false }}
            >
                {isLoggedIn ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="SetBudgetGoal" component={SetBudgetGoal} />
                        <Stack.Screen name="GroupExpense" component={GroupExpenseScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="EventScreen" component={EventScreen} />
                        <Stack.Screen name="EventExpenseScreen" component={EventExpenseScreen} />
                        <Stack.Screen name="ScanPreview" component={ScanPreviewScreen} />
                        <Stack.Screen name="ReviewExpense" component={ReviewExpenseScreen} />
                        <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
                        <Stack.Screen name="History" component={HistoryScreen} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// The main App component wraps everything in providers
export default function App() {
    const [fontsLoaded, fontError] = useFonts({
        'Rubik-Regular': require('./assets/fonts/Rubik-Regular.ttf'),
        'Rubik-Medium': require('./assets/fonts/Rubik-Medium.ttf'),
        'Rubik-Bold': require('./assets/fonts/Rubik-Bold.ttf'),
        'CaskaydiaCove-Regular': require('./assets/fonts/CaskaydiaCove-Regular.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            // Hide the splash screen once fonts are loaded or if there's an error
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null; // or a loading component
    }

    return (
        // CHANGE: Swapped provider order for better dependency management.
        // It's best practice for providers that depend on others (Theme -> Auth)
        // to be nested inside the ones they depend on.
        <AuthProvider>
            <ThemeProvider>
                <AppNavigation />
            </ThemeProvider>
        </AuthProvider>
    );
}
