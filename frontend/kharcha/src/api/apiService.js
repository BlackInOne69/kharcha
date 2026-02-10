// kharcha/src/api/apiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// !!! IMPORTANT: Ensure this matches your Django backend URL !!!
const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function for making authenticated fetch requests
const authenticatedFetch = async (url, options = {}) => {
    const token = await AsyncStorage.getItem('access_token');
    const headers = {
        // Default to application/json, but allow override for FormData
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // If Content-Type is explicitly set to undefined (for FormData), remove it
    if (headers['Content-Type'] === undefined) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json(); // Try to parse JSON error
        } catch (e) {
            // If JSON parsing fails, use plain text response
            errorData = { detail: await response.text() };
        }
        const error = new Error(errorData.detail || `API Error: ${response.status} - ${response.statusText}`);
        error.response = { status: response.status, data: errorData }; // Attach response details
        throw error;
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    return text ? JSON.parse(text) : {}; // Return empty object for 204 No Content
};

// GET /auth/details/
export const getUserDetails = async () => {
    return authenticatedFetch('/auth/details/', {
        method: 'GET',
    });
};

// PATCH /auth/update/{id}/ for profile updates (username, full_name, theme_preference)
export const updateProfile = async (userId, profileData) => {
    if (!userId) {
        throw new Error('User ID is required for updating the profile.');
    }
    return authenticatedFetch(`/auth/update/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
    });
};

// POST /auth/change/password/
export const updatePassword = async (passwordData) => {
    return authenticatedFetch('/auth/change/password/', {
        method: 'POST',
        body: JSON.stringify(passwordData),
    });
};

// PATCH /auth/update/{id}/ for profile picture upload
export const uploadProfileImage = async (userId, imageData) => {
    if (!userId) {
        throw new Error('User ID is required for uploading profile picture.');
    }
    const formData = new FormData();
    formData.append('profile_picture', { // 'profile_picture' must match your Django field name
        uri: imageData.uri,
        name: imageData.fileName || 'profile.jpg',
        type: imageData.type || 'image/jpeg',
    });

    return authenticatedFetch(`/auth/update/${userId}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': undefined, // Crucial: Let fetch handle Content-Type for FormData
        },
        body: formData,
    });
};

// PATCH /auth/update/{id}/ for theme preference
export const updateThemePreference = async (userId, themePreference) => {
    if (!userId) {
        throw new Error('User ID is required for updating theme preference.');
    }
    return authenticatedFetch(`/auth/update/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ theme_preference: themePreference }), // Adjust field name if different in Django
    });
};

// GET /budget/budgets/
export const getBudgets = async () => {
    return authenticatedFetch('/budget/budgets/', { method: 'GET' });
};

// POST /budget/budgets/
export const createBudget = async (budgetData) => {
    return authenticatedFetch('/budget/budgets/', {
        method: 'POST',
        body: JSON.stringify(budgetData),
    });
};

// PATCH /budget/budgets/{id}/
export const updateBudget = async (id, budgetData) => {
    return authenticatedFetch(`/budget/budgets/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(budgetData),
    });
};

// Note: Login, Logout, Register are handled directly in LoginScreen/AuthContext via raw fetch,
// as they often don't need the authenticatedFetch helper before a token exists.


// --- LEND / BORROW API ---

// GET /lend/
export const getTransactions = async () => {
    return authenticatedFetch('/lend/', { method: 'GET' });
};

// POST /lend/
export const createTransaction = async (transactionData) => {
    return authenticatedFetch('/lend/', {
        method: 'POST',
        body: JSON.stringify(transactionData),
    });
};

// GET /lend/{id}/
export const getTransactionDetail = async (id) => {
    return authenticatedFetch(`/lend/${id}/`, { method: 'GET' });
};

// PATCH /lend/{id}/verify/
export const verifyTransaction = async (id) => {
    return authenticatedFetch(`/lend/${id}/verify/`, { method: 'PATCH' });
};

// PATCH /lend/{id}/paid/
export const markTransactionPaid = async (id) => {
    return authenticatedFetch(`/lend/${id}/paid/`, { method: 'PATCH' });
};

// DELETE /lend/{id}/
export const deleteTransaction = async (id) => {
    return authenticatedFetch(`/lend/${id}/`, { method: 'DELETE' });
};


// --- WALLET API ---

// GET /income/wallets/
export const getWallets = async () => {
    return authenticatedFetch('/income/wallets/', { method: 'GET' });
};

// POST /income/wallets/
export const createWallet = async (walletData) => {
    return authenticatedFetch('/income/wallets/', {
        method: 'POST',
        body: JSON.stringify(walletData),
    });
};

// PATCH /income/wallets/{id}/
export const updateWallet = async (id, walletData) => {
    return authenticatedFetch(`/income/wallets/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(walletData),
    });
};

// DELETE /income/wallets/{id}/
export const deleteWallet = async (id) => {
    return authenticatedFetch(`/income/wallets/${id}/`, { method: 'DELETE' });
};

// Helper to Add Funds (Creates an Income record linked to wallet)
// POST /income/
export const addFunds = async (amount, walletId, description) => {
    // We need a category for Income. Ideally 'Salary' or 'Transfer' or 'Deposit'.
    // For now, we might need to fetch categories first or just use a default specific ID if known,
    // but better to let backend handle default or user select category.
    // Assuming user selects category or we just pass amount/wallet and let backend/frontend logic generic it.

    // Actually, to keep it simple, we will reuse createIncome but wrapping it here for clarity.
    // We need to pass category_id. The UI should probably ask for it or we pick a default 'Income' category.
    // For this 'Add Fund' quick action, maybe we just pick the first category available or 'Deposit'.

    return authenticatedFetch('/income/', {
        method: 'POST',
        body: JSON.stringify({
            amount,
            wallet_id: walletId,
            description: description || 'Added funds',
            // category_id is required by serializer. We need to handle this in UI.
        }),
    });
};

// GET /income/categories/ (to help with addFunds)
export const getIncomeCategories = async () => {
    return authenticatedFetch('/income/categories/', { method: 'GET' });
};

// POST /income/categories/
export const createIncomeCategory = async (categoryData) => {
    return authenticatedFetch('/income/categories/', {
        method: 'POST',
        body: JSON.stringify(categoryData),
    });
};

// POST /income/ (Generic create income)
export const createIncome = async (incomeData) => {
    return authenticatedFetch('/income/', {
        method: 'POST',
        body: JSON.stringify(incomeData),
    });
};