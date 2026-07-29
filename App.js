import React, { useState, useEffect } from 'react';
import { fetchCloudServices, updateCloudServices } from './src/services/api';

import bridge from '@vkontakte/vk-bridge';
import {
  SafeAreaView,
  StatusBar,
  Alert,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_CLASSES,
  DEFAULT_CATEGORIES,
  DEFAULT_SERVICES,
  STORAGE_KEYS,
} from './src/constants';
import { getIsAdmin } from './src/utils/vk';
import { savePhotoPermanently } from './src/utils/storage';

import { CalculatorTab } from './src/components/CalculatorTab';
import { HistoryTab } from './src/components/HistoryTab';
import { SettingsTab } from './src/components/SettingsTab';

const ADMIN_PIN = '7777';
// Загрузка данных при запуске приложения
const loadData = async () => {
  try {
    // 1. Пытаемся получить свежие цены из облака
    const cloudServices = await fetchCloudServices();

    if (cloudServices && Array.isArray(cloudServices)) {
      setServicesList(cloudServices);
      // Кэшируем локально на случай отсутствия интернета у клиента
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(cloudServices));
    } else {
      // Если интернет отсутствует или ошибка в API — берем из памяти устройства или по умолчанию
      const storedServices = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      if (storedServices) {
        setServicesList(JSON.parse(storedServices));
      }
    }

    // Загрузка классов и сохраненных заказов
    const storedClasses = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
    const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);

    let loadedClasses = storedClasses ? JSON.parse(storedClasses) : DEFAULT_CLASSES;
    setCarClasses(loadedClasses);
    if (loadedClasses.length > 0) setSelectedClass(loadedClasses[0]);

    if (storedOrders) setSavedOrders(JSON.parse(storedOrders));
  } catch (e) {
    console.error('Ошибка при инициализации данных:', e);
  } finally {
    setIsLoaded(true);
  }
};

// Сохранение цен администратором из вкладки «Настройки»
const handleSaveServices = async (newServices) => {
  // 1. Обновляем экран администратора
  setServicesList(newServices);
  
  // 2. Отправляем изменения в облако для ВСЕХ пользователей
  const isSuccess = await updateCloudServices(newServices);

  if (isSuccess) {
    // Сохраняем локальный кэш
    await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(newServices));
    Alert.alert('Успех', 'Новые цены сохранены в облаке и обновлены у всех клиентов!');
  } else {
    Alert.alert('Ошибка', 'Не удалось отправить данные в облако. Проверьте подключение к интернету.');
  }
};


export default function App() {
  const vkDetectedAdmin = getIsAdmin();
  const [adminOverride, setAdminOverride] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const isAdmin = vkDetectedAdmin || adminOverride;

  const [activeTab, setActiveTab] = useState('calc');
  const [isLoaded, setIsLoaded] = useState(false);

  const [carClasses, setCarClasses] = useState(DEFAULT_CLASSES);
  const [serviceCategories, setServiceCategories] = useState(DEFAULT_CATEGORIES);
  const [servicesList, setServicesList] = useState(DEFAULT_SERVICES);
  const [savedOrders, setSavedOrders] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState('R16');
  const [selectedServices, setSelectedServices] = useState({});
  const [carNote, setCarNote] = useState('');
  const [carPhoto, setCarPhoto] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Все');

  useEffect(() => {
    bridge.send('VKWebAppInit');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedClasses = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
      const storedServices = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);

      let loadedClasses = storedClasses ? JSON.parse(storedClasses) : DEFAULT_CLASSES;
      setCarClasses(loadedClasses);
      if (loadedClasses.length > 0) setSelectedClass(loadedClasses[0]);

      if (storedServices) setServicesList(JSON.parse(storedServices));
      if (storedOrders) setSavedOrders(JSON.parse(storedOrders));
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const handleHeaderTap = () => {
    const nextTap = tapCount + 1;
    setTapCount(nextTap);

    if (nextTap >= 5) {
      setTapCount(0);

      if (adminOverride) {
        setAdminOverride(false);
        Alert.alert('Выход', 'Режим администратора отключен.');
        return;
      }

      if (Platform.OS === 'web') {
        const pin = window.prompt('Введите ПИН-код администратора:');
        if (pin === ADMIN_PIN) {
          setAdminOverride(true);
          Alert.alert('Успех', '🔓 Режим администратора включен!');
        } else if (pin !== null) {
          Alert.alert('Ошибка', 'Неверный ПИН-код!');
        }
      } else {
        Alert.prompt('Вход для владельца', 'Введите ПИН-код:', [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Войти',
            onPress: (pin) => {
              if (pin === ADMIN_PIN) {
                setAdminOverride(true);
                Alert.alert('Успех', '🔓 Режим администратора включен!');
              } else {
                Alert.alert('Ошибка', 'Неверный ПИН-код!');
              }
            },
          },
        ]);
      }
    }
  };

  const handleCreateOrder = async (computedTotal) => {
    if (!selectedClass) return;
    const activeIds = Object.keys(selectedServices).filter((id) => selectedServices[id] > 0);
    if (activeIds.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одну услугу.');
      return;
    }

    const permanentPhotoPath = await savePhotoPermanently(carPhoto);

    const orderServices = activeIds.map((id) => {
      const s = servicesList.find((item) => item.id === id);
      const price = s?.prices?.[selectedClass.id]?.[selectedRadius] || 0;
      const qty = selectedServices[id];
      return {
        id,
        name: s?.name || 'Услуга',
        qty,
        unitPrice: price,
        totalPrice: price * qty,
      };
    });

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ru-RU'),
      className: selectedClass.name,
      radius: selectedRadius,
      carNote,
      carPhoto: permanentPhotoPath,
      services: orderServices,
      total: computedTotal,
    };

    const updatedOrders = [newOrder, ...savedOrders];
    setSavedOrders(updatedOrders);
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    Alert.alert('Успех', 'Чек успешно сформирован!');
    setSelectedServices({});
    setCarNote('');
    setCarPhoto(null);
  };

  const handleClearHistory = async () => {
    setSavedOrders([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.ORDERS);
  };

  const handleSaveServices = async (newServices) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(newServices));
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Загрузка данных...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity activeOpacity={0.8} onPress={handleHeaderTap} style={styles.header}>
        <Text style={styles.headerTitle}>🛞 Шиномонтаж Pro</Text>
      </TouchableOpacity>

      {isAdmin && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'calc' && styles.tabButtonActive]}
            onPress={() => setActiveTab('calc')}>
            <Text style={[styles.tabText, activeTab === 'calc' && styles.tabTextActive]}>
              🧮 Расчёт
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => setActiveTab('history')}>
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              📜 История ({savedOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}>
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              ⚙️ Настройки
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Переключение вкладок */}
      {(activeTab === 'calc' || !isAdmin) && (
        <CalculatorTab
          carClasses={carClasses}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedRadius={selectedRadius}
          setSelectedRadius={setSelectedRadius}
          serviceCategories={serviceCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          servicesList={servicesList}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          carNote={carNote}
          setCarNote={setCarNote}
          carPhoto={carPhoto}
          setCarPhoto={setCarPhoto}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {activeTab === 'history' && isAdmin && (
        <HistoryTab savedOrders={savedOrders} onClearHistory={handleClearHistory} />
      )}

      {activeTab === 'settings' && isAdmin && (
        <SettingsTab
          servicesList={servicesList}
          setServicesList={setServicesList}
          carClasses={carClasses}
          onSaveServices={handleSaveServices}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#dee2e6' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 3, borderBottomColor: '#0d6efd' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6c757d' },
  tabTextActive: { color: '#0d6efd' },
});
