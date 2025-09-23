# Airtime Purchase API Integration Guide for Mobile Applications

## 1. Prerequisites and Assumptions

### Backend API Requirements
- **RESTful API**: The backend must expose a RESTful API endpoint for airtime purchases
- **Authentication**: JWT-based authentication is required for all API calls
- **Transaction PIN**: Users must have a transaction PIN set for security
- **Supported Providers**: The API supports multiple providers (VTPass, Clubkonnect) with automatic failover
- **Network Detection**: Automatic network detection from Nigerian phone numbers
- **Purchase Limits**: Configurable minimum/maximum amounts and daily/monthly limits

### Mobile App Requirements
- **Platform**: React Native with Expo framework
- **HTTP Client**: Axios for API communication
- **State Management**: Redux Toolkit for global state
- **Authentication**: JWT token management with refresh token support
- **Storage**: AsyncStorage for secure token storage
- **UI Components**: Transaction PIN modal for secure purchases

### Assumptions
- Backend API is deployed and accessible at `https://ohtopup.onrender.com/api`
- Users are authenticated and have valid JWT tokens
- Transaction PIN is set and verified on the backend
- Network connectivity is available for API calls
- Phone numbers follow Nigerian format (234XXXXXXXXX or 0XXXXXXXXX)

### API Endpoint Details
```
POST /api/users/airtime
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "serviceID": "mtn",           // Network identifier (mtn, glo, airtel, 9mobile)
  "amount": 1000,              // Amount in Naira (minimum 50)
  "phone": "08031234567",      // Recipient phone number
  "provider": "vtpass",        // Optional: preferred provider
  "transactionPin": "1234"     // User's transaction PIN
}

Response:
{
  "message": "Airtime purchase successful",
  "provider": "VTPass",
  "network": "mtn",
  "transaction": {
    "requestId": "REQ_123456789",
    "status": "delivered",
    "amount": 1000,
    "recipient": "08031234567"
  },
  "newBalance": 5000.00
}
```

### Error Response Format
```json
{
  "status": 400,
  "message": "Invalid transaction PIN."
}
```

### Supported Networks
- **MTN**: 0803, 0806, 0703, 0706, 0813, 0816, 0903, 0906
- **Glo**: 0805, 0807, 0705, 0811, 0815, 0905
- **Airtel**: 0802, 0808, 0708, 0812, 0902, 0907, 0901, 0912
- **9Mobile**: 0809, 0817, 0818, 0908, 0909
## 2. Mobile App Setup (React Native)

### Project Structure
Ensure your React Native project has the following structure and dependencies:

```
ohtopup-mobile/
├── app/
│   ├── services/
│   │   └── airtime/
│   │       └── index.tsx          # Airtime purchase screen
│   └── _layout.tsx                # App layout
├── components/
│   ├── TransactionPINModal.tsx    # PIN entry modal
│   └── ui/                        # UI components
├── services/
│   ├── api.ts                     # API client
│   └── queryClient.ts             # React Query setup
├── store/
│   ├── index.ts                   # Redux store
│   └── slices/
│       ├── authSlice.ts           # Authentication state
│       └── uiSlice.ts             # UI state
├── constants/
│   └── Colors.ts                  # App colors
└── package.json
```

### Required Dependencies
Install the following packages if not already present:

```bash
npm install @react-native-async-storage/async-storage axios @reduxjs/toolkit react-redux redux-persist @tanstack/react-query expo-router expo-constants expo-local-authentication
```

### Key Dependencies Explanation
- **@react-native-async-storage/async-storage**: Secure storage for tokens
- **axios**: HTTP client for API calls
- **@reduxjs/toolkit**: State management
- **@tanstack/react-query**: Data fetching and caching
- **expo-router**: Navigation
- **expo-local-authentication**: Biometric authentication (optional)

### Environment Configuration
Create environment variables for API configuration:

```typescript
// constants/Config.ts
export const API_CONFIG = {
  BASE_URL: 'https://ohtopup.onrender.com/api',
  TIMEOUT: 10000,
};

// For development, you can use different URLs
export const DEV_API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 5000,
};
```

### Redux Store Setup
Configure the Redux store with authentication and UI slices:

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
};

const persistedReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### API Client Configuration
Set up the API client with authentication interceptors:

```typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const BASE_URL = 'https://ohtopup.onrender.com/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          // Handle token refresh logic here
          // ... (implementation details in next section)
        }
        return Promise.reject(error);
      }
    );
  }

  // Airtime purchase method
  async purchaseAirtime(data: {
    serviceID: string;
    amount: number;
    phone: string;
    provider?: string;
    transactionPin: string;
  }) {
    const response = await this.client.post('/airtime', data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### React Query Setup
Configure React Query for data fetching:

```typescript
// services/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### App Entry Point
Wrap your app with providers:

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { store, persistor } from '../store';
import { queryClient } from '../services/queryClient';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <Stack />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
```
## 3. API Client Configuration and HTTP Request Implementation

### Complete API Client Implementation
Extend the API client with comprehensive error handling and token management:

```typescript
// services/api.ts (continued)
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000, // 30 seconds for airtime purchases
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { token, refreshToken: newRefreshToken } = response.data;

            await AsyncStorage.setItem('auth_token', token);
            if (newRefreshToken) {
              await AsyncStorage.setItem('refresh_token', newRefreshToken);
            }

            this.client.defaults.headers.Authorization = `Bearer ${token}`;
            this.processQueue(null, token);

            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });
    this.failedQueue = [];
  }

  private async logout() {
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    store.dispatch(logout());
    // Navigate to login screen
  }

  // Airtime purchase with enhanced error handling
  async purchaseAirtime(data: {
    serviceID: string;
    amount: number;
    phone: string;
    provider?: string;
    transactionPin: string;
  }) {
    try {
      const response = await this.client.post('/airtime', {
        serviceID: data.serviceID,
        amount: data.amount,
        phone: data.phone,
        provider: data.provider,
        transactionPin: data.transactionPin,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Airtime purchase error:', error);

      // Handle different error types
      if (error.response) {
        // Server responded with error status
        return {
          success: false,
          error: error.response.data.message || 'Purchase failed',
          status: error.response.status,
        };
      } else if (error.code === 'NETWORK_ERROR') {
        // Network error
        return {
          success: false,
          error: 'Network connection failed. Please check your internet connection.',
          status: 0,
        };
      } else {
        // Other errors
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.',
          status: 500,
        };
      }
    }
  }

  // Get purchase limits
  async getPurchaseLimits() {
    try {
      const response = await this.client.get('/airtime/limits');
      return {
        success: true,
        data: response.data.limits,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to load purchase limits',
      };
    }
  }

  // Get airtime settings
  async getAirtimeSettings() {
    try {
      const response = await this.client.get('/airtime/settings');
      return {
        success: true,
        data: response.data.settings,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to load airtime settings',
      };
    }
  }
}

export const apiClient = new ApiClient();
```

### Network Detection Utility
Create a utility to detect network from phone number:

```typescript
// utils/networkUtils.ts
export const NETWORK_PREFIXES = {
  mtn: ['0803', '0806', '0703', '0706', '0813', '0816', '0903', '0906'],
  glo: ['0805', '0807', '0705', '0811', '0815', '0905'],
  airtel: ['0802', '0808', '0708', '0812', '0902', '0907', '0901', '0912'],
  '9mobile': ['0809', '0817', '0818', '0908', '0909'],
};

