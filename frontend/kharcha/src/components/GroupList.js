import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

const GroupList = ({
  groups,
  loading,
  isDarkMode,
  colors,
  onGroupPress
}) => (
  <View className="flex-1 bg-background-dark">
    {loading ? (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    ) : (
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center p-4 mb-4 rounded-2xl bg-surface-glass border border-white/5 shadow-glass"
            onPress={() => onGroupPress(item)}
          >
            <View className="w-12 h-12 rounded-xl items-center justify-center bg-primary/20 border border-primary/20">
              <MaterialCommunityIcons name="account-group" size={24} color="#2DD4BF" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-white font-display mb-1">{item.name}</Text>
              <Text className="text-sm text-text-muted font-body">{item.members ? item.members.length : 0} members</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#52525B" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center pt-20">
            <View className="w-20 h-20 rounded-full bg-surface-dark border border-white/5 items-center justify-center mb-4">
              <MaterialCommunityIcons name="account-group-outline" size={40} color="#52525B" />
            </View>
            <Text className="text-center text-lg text-text-muted font-display">
              No groups found
            </Text>
            <Text className="text-center text-sm text-text-muted/60 mt-1 font-body max-w-[200px]">
              Create a group to split expenses with friends
            </Text>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 100 }}
      />
    )}
  </View>
);

export default GroupList;
