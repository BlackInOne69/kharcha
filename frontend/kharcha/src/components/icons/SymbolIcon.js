import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '../../theme/designSystem';

const MAP = {
  home: 'home-outline',
  history: 'history',
  add: 'plus-circle-outline',
  insights: 'chart-donut',
  groups: 'account-group-outline',
  camera: 'camera-outline',
  image: 'image-outline',
  screenshot: 'cellphone-screenshot',
  edit: 'pencil-outline',
  privacy: 'shield-check-outline',
};

export default function SymbolIcon({ name, size = 22, color = '#111827' }) {
  const iconName = MAP[name] || 'help-circle-outline';
  // Material Symbols Rounded family is defined in the theme for future font linking.
  void typography.family.material;
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
}
