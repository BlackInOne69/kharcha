import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import GroupList from '../components/GroupList';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_BASE_URL = 'http://127.0.0.1:8000';

const GroupsScreen = () => {
  const { isLoggedIn, id } = useContext(AuthContext);
  const { colors, isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for category dropdown modal
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  // State for group expense log
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [groupExpensesLoading, setGroupExpensesLoading] = useState(false);

  // State for "Add Shared Expense" modal
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState(id || '');
  const [splitType, setSplitType] = useState('equal');
  const [totalAmount, setTotalAmount] = useState('');
  const [individualAmounts, setIndividualAmounts] = useState({});
  const [isAddingSharedExpense, setIsAddingSharedExpense] = useState(false);
  const [items, setItems] = useState([{ item_name: '', amount: '', owes: {} }]);
  // New: Date for expense
  const [expenseDate, setExpenseDate] = useState('');

  // New state for Categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const searchDebounce = useRef(null);

  const getAccessToken = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Authentication Error', 'Access token not found. Please log in again.');
        return null;
      }
      return token;
    } catch (error) {
      console.error('AsyncStorage error while getting token:', error);
      Alert.alert('Storage Error', 'Could not retrieve authentication token.');
      return null;
    }
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/expense/groups/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setGroups(data.results || data || []);
      } else {
        Alert.alert('Error Fetching Groups', data.detail || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Network error in fetchGroups:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/expense/categories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setCategories(data.results || data || []);
        if (data.results && data.results.length > 0) {
          setSelectedCategory(data.results[0].id);
        }
      } else {
        Alert.alert('Error Fetching Categories', data.detail || 'Failed to fetch categories.');
      }
    } catch (error) {
      console.error('Network error in fetchCategories:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch categories.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const fetchMembers = async (query = '') => {
    setMembersLoading(true);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMembersLoading(false);
      return;
    }

    const url = query
      ? `${API_BASE_URL}/auth/list/?username=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/auth/list/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMembers(data.results || data || []);
      } else {
        Alert.alert('Error Fetching Members', data.detail || 'Failed to fetch members.');
      }
    } catch (error) {
      console.error('Network error in fetchMembers:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Invalid Name', 'Group name cannot be empty.');
      return;
    }
    if (!isLoggedIn || !id) {
      Alert.alert('Authentication Error', 'User not authenticated. Please log in again.');
      return;
    }

    setIsCreatingGroup(true);

    const memberIds = [...new Set([...selectedMembers, id])];
    const groupData = { name: newGroupName.trim(), member_ids: memberIds };

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setIsCreatingGroup(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/expense/groups/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        data = null;
      }

      if (response.status === 201) {
        Alert.alert('Success', 'Group created successfully!');
        handleCloseCreateModal();
        fetchGroups();
      } else {
        let errorDetail = '';
        if (data) {
          if (typeof data === 'object') {
            if (data.detail) {
              errorDetail = data.detail;
            } else {
              errorDetail = Object.values(data).flat().join('\n');
            }
          } else {
            errorDetail = data.toString();
          }
        }
        Alert.alert('Creation Failed', errorDetail || 'Failed to create group.');
      }
    } catch (error) {
      console.error('Network error in handleCreateGroup:', error);
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleAddSharedExpense = async () => {
    // (Simplified: Navigation logic is used in handleOpenAddExpenseModal)
  };

  // Modal handler functions
  const handleOpenCreateModal = () => {
    setNewGroupName('');
    setSelectedMembers([]);
    setSearchQuery('');
    setMembers([]);
    setCreateModalVisible(true);
    fetchMembers();
  };

  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
  };

  const handleOpenAddExpenseModal = async (group) => {
    navigation.navigate('GroupExpense', { group });
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  useEffect(() => {
    return () => {
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current);
      }
    };
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchDebounce.current) { clearTimeout(searchDebounce.current); }
    searchDebounce.current = setTimeout(() => { fetchMembers(text); }, 500);
  };

  const renderMemberItem = (member) => {
    if (member.id === id) { return null; }
    const isSelected = selectedMembers.includes(member.id);
    return (
      <TouchableOpacity
        key={member.id}
        onPress={() => toggleMemberSelection(member.id)}
        className={`flex-row items-center p-3 rounded-xl mb-1 border ${isSelected
            ? 'bg-primary/20 border-primary'
            : 'bg-surface-dark border-white/5'
          }`}
      >
        <MaterialCommunityIcons
          name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={22}
          color={isSelected ? '#2DD4BF' : '#A1A1AA'}
        />
        <Text className={`ml-3 text-base font-body ${isSelected ? 'text-white' : 'text-text-muted'}`}>
          {member.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background-dark">
      <CustomHeader title="Groups" showBackButton={false} showProfileIcon={true} />

      <View className="flex-1">
        <GroupList
          groups={groups}
          loading={loading}
          isDarkMode={true}
          colors={colors}
          onGroupPress={handleOpenAddExpenseModal}
        />
      </View>

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 rounded-2xl bg-primary items-center justify-center shadow-glow border border-white/20"
        onPress={handleOpenCreateModal}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal for creating new group */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={handleCloseCreateModal}
      >
        <View className="flex-1 justify-center items-center bg-black/80 backdrop-blur-sm p-5">
          <View className="w-full max-w-sm bg-surface-dark border border-white/10 rounded-3xl p-6 shadow-glass">
            <Text className="text-2xl font-bold text-white font-display mb-1">Create Group</Text>
            <Text className="text-sm text-text-muted font-body mb-6">Start a new group with friends</Text>

            <View className="mb-4">
              <Text className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 font-display">Group Name</Text>
              <TextInput
                className="w-full bg-surface-glass border border-white/10 rounded-xl p-4 text-white text-base font-body"
                placeholder="e.g., Summer Trip"
                placeholderTextColor="#52525B"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
            </View>

            <View className="mb-6">
              <Text className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2 font-display">Select Members</Text>
              <TextInput
                className="w-full bg-surface-glass border border-white/10 rounded-xl p-4 text-white text-base font-body mb-3"
                placeholder="Search by username..."
                placeholderTextColor="#52525B"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />

              <View className="h-48 bg-surface-glass/50 border border-white/5 rounded-xl overflow-hidden">
                {membersLoading ? (
                  <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="small" color="#2DD4BF" />
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={{ padding: 8 }}>
                    {members.length > 0 ? members.map(renderMemberItem) : (
                      <Text className="text-center text-text-muted font-body mt-4">No members found.</Text>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-4 rounded-xl items-center justify-center border border-white/10" onPress={handleCloseCreateModal}>
                <Text className="text-text-muted font-bold font-body">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-4 rounded-xl items-center justify-center bg-primary ${isCreatingGroup ? 'opacity-50' : 'shadow-glow'}`}
                onPress={handleCreateGroup}
                disabled={isCreatingGroup}
              >
                {isCreatingGroup ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-bold font-body">Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default GroupsScreen;