export const detectNetwork = (phoneNumber: string): string | null => {
  if (!phoneNumber) return null;

  // Clean the phone number
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Handle different formats
  let prefix = '';
  if (cleanNumber.startsWith('234')) {
    prefix = cleanNumber.substring(3, 6);
  } else if (cleanNumber.startsWith('0')) {
    prefix = cleanNumber.substring(1, 4);
  } else {
    return null;
  }

  // Find matching network
  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return network;
    }
  }

  return null;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.length === 11) {
    return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 7)} ${cleanNumber.slice(7)}`;
  }
  return phoneNumber;
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return cleanNumber.length === 11 && /^[0-9]+$/.test(cleanNumber);
};
```

### React Query Hooks
Create custom hooks for airtime operations:

```typescript
// hooks/useAirtime.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { detectNetwork } from '../utils/networkUtils';

export const usePurchaseAirtime = () => {
  return useMutation({
    mutationFn: async (data: {
      phone: string;
      amount: number;
      transactionPin: string;
      provider?: string;
    }) => {
      const network = detectNetwork(data.phone);
      if (!network) {
        throw new Error('Unable to detect network from phone number');
      }

      const result = await apiClient.purchaseAirtime({
        serviceID: network,
        amount: data.amount,
        phone: data.phone,
        provider: data.provider,
        transactionPin: data.transactionPin,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Handle success (show toast, update balance, etc.)
      console.log('Airtime purchase successful:', data);
    },
    onError: (error: any) => {
      // Handle error (show error message)
      console.error('Airtime purchase failed:', error.message);
    },
  });
};

export const usePurchaseLimits = () => {
  return useQuery({
    queryKey: ['purchaseLimits'],
    queryFn: async () => {
      const result = await apiClient.getPurchaseLimits();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAirtimeSettings = () => {
  return useQuery({
    queryKey: ['airtimeSettings'],
    queryFn: async () => {
      const result = await apiClient.getAirtimeSettings();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### HTTP Request Flow
1. **Authentication**: JWT token is automatically added to request headers
2. **Request Validation**: Client-side validation before sending request
3. **Network Detection**: Automatic network detection from phone number
4. **Error Handling**: Comprehensive error handling for different scenarios
5. **Token Refresh**: Automatic token refresh on 401 responses
6. **Retry Logic**: Built-in retry for failed requests
7. **Timeout Handling**: 30-second timeout for airtime purchases
## 4. Handling Request Parameters, Authentication, and Response Parsing

### Request Parameter Validation
Create comprehensive validation for airtime purchase requests:

```typescript
// utils/validation.ts
export interface AirtimePurchaseData {
  phone: string;
  amount: number;
  transactionPin: string;
  provider?: string;
}

