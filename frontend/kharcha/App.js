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

import CustomTabBar from './src/components/CustomTabBar';

function MainTabs() {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true, // Optional: hide on keyboard
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Stats"
                component={InsightsScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Stats',
                }}
            />
            <Tab.Screen
                name="Scan"
                component={AddScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Post', // Label for the middle button if needed
                }}
            />
            <Tab.Screen
                name="Wallet"
                component={GroupsScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Wallet',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Profile',
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
