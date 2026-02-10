import { Platform } from 'react-native';

const DEV_ANDROID_EMULATOR_URL = 'http://10.0.2.2:8000';
const DEV_DEFAULT_URL = 'http://127.0.0.1:8000';

export const API_BASE_URL = Platform.OS === 'android' ? DEV_ANDROID_EMULATOR_URL : DEV_DEFAULT_URL;
