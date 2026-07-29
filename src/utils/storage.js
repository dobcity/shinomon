import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

// Защита от потери временных снимков (копирование во внутреннюю память устройства)
export const savePhotoPermanently = async (tempUri) => {
  if (!tempUri) return null;
  if (Platform.OS === 'web') return tempUri;

  try {
    const fileName = tempUri.split('/').pop();
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: tempUri, to: newPath });
    return newPath;
  } catch (error) {
    console.error('Ошибка сохранения файла:', error);
    return tempUri;
  }
};

// Тактильная отдача для мобильных
export const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style).catch(() => {});
  }
};