export const validateAirtimePurchase = (data: AirtimePurchaseData): {
  isValid: boolean;
  errors: string[];
  validatedData?: {
    serviceID: string;
    amount: number;
    phone: string;
    provider?: string;
    transactionPin: string;
  };
} => {
  const errors: string[] = [];

  // Phone number validation
  if (!data.phone || !validatePhoneNumber(data.phone)) {
    errors.push('Please enter a valid 11-digit phone number');
  }

  // Amount validation
  if (!data.amount || data.amount < 50) {
    errors.push('Minimum purchase amount is ₦50');
  }

  if (data.amount > 50000) {
    errors.push('Maximum purchase amount is ₦50,000');
  }

  // Transaction PIN validation
  if (!data.transactionPin || data.transactionPin.length !== 4) {
    errors.push('Please enter a valid 4-digit transaction PIN');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Network detection
  const network = detectNetwork(data.phone);
  if (!network) {
    return {
      isValid: false,
      errors: ['Unable to detect network from phone number. Please check the number.']
    };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: {
      serviceID: network,
      amount: Math.round(data.amount), // Ensure integer
      phone: data.phone.replace(/\D/g, ''), // Clean phone number
      provider: data.provider,
      transactionPin: data.transactionPin,
    },
  };
};
```

### Authentication Flow
Implement secure authentication handling:

```typescript
// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

export class AuthService {
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  static async validateSession(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      // Make a lightweight request to validate token
      await apiClient.request({
        method: 'GET',
        url: '/users/profile',
        headers: { Authorization: `Bearer ${token}` },
      });

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const response = await apiClient.request({
        method: 'POST',
        url: '/auth/refresh',
        data: { refreshToken },
      });

      const { token, refreshToken: newRefreshToken } = response.data;

      await AsyncStorage.setItem('auth_token', token);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
      }

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  static async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      // Dispatch logout action if using Redux
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
```

### Response Parsing and Data Transformation
Handle API responses with proper data transformation:

```typescript
// types/airtime.ts
export interface AirtimePurchaseRequest {
  serviceID: string;
  amount: number;
  phone: string;
  provider?: string;
  transactionPin: string;
}

export interface AirtimePurchaseResponse {
  message: string;
  provider: string;
  network: string;
  transaction: {
    requestId: string;
    status: 'pending' | 'delivered' | 'failed';
    amount: number;
    recipient: string;
    timestamp: string;
  };
  newBalance: number;
}

export interface ApiError {
  success: false;
  error: string;
  status: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

```typescript
// utils/responseParser.ts
import { AirtimePurchaseResponse, ApiResponse } from '../types/airtime';

export const parseAirtimeResponse = (response: any): ApiResponse<AirtimePurchaseResponse> => {
  try {
    if (response.success !== false && response.message) {
      // Success response
      return {
        success: true,
        data: {
          message: response.message,
          provider: response.provider || 'Unknown',
          network: response.network || 'Unknown',
          transaction: {
            requestId: response.transaction?.requestId || '',
            status: response.transaction?.status || 'pending',
            amount: response.transaction?.amount || 0,
            recipient: response.transaction?.recipient || '',
            timestamp: response.transaction?.timestamp || new Date().toISOString(),
          },
          newBalance: response.newBalance || 0,
        },
      };
    } else {
      // Error response
      return {
        success: false,
        error: response.message || response.error || 'Unknown error occurred',
        status: response.status || 500,
      };
    }
  } catch (error) {
    console.error('Response parsing error:', error);
    return {
      success: false,
      error: 'Failed to parse response',
      status: 500,
    };
  }
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return !error?.response && (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network'));
};

export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};
```

### Complete Purchase Flow Implementation
Integrate all components in the purchase flow:

```typescript
// hooks/useAirtimePurchase.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { validateAirtimePurchase } from '../utils/validation';
import { parseAirtimeResponse, getErrorMessage, isNetworkError, isAuthError } from '../utils/responseParser';
import { AirtimePurchaseData } from '../types/airtime';

export const useAirtimePurchase = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async (data: AirtimePurchaseData) => {
      // Validate input data
      const validation = validateAirtimePurchase(data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error(validation.errors.join(', '));
      }

      setValidationErrors([]);

      // Make API call
      const result = await apiClient.purchaseAirtime(validation.validatedData!);

      // Parse response
      const parsedResponse = parseAirtimeResponse(result);

      if (!parsedResponse.success) {
        throw new Error(parsedResponse.error);
      }

      return parsedResponse.data;
    },
    onSuccess: (data) => {
      console.log('Purchase successful:', data);
      // Handle success (update UI, show success message, etc.)
    },
    onError: (error: any) => {
      console.error('Purchase failed:', error);

      let errorMessage = getErrorMessage(error);

      if (isNetworkError(error)) {
        errorMessage = 'Network connection failed. Please check your internet and try again.';
      } else if (isAuthError(error)) {
        errorMessage = 'Session expired. Please log in again.';
      }

      // Handle error (show error message, retry logic, etc.)
    },
  });

  return {
    ...mutation,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
  };
};
```

### Request Parameter Mapping
Map UI inputs to API parameters:

```typescript
// utils/requestMapper.ts
export const mapToAirtimeRequest = (formData: {
  phoneNumber: string;
  amount: string;
  selectedNetwork?: string;
  transactionPin: string;
  preferredProvider?: string;
}): AirtimePurchaseData => {
  return {
    phone: formData.phoneNumber,
    amount: parseInt(formData.amount.replace(/\D/g, '')),
    transactionPin: formData.transactionPin,
    provider: formData.preferredProvider,
  };
};

export const formatAmount = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

export const formatPhoneForDisplay = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return phone;
};
```
## 5. Error Handling and User Feedback Mechanisms

### Comprehensive Error Handling Strategy
Implement robust error handling for different failure scenarios:

```typescript
// utils/errorHandler.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_PIN = 'INVALID_PIN',
  PURCHASE_LIMIT_EXCEEDED = 'PURCHASE_LIMIT_EXCEEDED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  retryable: boolean;
  actionRequired?: string;
}

export const parseError = (error: any): AppError => {
  // Network errors
  if (isNetworkError(error)) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network connection failed',
      userMessage: 'Please check your internet connection and try again.',
      retryable: true,
    };
  }

  // Authentication errors
  if (isAuthError(error)) {
    return {
      type: ErrorType.AUTH_ERROR,
      message: 'Authentication failed',
      userMessage: 'Your session has expired. Please log in again.',
      statusCode: error?.response?.status,
      retryable: false,
      actionRequired: 'LOGIN',
    };
  }

  // Server errors
  if (error?.response?.status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: 'Server error',
      userMessage: 'Service temporarily unavailable. Please try again in a few minutes.',
      statusCode: error.response.status,
      retryable: true,
    };
  }

  // Client errors with specific messages
  if (error?.response?.data?.message) {
    const serverMessage = error.response.data.message.toLowerCase();

    if (serverMessage.includes('insufficient balance') || serverMessage.includes('low balance')) {
      return {
        type: ErrorType.INSUFFICIENT_BALANCE,
        message: 'Insufficient balance',
        userMessage: 'Your wallet balance is not enough for this purchase. Please top up your wallet.',
        statusCode: error.response.status,
        retryable: false,
        actionRequired: 'FUND_WALLET',
      };
    }

    if (serverMessage.includes('invalid pin') || serverMessage.includes('wrong pin')) {
      return {
        type: ErrorType.INVALID_PIN,
        message: 'Invalid PIN',
        userMessage: 'The transaction PIN you entered is incorrect. Please try again.',
        statusCode: error.response.status,
        retryable: true,
      };
    }

    if (serverMessage.includes('limit') || serverMessage.includes('maximum')) {
      return {
        type: ErrorType.PURCHASE_LIMIT_EXCEEDED,
        message: 'Purchase limit exceeded',
        userMessage: 'You have exceeded your daily or monthly purchase limit.',
        statusCode: error.response.status,
        retryable: false,
      };
    }

    if (serverMessage.includes('provider') || serverMessage.includes('service unavailable')) {
      return {
        type: ErrorType.PROVIDER_UNAVAILABLE,
        message: 'Provider unavailable',
        userMessage: 'The airtime service is temporarily unavailable. Please try again later.',
        statusCode: error.response.status,
        retryable: true,
      };
    }

    // Generic client error
    return {
      type: ErrorType.VALIDATION_ERROR,
      message: error.response.data.message,
      userMessage: error.response.data.message,
      statusCode: error.response.status,
      retryable: false,
    };
  }

  // Timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      message: 'Request timeout',
      userMessage: 'The request took too long. Please try again.',
      retryable: true,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
};
```

### User Feedback Components
Create reusable components for displaying feedback:

```typescript
// components/FeedbackToast.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeedbackToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}

export const FeedbackToast: React.FC<FeedbackToastProps> = ({
  visible,
  type,
  message,
  actionText,
  onAction,
  onClose,
  duration = 4000,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, duration, onClose]);

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#10B981', icon: 'checkmark-circle' };
      case 'error':
        return { backgroundColor: '#EF4444', icon: 'close-circle' };
      case 'warning':
        return { backgroundColor: '#F59E0B', icon: 'warning' };
      case 'info':
        return { backgroundColor: '#3B82F6', icon: 'information-circle' };
      default:
        return { backgroundColor: '#6B7280', icon: 'information-circle' };
    }
  };

  const { backgroundColor, icon } = getToastStyle();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 0],
          }),
        }],
      }}
      className="absolute top-4 left-4 right-4 z-50"
    >
      <View
        style={{ backgroundColor }}
        className="flex-row items-center p-4 rounded-lg shadow-lg"
      >
        <Ionicons name={icon as any} size={24} color="white" />
        <Text className="flex-1 text-white font-medium ml-3">{message}</Text>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} className="ml-3">
            <Text className="text-white font-semibold underline">{actionText}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onClose} className="ml-3">
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
```

```typescript
// components/ErrorModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppError, ErrorType } from '../utils/errorHandler';

interface ErrorModalProps {
  visible: boolean;
  error: AppError | null;
  onClose: () => void;
  onRetry?: () => void;
  onAction?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  error,
  onClose,
  onRetry,
  onAction,
}) => {
  if (!error || !visible) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'wifi';
      case ErrorType.AUTH_ERROR:
        return 'log-out';
      case ErrorType.INSUFFICIENT_BALANCE:
        return 'wallet';
      case ErrorType.INVALID_PIN:
        return 'key';
      case ErrorType.PURCHASE_LIMIT_EXCEEDED:
        return 'speedometer';
      default:
        return 'alert-circle';
    }
  };

  const getActionButton = () => {
    if (error.actionRequired === 'LOGIN') {
      return (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onAction}
        >
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>
      );
    }

    if (error.actionRequired === 'FUND_WALLET') {
      return (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onAction}
        >
          <Text style={styles.primaryButtonText}>Fund Wallet</Text>
        </TouchableOpacity>
      );
    }

    if (error.retryable && onRetry) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onRetry}
        >
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getErrorIcon() as any}
              size={48}
              color="#EF4444"
            />
          </View>

          <Text style={styles.title}>Oops!</Text>
          <Text style={styles.message}>{error.userMessage}</Text>

          <View style={styles.buttonContainer}>
            {getActionButton()}
            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={onClose}
            >
              <Text style={styles.outlineButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    maxWidth: 400,
    width: '90%',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  outlineButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Loading States and Progress Indicators
Implement loading states for better user experience:

```typescript
// components/LoadingOverlay.tsx
import React from 'react';
import { View, ActivityIndicator, Text, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
}) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white p-6 rounded-lg items-center min-w-[200px]">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600 font-medium">{message}</Text>
        </View>
      </View>
    </Modal>
  );
};
```

### Error Boundary for Crash Prevention
Implement error boundaries to handle unexpected errors:

```typescript
// components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Something went wrong</Text>
          <Text className="text-gray-600 text-center mb-6">
            We encountered an unexpected error. Please try again.
          </Text>
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={this.resetError}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
```

### Integration in Airtime Screen
Update the airtime screen to use comprehensive error handling:

```typescript
// app/services/airtime/index.tsx (updated)
const AirtimeScreen = () => {
  // ... existing state ...
  const [error, setError] = useState<AppError | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const purchaseMutation = usePurchaseAirtime();

  const handlePurchase = async () => {
    if (!canPurchase) return;

    setShowPINModal(true);
  };

  const handlePINSubmit = async (pin: string) => {
    setIsProcessing(true);
    setTransactionError('');

    try {
      await purchaseMutation.mutateAsync({
        phone: phoneNumber,
        amount: parseInt(amount),
        transactionPin: pin,
      });

      // Success handling
      setTransactionSuccess(true);
      setSuccessMessage(`Successfully purchased ₦${parseInt(amount).toLocaleString()} airtime`);
      setTimeout(() => {
        setShowPINModal(false);
        setTransactionSuccess(false);
        setShowSuccessToast(true);
        router.back();
      }, 2000);

    } catch (error: any) {
      const parsedError = parseError(error);
      setError(parsedError);
      setShowErrorModal(true);
      setTransactionError(parsedError.userMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleErrorModalAction = () => {
    if (error?.actionRequired === 'LOGIN') {
      router.replace('/auth/login');
    } else if (error?.actionRequired === 'FUND_WALLET') {
      router.push('/wallet/fund');
    }
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    setError(null);
    // Optionally retry the purchase
  };

  return (
    <ErrorBoundary>
      {/* ... existing JSX ... */}

      <ErrorModal
        visible={showErrorModal}
        error={error}
        onClose={() => setShowErrorModal(false)}
        onRetry={error?.retryable ? handleRetry : undefined}
        onAction={error?.actionRequired ? handleErrorModalAction : undefined}
      />

      <FeedbackToast
        visible={showSuccessToast}
        type="success"
        message={successMessage}
        onClose={() => setShowSuccessToast(false)}
      />

      <LoadingOverlay
        visible={purchaseMutation.isPending}
        message="Processing your airtime purchase..."
      />
    </ErrorBoundary>
  );
};
```
## 6. Security Considerations

### Data Encryption and Secure Storage
Implement secure storage for sensitive data:

```typescript
// services/secureStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export class SecureStorage {
  // Use SecureStore for sensitive data on iOS/Android
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to AsyncStorage on web
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      }
    } catch (error) {
      console.error('Error storing secure item:', error);
      throw error;
    }
  }

  static async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      return null;
    }
  }

  static async deleteSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error deleting secure item:', error);
    }
  }

  // Store tokens securely
  static async storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await this.setSecureItem('auth_token', accessToken);
    if (refreshToken) {
      await this.setSecureItem('refresh_token', refreshToken);
    }
  }

  static async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const accessToken = await this.getSecureItem('auth_token');
    const refreshToken = await this.getSecureItem('refresh_token');
    return { accessToken, refreshToken };
  }

  static async clearTokens(): Promise<void> {
    await this.deleteSecureItem('auth_token');
    await this.deleteSecureItem('refresh_token');
  }
}
```

### Transaction PIN Security
Implement secure PIN handling:

```typescript
// components/SecurePINInput.tsx
import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SecurePINInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  length?: number;
  error?: string;
}

