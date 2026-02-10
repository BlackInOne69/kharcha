import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import {
    View,
    Pressable,
    StyleSheet,
    Animated,
    Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

export default function CustomTabBar({ state, descriptors, navigation }) {
    const { colors, isDarkMode } = useContext(ThemeContext);

    // Map app theme to the tab bar theme
    const theme = {
        screenBg: colors.background,
        barBg: isDarkMode ? "#27272A" : "#FFFFFF", // Solid color for better visibility
        // Active bubble color: Subtle teal background (like Profile list items)
        bubbleBg: isDarkMode ? "rgba(13, 148, 136, 0.2)" : "#E0F2F1",
        // Icons:
        icon: isDarkMode ? "#A1A1AA" : "#71717A", // Muted for inactive
        iconActive: colors.accent || "#2DD4BF", // Bright Cyan/Green for active icon

        stroke: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        shadow: isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)",
    };

    const [barWidth, setBarWidth] = useState(0);
    const count = state.routes.length;

    const bubbleSize = 44;      // Size of the active bubble
    const barHeight = 64;       // Height of the pill
    const horizontalPad = 12;   // Inner padding of the pill container

    // Calculate the width of a single tab item
    const itemWidth = useMemo(() => {
        if (!barWidth) return 0;
        return (barWidth - horizontalPad * 2) / count;
    }, [barWidth, count]);

    const anim = useRef(new Animated.Value(state.index)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: state.index,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
            mass: 0.5, // Lighter mass for snappier but smooth feel
        }).start();
    }, [state.index, anim]);

    // Interpolate position for the sliding bubble
    const bubbleTranslateX = itemWidth
        ? anim.interpolate({
            inputRange: [0, count - 1],
            outputRange: [
                horizontalPad + itemWidth / 2 - bubbleSize / 2,
                horizontalPad + itemWidth * (count - 1) + itemWidth / 2 - bubbleSize / 2,
            ],
        })
        : 0;

    const onLayout = (e) => setBarWidth(e.nativeEvent.layout.width);

    return (
        <View style={styles.wrap}>
            <View
                onLayout={onLayout}
                style={[
                    styles.bar,
                    {
                        height: barHeight,
                        backgroundColor: theme.barBg,
                        borderColor: theme.stroke,
                        shadowColor: theme.shadow,
                    },
                ]}
            >
                {/* Active Bubble Indicator (Sliding) */}
                {itemWidth && barWidth > 0 ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.bubble,
                            {
                                width: bubbleSize,
                                height: bubbleSize,
                                borderRadius: bubbleSize / 2,
                                backgroundColor: theme.bubbleBg,
                                shadowColor: theme.bubbleBg,
                                // Center vertically: (barHeight - bubbleSize) / 2
                                top: (barHeight - bubbleSize) / 2,
                                transform: [
                                    { translateX: bubbleTranslateX }
                                ],
                            },
                        ]}
                    />
                ) : null}

                {/* Tab Icons */}
                <View style={[styles.row, { paddingHorizontal: horizontalPad }]}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const iconName = getIcon(route.name);

                        return (
                            <Pressable
                                key={route.key}
                                onPress={onPress}
                                style={[styles.item, { width: itemWidth || 0 }]}
                                android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: true }}
                            >
                                <View style={[styles.iconContainer]}>
                                    <Feather
                                        name={iconName}
                                        size={22}
                                        color={isFocused ? theme.iconActive : theme.icon}
                                    />
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

function getIcon(routeName) {
    switch (routeName) {
        case "Home": return "home";
        case "Stats": return "bar-chart-2";
        case "Scan": return "plus-circle"; // Changed to plus-circle for "Add/Scan"
        case "Wallet": return "credit-card";
        case "Profile": return "user";
        default: return "circle";
    }
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingBottom: Platform.OS === "ios" ? 34 : 24,
        paddingHorizontal: 20, // Margin from screen edges
        alignItems: 'center',
        zIndex: 999,
    },
    bar: {
        width: '100%',
        borderRadius: 40, // High border radius for full pill shape
        borderWidth: 1,
        justifyContent: "center",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        height: "100%",
    },
    item: {
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    bubble: {
        position: "absolute",
        left: 0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});
