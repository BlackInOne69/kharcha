import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions, Pressable, Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSharedValue,
  useFrameCallback,
  useDerivedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

// Finance-themed images and keywords
const FINANCE_ITEMS = [
  'Budget',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&auto=format&fit=crop&q=60', // Money plant
  'Save',
  'https://images.unsplash.com/photo-1554224155-9840635290aa?w=400&auto=format&fit=crop&q=60', // Calculator
  'Invest',
  'https://images.unsplash.com/photo-1565514020176-dbf2277e4952?w=400&auto=format&fit=crop&q=60', // Coins
  'Growth',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&auto=format&fit=crop&q=60', // Chart
  'Wealth',
  'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=400&auto=format&fit=crop&q=60', // Trading
  'Plan',
  'https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&auto=format&fit=crop&q=60', // Credit card
  'Stocks',
  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=400&auto=format&fit=crop&q=60', // Crypto/Graph
  'Future',
];

// Duplicate items to ensure smooth infinite looping
const DISPLAY_ITEMS = [...FINANCE_ITEMS, ...FINANCE_ITEMS, ...FINANCE_ITEMS];

const InteractiveItem = ({ item, itemSize }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(1.15, { duration: 200, easing: Easing.out(Easing.quad) });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const isImage = item.startsWith('http');

  // Content based on type
  const content = isImage ? (
    <Image
      source={{ uri: item }}
      style={styles.image}
      contentFit="cover"
      transition={200}
      pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'} // Ensure correct pointer events
    />
  ) : (
    <View style={styles.textContainer}>
      <Text
        style={[styles.text, { fontSize: itemSize * 0.16, userSelect: 'none' }]}
        selectable={false}
      >
        {item}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[{ width: itemSize, height: itemSize, borderRadius: 12 }, animatedStyle]}>
      {Platform.OS === 'web' ? (
        <View
          onMouseEnter={handlePressIn}
          onMouseLeave={handlePressOut}
          style={[styles.itemInner, { cursor: 'grab' }]}
        >
          {content}
        </View>
      ) : (
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.itemInner}
        >
          {content}
        </Pressable>
      )}
    </Animated.View>
  );
};

const InfiniteRow = ({ items, direction = 1, baseSpeed = 0.5, rowIndex, itemSize, gap, globalOffset, userDrag }) => {
  const loopWidth = (itemSize + gap) * FINANCE_ITEMS.length;

  const animatedStyle = useAnimatedStyle(() => {
    // Auto-scroll component: moves depending on direction
    const autoComponent = globalOffset.value * baseSpeed * direction;

    // Drag component: moves 1:1 with finger (no direction multiplier)
    const dragComponent = userDrag.value;

    // We add a per-row offset (rowIndex * 100) to keep them desynchronized visually
    const scrollAmount = autoComponent + dragComponent + (rowIndex * 100);

    const shift = ((scrollAmount % loopWidth) + loopWidth) % loopWidth;

    return {
      transform: [{ translateX: -shift }],
    };
  });

  return (
    <Animated.View style={[styles.row, { gap: gap }, animatedStyle]}>
      {items.map((item, index) => (
        <InteractiveItem
          key={`${rowIndex}-${index}`}
          item={item}
          itemSize={itemSize}
        />
      ))}
    </Animated.View>
  );
};

const GridMotionBackground = ({ isDarkMode, colors, globalOffset, userDrag, isInteracting }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Larger items on mobile to reduce visual clutter/density
  const itemSize = isMobile ? 120 : 100;
  const gap = 16;

  // Auto-scroll loop
  useFrameCallback(() => {
    // Always auto-scroll to ensure continuous motion (background flow)
    // User drag is additive to this flow.
    globalOffset.value += 0.5; // Reduced speed slightly for smoother blending with drag
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.rotatedContainer,
          {
            transform: [
              { rotate: '-15deg' },
              { translateY: isMobile ? -50 : 0 }
            ],
          }
        ]}
      >
        {/* Note: baseSpeed varies the parallax speed of each row */}
        <InfiniteRow items={DISPLAY_ITEMS} direction={1} baseSpeed={0.8} rowIndex={0} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={-1} baseSpeed={1.0} rowIndex={1} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={1} baseSpeed={0.9} rowIndex={2} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={-1} baseSpeed={1.1} rowIndex={3} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={1} baseSpeed={0.7} rowIndex={4} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={-1} baseSpeed={1.2} rowIndex={5} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={1} baseSpeed={0.85} rowIndex={6} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
        <InfiniteRow items={DISPLAY_ITEMS} direction={-1} baseSpeed={0.95} rowIndex={7} itemSize={itemSize} gap={gap} globalOffset={globalOffset} userDrag={userDrag} />
      </View>

      {/* Overlay Gradients */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
          'transparent',
          'transparent',
          isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.2, 0.8, 1]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', isDarkMode ? colors.background : '#ffffff']}
        style={StyleSheet.absoluteFill}
        locations={[0.5, 1]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1.2 }}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatedContainer: {
    width: '200%',
    height: '200%',
    justifyContent: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  itemInner: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GridMotionBackground;