export const SecurePINInput: React.FC<SecurePINInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  length = 4,
  error,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (value.length === length && onSubmit) {
      onSubmit();
    }
  };

  return (
    <View className="w-full">
      <TouchableOpacity
        onPress={handlePress}
        className={`flex-row justify-center items-center p-4 border-2 rounded-lg ${
          focused ? 'border-blue-500' : 'border-gray-300'
        } ${error ? 'border-red-500' : ''}`}
      >
        {Array.from({ length }, (_, index) => (
          <View
            key={index}
            className={`w-12 h-12 mx-2 rounded-lg border-2 flex items-center justify-center ${
              value.length > index
                ? 'bg-blue-500 border-blue-500'
                : 'border-gray-300'
            }`}
          >
            {value.length > index ? (
              <Ionicons name="ellipse" size={16} color="white" />
            ) : (
              <View className="w-3 h-3 rounded-full border-2 border-gray-400" />
            )}
          </View>
        ))}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const numericText = text.replace(/\D/g, '').slice(0, length);
          onChangeText(numericText);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={handleSubmit}
        keyboardType="numeric"
        secureTextEntry
        maxLength={length}
        className="absolute opacity-0"
        autoFocus
      />

      {error && (
        <Text className="text-red-500 text-sm mt-2 text-center">{error}</Text>
      )}
    </View>
  );
};
```

### API Request Encryption
Ensure HTTPS and secure communication:

```typescript
// services/api.ts (enhanced security)
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Prevent CSRF
      },
      // Ensure HTTPS
      httpsAgent: {
        rejectUnauthorized: true, // Only accept valid SSL certificates
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor with security headers
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStorage.getSecureItem('auth_token');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add security headers
        config.headers['X-Client-Version'] = '1.0.0';
        config.headers['X-Platform'] = Platform.OS;
        config.headers['X-Timestamp'] = Date.now().toString();

        // Add request ID for tracking
        config.headers['X-Request-ID'] = generateRequestId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with security validation
    this.client.interceptors.response.use(
      (response) => {
        // Validate response integrity
        if (response.data && typeof response.data === 'object') {
          // Check for expected response structure
          if (response.data.hasOwnProperty('success') === false) {
            console.warn('Response missing success field');
          }
        }

        return response;
      },
      async (error) => {
        // Handle security-related errors
        if (error.response?.status === 401) {
          // Token might be compromised
          await SecureStorage.clearTokens();
        }

        return Promise.reject(error);
      }
    );
  }

  // Secure purchase method with additional validation
  async purchaseAirtime(data: {
    serviceID: string;
    amount: number;
    phone: string;
    provider?: string;
    transactionPin: string;
  }) {
    // Validate input data client-side
    if (!this.validatePurchaseData(data)) {
      throw new Error('Invalid purchase data');
    }

    try {
      const response = await this.client.post('/airtime', {
        ...data,
        // Add client-side checksum for additional security
        checksum: this.generateChecksum(data),
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      // Log security events
      if (error.response?.status === 401) {
        console.warn('Security: Unauthorized access attempt');
      }

      return {
        success: false,
        error: error.response?.data?.message || 'Purchase failed',
        status: error.response?.status,
      };
    }
  }

  private validatePurchaseData(data: any): boolean {
    // Validate phone number format
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(data.phone)) {
      return false;
    }

    // Validate amount
    if (data.amount < 50 || data.amount > 50000) {
      return false;
    }

    // Validate PIN
    if (!/^\d{4}$/.test(data.transactionPin)) {
      return false;
    }

    return true;
  }

  private generateChecksum(data: any): string {
    // Simple checksum for request integrity
    const payload = JSON.stringify({
      serviceID: data.serviceID,
      amount: data.amount,
      phone: data.phone,
      timestamp: Date.now(),
    });

    // In production, use a proper hashing algorithm
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }
}
```

### Biometric Authentication
Add biometric authentication for enhanced security:

```typescript
// services/biometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricAuth {
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  }

  static async authenticate(reason: string = 'Confirm your identity'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  static async getBiometricType(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
      return 'Biometric';
    } catch (error) {
      return 'Biometric';
    }
  }
}
```

### Certificate Pinning
Implement certificate pinning for additional security:

```typescript
// services/certificatePinning.ts
import axios from 'axios';

