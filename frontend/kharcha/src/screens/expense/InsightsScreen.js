import { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { listExpenses } from '../../api/expenseApi';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Circle, G, Rect, Text as SvgText, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

const getCategoryIcon = (name) => {
  const map = {
    'Food': 'food',
    'Dining': 'silverware-fork-knife',
    'Housing': 'home',
    'Transport': 'bus',
    'Shopping': 'shopping',
    'Entertainment': 'movie',
    'Utilities': 'flash',
    'Health': 'hospital-box',
  };
  for (const key of Object.keys(map)) {
    if (name && name.includes(key)) return map[key];
  }
  return 'tag';
};

const getCategoryColor = (index, opacity = 1) => {
  const colors = [
    '#F97316',
    '#A855F7',
    '#3B82F6',
    '#10B981',
    '#EC4899',
  ];
  return colors[index % colors.length];
};

export default function InsightsScreen() {
  const [period, setPeriod] = useState('Monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [yearExpenses, setYearExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, label: '', index: -1 });

  const navigation = useNavigation();

  useEffect(() => {
    if (period === 'Yearly') {
      fetchAllData();
    } else {
      fetchYearData(currentDate.getFullYear());
    }
  }, [currentDate.getFullYear(), period]);

  const fetchYearData = async (year) => {
    setLoading(true);
    try {
      const data = await listExpenses({ year: year, limit: 5000 });
      setYearExpenses(data.results || data || []);
    } catch (e) {
      console.error("Failed to fetch year data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const data = await listExpenses({ limit: 10000 });
      setYearExpenses(data.results || data || []);
    } catch (e) {
      console.error("Failed to fetch all data", e);
    } finally {
      setLoading(false);
    }
  };

  const { totalSpend, avgSpend, chartData, categoryStats, titleLabel } = useMemo(() => {
    if (loading) return { totalSpend: 0, avgSpend: 0, chartData: null, categoryStats: [], titleLabel: '' };

    let filteredExpenses = [];
    let labels = [];
    let dataPoints = [];
    let start, end;
    let title = "";

    const year = currentDate.getFullYear();

    if (period === 'Weekly') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(currentDate);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      title = `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;

      filteredExpenses = yearExpenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });

      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      dataPoints = new Array(7).fill(0);

      filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        let dayIndex = d.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6;
        dataPoints[dayIndex] += Number(e.amount);
      });

    } else if (period === 'Monthly') {
      title = `${year}`;
      filteredExpenses = yearExpenses.filter(e => new Date(e.date).getFullYear() === year);

      dataPoints = new Array(12).fill(0);
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        dataPoints[d.getMonth()] += Number(e.amount);
      });

    } else if (period === 'Yearly') {
      title = "All Time";
      filteredExpenses = yearExpenses;

      const years = new Set();
      filteredExpenses.forEach(e => years.add(new Date(e.date).getFullYear()));

      let sortedYears = Array.from(years).sort();
      if (sortedYears.length === 0) sortedYears = [year];

      labels = sortedYears.map(String);
      dataPoints = sortedYears.map(y => {
        return filteredExpenses
          .filter(e => new Date(e.date).getFullYear() === y)
          .reduce((sum, e) => sum + Number(e.amount), 0);
      });
    }

    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    let avg = 0;
    if (period === 'Weekly') avg = total / 7;
    if (period === 'Monthly') avg = total / 12;
    if (period === 'Yearly') avg = total / (labels.length || 1);

    const catMap = {};
    filteredExpenses.forEach(e => {
      const name = e.category?.name || "Uncategorized";
      if (!catMap[name]) catMap[name] = { name, count: 0, amount: 0 };
      catMap[name].count++;
      catMap[name].amount += Number(e.amount);
    });
    const categories = Object.values(catMap).sort((a, b) => b.amount - a.amount);
    categories.forEach(c => c.percentage = total > 0 ? ((c.amount / total) * 100).toFixed(0) : 0);

    return {
      totalSpend: total,
      avgSpend: avg,
      chartData: {
        labels,
        datasets: [{
          data: dataPoints.length > 0 ? dataPoints : [0],
          color: (opacity = 1) => `rgba(45, 212, 191, ${opacity})`,
          strokeWidth: 3
        }]
      },
      categoryStats: categories,
      titleLabel: title
    };
  }, [period, currentDate, yearExpenses, loading]);


  const handlePrev = () => {
    const d = new Date(currentDate);
    if (period === 'Weekly') d.setDate(d.getDate() - 7);
    if (period === 'Monthly') d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (period === 'Weekly') d.setDate(d.getDate() + 7);
    if (period === 'Monthly') d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  };

  return (
    <View className="flex-1 bg-background-dark">
      <View className="pt-14 pb-4 px-6 border-b border-white/5 bg-background-dark/95 backdrop-blur-xl z-30 sticky top-0">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold tracking-tight text-white font-display">Spending Insights</Text>
          {period !== 'Yearly' && (
            <View>
            </View>
          )}
        </View>
        <View className="flex-row p-1 bg-surface-dark rounded-xl border border-white/5">
          {['Weekly', 'Monthly', 'Yearly'].map((p) => {
            const isActive = period === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`flex-1 py-2 items-center justify-center rounded-lg ${isActive ? 'bg-accent shadow-glow' : ''}`}
              >
                <Text className={`text-xs font-bold ${isActive ? 'text-background-dark' : 'text-text-muted'}`}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>

        <View className="glass-panel rounded-3xl p-6 relative overflow-visible shadow-glass mb-4 bg-surface-glass border border-white/5 z-40">
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-xs text-text-muted font-medium uppercase tracking-wider font-display">Total Spend</Text>
              <Text className="text-3xl font-bold text-white mt-1 font-mono-custom">
                NPR {totalSpend.toLocaleString()}
              </Text>
              <Text className="text-xs text-text-muted font-body mt-1">{titleLabel || 'Select Period'}</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-accent/10 px-2 py-1 rounded-lg border border-accent/20">
              <MaterialIcons name="trending-up" size={14} color="#2DD4BF" />
              <Text className="text-xs font-bold font-mono-custom text-accent">+0%</Text>
            </View>
          </View>

          <View className="w-full relative items-center overflow-visible z-50">
            {loading ? (
              <View className="h-48 items-center justify-center">
                <ActivityIndicator color="#2DD4BF" />
              </View>
            ) : chartData && (
              <View style={{ position: 'relative' }}>
                <LineChart
                  data={chartData}
                  width={screenWidth - 48}
                  height={220}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  yAxisLabel=""
                  yAxisSuffix=""
                  onDataPointClick={(data) => {
                    if (Number(data.value) === 0) return;
                    setTooltip({
                      visible: true,
                      x: data.x,
                      y: data.y,
                      value: data.value,
                      label: chartData.labels[data.index] === '' ? `Day ${data.index + 1}` : chartData.labels[data.index],
                      index: data.index
                    });
                  }}
                  renderDotContent={({ x, y, index, indexData }) => {
                    if (Number(indexData) === 0) return null;
                    const isActive = tooltip.visible && tooltip.index === index;
                    const webProps = Platform.OS === 'web' ? {
                      onMouseEnter: () => setTooltip({
                        visible: true,
                        x,
                        y,
                        value: indexData,
                        label: chartData.labels[index],
                        index
                      }),
                      onMouseLeave: () => setTooltip(prev => ({ ...prev, visible: false, index: -1 }))
                    } : {
                      onPress: () => { }
                    };

                    return (
                      <G key={index} x={x} y={y} {...webProps}>
                        <Circle r="12" fill="transparent" />
                        <Circle
                          r={isActive ? 6 : 4}
                          fill={isActive ? "#2DD4BF" : "#18181B"}
                          stroke={isActive ? "#FFFFFF" : "#2DD4BF"}
                          strokeWidth={2}
                        />
                      </G>
                    );
                  }}
                  chartConfig={{
                    backgroundColor: "transparent",
                    backgroundGradientFrom: "#18181B",
                    backgroundGradientTo: "#18181B",
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientToOpacity: 0,
                    fillShadowGradient: '#2DD4BF',
                    fillShadowGradientOpacity: 0.3,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(45, 212, 191, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
                    propsForDots: { r: "0", strokeWidth: "0" },
                    propsForBackgroundLines: { stroke: "rgba(255, 255, 255, 0.05)" }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />

                {tooltip.visible && (
                  <View
                    style={{
                      position: 'absolute',
                      left: tooltip.x - 35,
                      top: tooltip.y - 65,
                      width: 70,
                      alignItems: 'center',
                      zIndex: 100,
                    }}
                    pointerEvents="none"
                  >
                    <View className="bg-surface-dark border border-white/20 p-2 rounded-xl shadow-2xl items-center justify-center w-full">
                      <Text className="text-white font-bold text-xs">NPR {tooltip.value}</Text>
                      <Text className="text-text-muted text-[10px]">{tooltip.label}</Text>
                    </View>
                    <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#27272A', marginTop: -1 }} />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 glass-panel p-4 rounded-2xl bg-surface-glass border border-white/5 h-32 justify-between">
            <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20">
              <MaterialIcons name="payments" size={20} color="#F87171" />
            </View>
            <View>
              <Text className="text-xs text-text-muted mb-1 font-body">Total Expenses</Text>
              <Text className="text-lg font-bold text-white font-mono-custom">
                NPR {totalSpend >= 1000 ? `${(totalSpend / 1000).toFixed(1)}k` : totalSpend}
              </Text>
            </View>
          </View>
          <View className="flex-1 glass-panel p-4 rounded-2xl bg-surface-glass border border-white/5 h-32 justify-between">
            <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20">
              <MaterialIcons name="analytics" size={20} color="#60A5FA" />
            </View>
            <View>
              <Text className="text-xs text-text-muted mb-1 font-body">{period === 'Monthly' ? 'Monthly Avg.' : (period === 'Weekly' ? 'Daily Avg.' : 'Yearly Avg.')}</Text>
              <Text className="text-lg font-bold text-white font-mono-custom">
                NPR {avgSpend >= 1000 ? `${(avgSpend / 1000).toFixed(1)}k` : avgSpend.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        <View>
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-bold text-white tracking-tight font-display">Top Categories</Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <Text className="text-accent text-xs font-bold uppercase tracking-wider font-display">View All</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#2DD4BF" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {categoryStats.length > 0 ? categoryStats.slice(0, 5).map((cat, index) => (
              <View key={index} className="gap-2">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center border border-white/5 bg-surface-dark`}>
                      <MaterialCommunityIcons name={getCategoryIcon(cat.name)} size={20} color={getCategoryColor(index)} />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-white font-display">{cat.name}</Text>
                      <Text className="text-xs text-text-muted font-mono-custom">{cat.count} txns</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-white font-mono-custom">NPR {cat.amount.toLocaleString()}</Text>
                    <Text className="text-xs text-text-muted font-mono-custom">{cat.percentage}%</Text>
                  </View>
                </View>
                <View className="w-full bg-surface-dark rounded-full h-1.5 overflow-hidden">
                  <LinearGradient
                    colors={[getCategoryColor(index), getCategoryColor(index, 0.6)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${cat.percentage}%`, height: '100%' }}
                  />
                </View>
              </View>
            )) : (
              <Text className="text-text-muted text-center py-4">No data available for this period</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