// Certificate pinning configuration
const CERTIFICATE_PIN = 'sha256/YOUR_CERTIFICATE_PIN_HERE'; // Replace with actual pin

export const createPinnedClient = () => {
  return axios.create({
    // In React Native, certificate pinning is typically handled at the native level
    // This is a placeholder for the concept
    httpsAgent: {
      // Certificate pinning would be implemented here
      // This requires native module implementation for React Native
    },
  });
};
```

### Security Best Practices
Additional security measures to implement:

```typescript
// utils/securityUtils.ts
export const SecurityUtils = {
  // Sanitize user inputs
  sanitizeInput: (input: string): string => {
    return input.replace(/[<>'"&]/g, '');
  },

  // Mask sensitive data in logs
  maskSensitiveData: (data: any): any => {
    if (typeof data === 'string' && data.length > 4) {
      return data.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2');
    }
    return data;
  },

  // Generate secure random strings
  generateSecureId: (): string => {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  },

  // Validate request origin
  validateOrigin: (origin: string): boolean => {
    const allowedOrigins = ['https://ohtopup.onrender.com'];
    return allowedOrigins.includes(origin);
  },

  // Rate limiting (client-side)
  createRateLimiter: (maxRequests: number, windowMs: number) => {
    const requests: number[] = [];

    return () => {
      const now = Date.now();
      requests.push(now);

      // Remove old requests
      while (requests.length > 0 && requests[0] < now - windowMs) {
        requests.shift();
      }

      return requests.length <= maxRequests;
    };
  },
};
```

### Security Monitoring and Logging
Implement security event logging:

```typescript
// services/securityLogger.ts
export class SecurityLogger {
  static logSecurityEvent(event: string, details: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: SecurityUtils.maskSensitiveData(details),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      },
    };

    console.log('Security Event:', logEntry);

    // In production, send to security monitoring service
    // this.sendToSecurityService(logEntry);
  }

  static logFailedLogin(attemptDetails: any) {
    this.logSecurityEvent('FAILED_LOGIN_ATTEMPT', attemptDetails);
  }

  static logSuspiciousActivity(activity: string, details: any) {
    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', { activity, ...details });
  }

  static logTokenCompromise(details: any) {
    this.logSecurityEvent('TOKEN_COMPROMISE', details);
  }
}
```

### Secure Data Transmission
Ensure all data is transmitted securely:

```typescript
// Ensure all API calls use HTTPS
const BASE_URL = 'https://ohtopup.onrender.com/api';

// Validate SSL certificates
const httpsConfig = {
  rejectUnauthorized: true,
  // Additional SSL/TLS configuration
};

// Implement request signing for critical operations
export const signRequest = (data: any, secretKey
## 7. Testing Strategies

### Unit Testing
Implement comprehensive unit tests for all components:

```typescript
// __tests__/utils/networkUtils.test.ts
import { detectNetwork, validatePhoneNumber, formatPhoneNumber } from '../../utils/networkUtils';

describe('Network Utils', () => {
  describe('detectNetwork', () => {
    test('should detect MTN numbers correctly', () => {
      expect(detectNetwork('08031234567')).toBe('mtn');
      expect(detectNetwork('07031234567')).toBe('mtn');
      expect(detectNetwork('09031234567')).toBe('mtn');
    });

    test('should detect Glo numbers correctly', () => {
      expect(detectNetwork('08051234567')).toBe('glo');
      expect(detectNetwork('07051234567')).toBe('glo');
      expect(detectNetwork('09051234567')).toBe('glo');
    });

    test('should detect Airtel numbers correctly', () => {
      expect(detectNetwork('08021234567')).toBe('airtel');
      expect(detectNetwork('09021234567')).toBe('airtel');
    });

    test('should detect 9Mobile numbers correctly', () => {
      expect(detectNetwork('08091234567')).toBe('9mobile');
      expect(detectNetwork('09091234567')).toBe('9mobile');
    });

    test('should return null for invalid numbers', () => {
      expect(detectNetwork('08001234567')).toBeNull();
      expect(detectNetwork('123456789')).toBeNull();
    });
  });

  describe('validatePhoneNumber', () => {
    test('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('08031234567')).toBe(true);
      expect(validatePhoneNumber('2348031234567')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('0803123456')).toBe(false); // Too short
      expect(validatePhoneNumber('080312345678')).toBe(false); // Too long
      expect(validatePhoneNumber('abcdefghijk')).toBe(false); // Non-numeric
    });
  });

  describe('formatPhoneNumber', () => {
    test('should format phone numbers correctly', () => {
      expect(formatPhoneNumber('08031234567')).toBe('0803 123 4567');
      expect(formatPhoneNumber('8031234567')).toBe('0803 123 4567');
    });
  });
});
```

```typescript
// __tests__/utils/validation.test.ts
import { validateAirtimePurchase } from '../../utils/validation';

describe('Airtime Purchase Validation', () => {
  test('should validate correct purchase data', () => {
    const validData = {
      phone: '08031234567',
      amount: 1000,
      transactionPin: '1234',
    };

    const result = validateAirtimePurchase(validData);
    expect(result.isValid).toBe(true);
    expect(result.validatedData).toBeDefined();
  });

  test('should reject invalid phone numbers', () => {
    const invalidData = {
      phone: '0803123456', // Too short
      amount: 1000,
      transactionPin: '1234',
    };

    const result = validateAirtimePurchase(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Please enter a valid 11-digit phone number');
  });

  test('should reject amounts below minimum', () => {
    const invalidData = {
      phone: '08031234567',
      amount: 10, // Below minimum
      transactionPin: '1234',
    };

    const result = validateAirtimePurchase(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Minimum purchase amount is ₦50');
  });

  test('should reject invalid PINs', () => {
    const invalidData = {
      phone: '08031234567',
      amount: 1000,
      transactionPin: '123', // Too short
    };

    const result = validateAirtimePurchase(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Please enter a valid 4-digit transaction PIN');
  });
});
```

### API Client Testing
Test API client functionality with mocks:

```typescript
// __tests__/services/api.test.ts
import axios from 'axios';
import { apiClient } from '../../services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('purchaseAirtime', () => {
    test('should successfully purchase airtime', async () => {
      const mockResponse = {
        data: {
          message: 'Airtime purchase successful',
          provider: 'VTPass',
          network: 'mtn',
          transaction: {
            requestId: 'REQ_123456789',
            status: 'delivered',
            amount: 1000,
          },
          newBalance: 5000,
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await apiClient.purchaseAirtime({
        serviceID: 'mtn',
        amount: 1000,
        phone: '08031234567',
        transactionPin: '1234',
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Airtime purchase successful');
    });

    test('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid transaction PIN.',
          },
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await apiClient.purchaseAirtime({
        serviceID: 'mtn',
        amount: 1000,
        phone: '08031234567',
        transactionPin: '1234',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid transaction PIN.');
      expect(result.status).toBe(400);
    });

    test('should handle network errors', async () => {
      const mockError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await apiClient.purchaseAirtime({
        serviceID: 'mtn',
        amount: 1000,
        phone: '08031234567',
        transactionPin: '1234',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network connection failed');
    });
  });
});
```

### Component Testing
Test React components with React Testing Library:

```typescript
// __tests__/components/AirtimeScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AirtimeScreen } from '../../app/services/airtime/index';
import { usePurchaseAirtime } from '../../hooks/useAirtime';

// Mock the hook
jest.mock('../../hooks/useAirtime');
const mockUsePurchaseAirtime = usePurchaseAirtime as jest.MockedFunction<typeof usePurchaseAirtime>;

describe('AirtimeScreen', () => {
  beforeEach(() => {
    mockUsePurchaseAirtime.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: null,
    });
  });

  test('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<AirtimeScreen />);

    expect(getByText('Buy Airtime')).toBeTruthy();
    expect(getByPlaceholderText('08031234567')).toBeTruthy();
    expect(getByText('Select Network')).toBeTruthy();
  });

  test('should validate phone number input', () => {
    const { getByPlaceholderText, getByText } = render(<AirtimeScreen />);

    const phoneInput = getByPlaceholderText('08031234567');
    fireEvent.changeText(phoneInput, '0803123456'); // Invalid length

    // Should show validation error
    expect(getByText('Please enter a valid 11-digit phone number')).toBeTruthy();
  });

  test('should handle successful purchase', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      message: 'Purchase successful',
      transaction: { amount: 1000 },
    });

    mockUsePurchaseAirtime.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { getByText, getByPlaceholderText } = render(<AirtimeScreen />);

    // Fill form
    const phoneInput = getByPlaceholderText('08031234567');
    const amountInput = getByPlaceholderText('Enter custom amount');

    fireEvent.changeText(phoneInput, '08031234567');
    fireEvent.changeText(amountInput, '1000');

    // Submit purchase
    const purchaseButton = getByText('Purchase ₦1,000 Airtime');
    fireEvent.press(purchaseButton);

    // Should call the mutation
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        phone: '08031234567',
        amount: 1000,
        transactionPin: expect.any(String),
      });
    });
  });

  test('should handle purchase errors', async () => {
    const mockError = new Error('Invalid PIN');
    const mockMutateAsync = jest.fn().mockRejectedValue(mockError);

    mockUsePurchaseAirtime.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: mockError,
    });

    const { getByText } = render(<AirtimeScreen />);

    await waitFor(() => {
      expect(getByText('Invalid PIN')).toBeTruthy();
    });
  });
});
```

### Integration Testing
Test complete user flows:

```typescript
// __tests__/integration/AirtimePurchaseFlow.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { AirtimeScreen } from '../../app/services/airtime/index';

// Mock API client
jest.mock('../../services/api');

describe('Airtime Purchase Integration', () => {
  let queryClient: QueryClient;
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  test('complete purchase flow', async () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AirtimeScreen />
        </QueryClientProvider>
      </Provider>
    );

    // Step 1: Enter phone number
    const phoneInput = getByPlaceholderText('08031234567');
    fireEvent.changeText(phoneInput, '08031234567');

    // Step 2: Select network (should auto-detect MTN)
    await waitFor(() => {
      expect(getByText('MTN')).toBeTruthy();
    });

    // Step 3: Enter amount
    const amountInput = getByPlaceholderText('Enter custom amount');
    fireEvent.changeText(amountInput, '1000');

    // Step 4: Purchase button should be enabled
    const purchaseButton = getByText('Purchase ₦1,000 Airtime');
    expect(purchaseButton).not.toBeDisabled();

    // Step 5: Click purchase (would open PIN modal in real app)
    fireEvent.press(purchaseButton);

    // Verify the flow completed without errors
    await waitFor(() => {
      expect(queryClient.getQueryState(['purchaseLimits'])?.status).toBe('success');
    });
  });
});
```

### E2E Testing
End-to-end testing with Detox:

```typescript
// e2e/AirtimePurchase.e2e.ts
import { device, element, by, waitFor } from 'detox';

describe('Airtime Purchase', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete airtime purchase flow', async () => {
    // Navigate to airtime screen
    await element(by.text('Buy Airtime')).tap();

    // Enter phone number
    await element(by.id('phone-input')).typeText('08031234567');

    // Verify network auto-detection
    await waitFor(element(by.text('MTN'))).toBeVisible().withTimeout(5000);

    // Enter amount
    await element(by.id('amount-input')).typeText('1000');

    // Tap purchase button
    await element(by.id('purchase-button')).tap();

    // Enter PIN in modal
    await element(by.id('pin-input')).typeText('1234');

    // Submit PIN
    await element(by.id('submit-pin')).tap();

    // Wait for success message
    await waitFor(element(by.text('Purchase successful'))).toBeVisible().withTimeout(10000);
  });

  it('should handle invalid phone number', async () => {
    await element(by.text('Buy Airtime')).tap();

    // Enter invalid phone number
    await element(by.id('phone-input')).typeText('0803123456');

    // Try to purchase
    await element(by.id('purchase-button')).tap();

    // Should show error
    await waitFor(element(by.text('Please enter a valid 11-digit phone number')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle network errors', async () => {
    // Mock network failure
    await device.setURLBlacklist(['https://ohtopup.onrender.com/*']);

    await element(by.text('Buy Airtime')).tap();
    await element(by.id('phone-input')).typeText('08031234567');
    await element(by.id('amount-input')).typeText('1000');
    await element(by.id('purchase-button')).tap();
    await element(by.id('pin-input')).typeText('1234');
    await element(by.id('submit-pin')).tap();

    // Should show network error
    await waitFor(element(by.text('Network connection failed')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

### Test Configuration
Set up testing environment:

```typescript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.(ts|tsx|js)',
    '<rootDir>/app/**/*.(test|spec).(ts|tsx|js)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

```typescript
// jest.setup.js
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
}));

// Global test utilities
global.fetch = jest.fn();
```

### Performance Testing
Test app performance under load:

```typescript
// __tests__/performance/AirtimePerformance.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { AirtimeScreen } from '../../app/services/airtime/index';

describe('Airtime Performance', () => {
  test('should render within performance budget', () => {
    const startTime = performance.now();

    render(<AirtimeScreen />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('should handle rapid input changes', () => {
    const { getByPlaceholderText } = render(<AirtimeScreen />);
    const phoneInput = getByPlaceholderText('08031234567');

    const startTime = performance.now();

    // Simulate rapid typing
    for (let i = 0; i < 11; i++) {
      fireEvent.changeText(phoneInput, '0'.repeat(i + 1));
    }

    const endTime = performance.now();
    const inputTime = endTime - startTime;

    // Should handle input within 50ms
    expect(inputTime).toBeLessThan(50);
  });
});
```

### CI/CD Testing
GitHub Actions workflow for automated testing:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage --watchAll=false

      - name: Run build
        run: npm run build

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Cache Detox
        uses: actions/cache@v3
        with:
          path: ~/.detox
          key: detox-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - name: Run E2E tests
        run: npm run e2e
```

### Test Data Management
Create test data utilities:

```typescript
// __tests__/utils/testData.ts
export const validPhoneNumbers = {
  mtn: ['08031234567', '07031234567', '09031234567'],
  glo: ['08051234567', '07051234567', '09051234567'],
  airtel: ['08021234567', '09021234567', '09071234567'],
  '9mobile': ['08091234567', '09091234567', '09081234567'],
};

export const invalidPhoneNumbers = [
  '0803123456',    // Too short
  '080312345678',  // Too long
  'abcdefghijk',   // Non-numeric
  '08001234567',   // Invalid prefix
];

export const testAmounts = {
  valid: [50, 100, 500, 1000, 5000, 50000],
  invalid: {
    tooLow: [10, 25, 49],
    tooHigh: [50001, 100000],
  },
};

export const mockApiResponses = {
  success: {
    message: 'Airtime purchase successful',
    provider: 'VTPass',
    network: 'mtn',
    transaction: {
      requestId: 'REQ_123456789',
      status: 'delivered',
      amount: 1000,
      recipient: '08031234567',
    },
    newBalance: 5000,
  },
  insufficientBalance: {
    message: 'Insufficient wallet balance',
  },
  invalidPin: {
    message: 'Invalid transaction PIN.',
  },
  networkError: {
    code: 'NETWORK_ERROR',
    message: 'Network Error',
  },
};
```
## 8. Best Practices for Performance Optimization and Offline Support

### Performance Optimization

#### Code Splitting and Lazy Loading
Implement code splitting for better performance:

```typescript
// app/services/airtime/index.tsx (optimized)
import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Lazy load components
const TransactionPINModal = lazy(() => import('../../../components/TransactionPINModal'));

const AirtimeScreen = () => {
  const [showPINModal, setShowPINModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* ... existing code ... */}

      <Suspense fallback={<ActivityIndicator size="large" color="#3B82F6" />}>
        {showPINModal && (
          <TransactionPINModal
            visible={showPINModal}
            onClose={() => setShowPINModal(false)}
            onSubmit={handlePINSubmit}
            isProcessing={isProcessing}
            error={transactionError}
            success={transactionSuccess}
            onSuccessComplete={() => {
              setShowPINModal(false);
              setTransactionSuccess(false);
              router.back();
            }}
          />
        )}
      </Suspense>
    </View>
  );
};
```

#### Memoization and Optimization Hooks
Use React optimization hooks:

```typescript
// hooks/useAirtimeForm.ts
import { useState, useCallback, useMemo } from 'react';
import { detectNetwork, validatePhoneNumber } from '../utils/networkUtils';

export const useAirtimeForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');

  // Memoize network detection
  const detectedNetwork = useMemo(() => {
    return phoneNumber.length >= 4 ? detectNetwork(phoneNumber) : null;
  }, [phoneNumber]);

  // Memoize validation
  const isValidPhone = useMemo(() => {
    return validatePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  const isValidAmount = useMemo(() => {
    const numAmount = parseInt(amount);
    return numAmount >= 50 && numAmount <= 50000;
  }, [amount]);

  // Memoize form validity
  const canPurchase = useMemo(() => {
    return isValidPhone && isValidAmount && selectedNetwork;
  }, [isValidPhone, isValidAmount, selectedNetwork]);

  // Optimized handlers
  const handlePhoneChange = useCallback((value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(cleanValue);
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    setAmount(cleanValue);
  }, []);

  return {
    phoneNumber,
    amount,
    selectedNetwork,
    detectedNetwork,
    canPurchase,
    handlePhoneChange,
    handleAmountChange,
    setSelectedNetwork,
  };
};
```

#### Image and Asset Optimization
Optimize images and assets:

```typescript
// utils/imageOptimizer.ts
import { Image } from 'expo-image';

export const OptimizedImage = ({ source, style, ...props }) => {
  return (
    <Image
      source={source}
      style={style}
      placeholder={require('../assets/network-placeholder.png')}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      {...props}
    />
  );
};

// Preload critical images
export const preloadImages = () => {
  Image.prefetch([
    require('../assets/mtn-logo.png'),
    require('../assets/glo-logo.png'),
    require('../assets/airtel-logo.png'),
    require('../assets/9mobile-logo.png'),
  ]);
};
```

#### API Response Caching
Implement intelligent caching:

```typescript
// services/cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class ApiCache {
  private static CACHE_PREFIX = 'api_cache_';
  private static DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static async set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(
        this.CACHE_PREFIX + key,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async get(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        await this.delete(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async delete(key: string) {
    try {
      await AsyncStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}
```

### Offline Support Implementation

#### Offline Queue System
Implement offline transaction queuing:

```typescript
// services/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface QueuedTransaction {
  id: string;
  type: 'airtime_purchase';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineQueue {
  private static QUEUE_KEY = 'offline_queue';
  private static MAX_RETRIES = 3;

  static async addTransaction(data: any): Promise<string> {
    const transaction: QueuedTransaction = {
      id: generateId(),
      type: 'airtime_purchase',
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    const queue = await this.getQueue();
    queue.push(transaction);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

    return transaction.id;
  }

  static async getQueue(): Promise<QueuedTransaction[]> {
    try {
      const queue = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  static async processQueue(): Promise<void> {
    const isConnected = await this.checkConnectivity();
    if (!isConnected) return;

    const queue = await this.getQueue();
    const remainingTransactions: QueuedTransaction[] = [];

    for (const transaction of queue) {
      try {
        await this.processTransaction(transaction);
      } catch (error) {
        console.error(`Failed to process transaction ${transaction.id}:`, error);

        transaction.retryCount++;
        if (transaction.retryCount < transaction.maxRetries) {
          remainingTransactions.push(transaction);
        } else {
          // Handle failed transaction (notify user, etc.)
          console.warn(`Transaction ${transaction.id} failed permanently`);
        }
      }
    }

    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(remainingTransactions));
  }

  private static async processTransaction(transaction: QueuedTransaction): Promise<void> {
    switch (transaction.type) {
      case 'airtime_purchase':
        const result = await apiClient.purchaseAirtime(transaction.data);
        if (!result.success) {
          throw new Error(result.error);
        }
        break;
      default:
        throw new Error(`Unknown transaction type: ${transaction.type}`);
    }
  }

  private static async checkConnectivity(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  static async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.QUEUE_KEY);
  }
}
```

#### Network State Monitoring
Monitor network connectivity:

```typescript
// hooks/useNetworkState.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkState = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    connectionType,
    isOnline: isConnected === true,
    isOffline: isConnected === false,
  };
};
```

#### Offline Indicator Component
Display offline status to users:

```typescript
// components/OfflineIndicator.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useNetworkState } from '../hooks/useNetworkState';

export const OfflineIndicator: React.FC = () => {
  const { isOffline } = useNetworkState();

  if (!isOffline) return null;

  return (
    <View className="bg-red-500 px-4 py-2">
      <Text className="text-white text-center font-medium">
        You're offline. Some features may not be available.
      </Text>
    </View>
  );
};
```

#### Offline Data Synchronization
Sync data when connection is restored:

```typescript
// services/syncManager.ts
import { OfflineQueue } from './offlineQueue';
import { ApiCache } from './cache';

export class SyncManager {
  private static syncInProgress = false;

  static async syncOnReconnect(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      // Process offline queue
      await OfflineQueue.processQueue();

      // Refresh cached data
      await this.refreshCriticalData();

      // Notify user of successful sync
      console.log('Data synchronization completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async refreshCriticalData(): Promise<void> {
    try {
      // Clear stale cache
      await ApiCache.clear();

      // Refresh user profile, wallet balance, etc.
      // Implementation depends on your app's data requirements
    } catch (error) {
      console.error('Failed to refresh critical data:', error);
    }
  }

  static async forceSync(): Promise<void> {
    await this.syncOnReconnect();
  }
}
```

### Memory Management

#### Component Cleanup
Proper cleanup to prevent memory leaks:

```typescript
// hooks/usePurchaseFlow.ts
import { useEffect, useRef } from 'react';
import { usePurchaseAirtime } from './useAirtime';

export const usePurchaseFlow = () => {
  const mutation = usePurchaseAirtime();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePurchase = async (data: any) => {
    try {
      const result = await mutation.mutateAsync(data);

      // Set success timeout
      timeoutRef.current = setTimeout(() => {
        // Handle success completion
      }, 2000);

      return result;
    } catch (error) {
      // Handle error
      throw error;
    }
  };

  return {
    ...mutation,
    handlePurchase,
  };
};
```

#### Image Memory Optimization
Optimize image loading and memory usage:

```typescript
// components/NetworkIcon.tsx
import React, { useState } from 'react';
import { Image, View } from 'react-native';

interface NetworkIconProps {
  network: string;
  size?: number;
}

export const NetworkIcon: React.FC<NetworkIconProps> = ({ network, size = 40 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getNetworkImage = (network: string) => {
    switch (network) {
      case 'mtn':
        return require('../assets/mtn-logo.png');
      case 'glo':
        return require('../assets/glo-logo.png');
      case 'airtel':
        return require('../assets/airtel-logo.png');
      case '9mobile':
        return require('../assets/9mobile-logo.png');
      default:
        return require('../assets/default-network.png');
    }
  };

  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={getNetworkImage(network)}
        style={{ width: size, height: size }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
        resizeMode="contain"
      />
    </View>
  );
};
```

### Performance Monitoring

#### Performance Metrics
Track app performance:

```typescript
// utils/performanceMonitor.ts
export class PerformanceMonitor {
  private static metrics: { [key: string]: number[] } = {};

  static startTiming(label: string): () => number {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.metrics[label]) {
        this.metrics[label] = [];
      }

      this.metrics[label].push(duration);

      // Keep only last 100 measurements
      if (this.metrics[label].length > 100) {
        this.metrics[label].shift();
      }

      console.log(`${label}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  static getAverageTime(label: string): number {
    const times = this.metrics[label];
    if (!times || times.length === 0) return 0;

    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  static logMetrics() {
    console.log('Performance Metrics:');
    Object.keys(this.metrics).forEach(label => {
      const avg = this.getAverageTime(label);
      console.log(`${label}: ${avg.toFixed(2)}ms (avg)`);
    });
  }
}
```

#### Usage in Components
Monitor component performance:

```typescript
// components/MonitoredAirtimeScreen.tsx
import React, { useEffect } from 'react';
import { PerformanceMonitor } from '../utils/performanceMonitor';

const MonitoredAirtimeScreen = () => {
  useEffect(() => {
    const endTiming = PerformanceMonitor.startTiming('AirtimeScreen Render');

    return () => {
      endTiming();
    };
  }, []);

  const handlePurchase = async () => {
    const endTiming = PerformanceMonitor.startTiming('Airtime Purchase');

    try {
      // ... purchase logic ...
      endTiming();
    } catch (error) {
      endTiming();
      throw error;
    }
  };

  return (
    // ... component JSX ...
  );
};
```

### Battery and Resource Optimization

#### Background Task Management
Optimize background tasks:

```typescript
// services/backgroundTasks.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Perform lightweight background sync
    await OfflineQueue.processQueue();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundTaskManager {
  static async registerBackgroundSync() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  static async unregisterBackgroundSync() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }
}
```

#### Power-Aware Features
Adapt behavior based on battery level:

```typescript
// hooks/useBatteryOptimization.ts
import { useState, useEffect } from 'react';
import * as Battery from 'expo-battery';

export const useBatteryOptimization = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    const getBatteryLevel = async () => {
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(level);
      setIsLowPower(level < 0.2); // Less than 20%
    };

    getBatteryLevel();

    const subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(batteryLevel);
      setIsLowPower(batteryLevel < 0.2);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    batteryLevel,
    isLowPower,
    // Reduce animations and background tasks when battery is low
    shouldReduceAnimations: isLowPower,
    shouldDisableBackgroundSync: isLowPower,
  };
};
```

### Final Integration
Update the main airtime screen with all optimizations:

```typescript
// app/services/airtime/index.tsx (final optimized version)
const AirtimeScreen = () => {
  const router = useRouter();
  const { isOffline } = useNetworkState();
  const { isLowPower } = useBatteryOptimization();
  const form = useAirtimeForm();
  const purchaseFlow = usePurchaseFlow();

  // Preload images on mount
  useEffect(() => {
    preloadImages();
  }, []);

  // Monitor network changes
  useEffect(() => {
    if (!isOffline) {
      // Sync offline queue when back online
      SyncManager.syncOnReconnect();
    }
  }, [isOffline]);

  const handlePurchase = async () => {
    if (!form.canPurchase) return;

    if (isOffline) {
      // Queue for offline processing
      const transactionId = await OfflineQueue.addTransaction({
        phone: form.phoneNumber,
        amount: parseInt(form.amount),
        transactionPin: 'PIN_WILL_BE_REQUESTED_LATER',
      });

      Alert.alert(
        'Queued for Later',
        'Your purchase has been queued and will be processed when you\'re back online.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowPINModal(true);
  };

  const handlePINSubmit = async (pin: string) => {
    const endTiming = PerformanceMonitor.startTiming('PIN Submission');

    try {
      await purchaseFlow.handlePurchase({
        phone: form.phoneNumber,
        amount: parseInt(form.amount),
        transactionPin: pin,
      });

      endTiming();

      // Success handling...
    } catch (error) {
      endTiming();
      // Error handling...
    }
  };

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <SafeAreaView style={styles.container}>
        {/* ... existing JSX with optimized components ... */}
      </SafeAreaView>
    </ErrorBoundary>
  );
};
```

This comprehensive guide provides a production-ready implementation for integrating airtime purchase functionality into a React Native mobile application, with robust error handling, security measures, testing strategies, and performance optimizations.