import React, { useState, useEffect } from 'react';
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

import { fetchCloudServices, updateCloudServices } from './src/services/api';
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

  // 1. Загрузка данных при старте (Облако + Локально)
  const loadData = async () => {
    try {
      console.log('🔄 Запрашиваем данные из облака...');
      const cloudData = await fetchCloudServices(); // Получаем данные из jsonbin.io

      let loadedServices = [];
      let loadedClasses = null;

      if (cloudData) {
        if (!Array.isArray(cloudData) && cloudData.services) {
          // Новый формат: объект с классами и услугами
          loadedServices = cloudData.services;
          loadedClasses = cloudData.carClasses;
        } else if (Array.isArray(cloudData)) {
          // Старый формат: только массив услуг
          loadedServices = cloudData;
        }
      }

      // 2. Обработка услуг
      if (loadedServices && loadedServices.length > 0) {
        setServicesList(loadedServices);
        await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(loadedServices));
        console.log('✅ Услуги загружены из облака');
      } else {
        const storedServices = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
        loadedServices = storedServices ? JSON.parse(storedServices) : DEFAULT_SERVICES;
        setServicesList(loadedServices);
      }

      // 1. Обработка классов авто (из облака, либо динамически из ключей цен услуг)
      if (loadedClasses && Array.isArray(loadedClasses) && loadedClasses.length > 0) {
        setCarClasses(loadedClasses);
        setSelectedClass(loadedClasses[0]);
        await AsyncStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(loadedClasses));
        console.log('✅ Классы авто загружены из облака');
      } else if (loadedServices && loadedServices.length > 0 && loadedServices[0].prices) {
        // Автоматически извлекаем актуальные классы из структуры цен
        const classKeys = Object.keys(loadedServices[0].prices);
        
        const prettyNames = {
          sedan: 'Седан',
          crossover: 'Кроссовер',
          'Внедорожники': 'Внедорожники',
          'премиум': 'Премиум',
          'Полный': 'Полный'
        };

        const derivedClasses = classKeys.map((key) => ({
          id: key,
          name: prettyNames[key] || key,
        }));

        setCarClasses(derivedClasses);
        if (derivedClasses.length > 0) setSelectedClass(derivedClasses[0]);
        await AsyncStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(derivedClasses));
        console.log('✅ Классы авто успешно восстановлены из матрицы цен');
      } else {
        const storedClasses = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
        const fallbackClasses = storedClasses ? JSON.parse(storedClasses) : DEFAULT_CLASSES;
        setCarClasses(fallbackClasses);
        if (fallbackClasses.length > 0) setSelectedClass(fallbackClasses[0]);
      }

      // Загрузка истории заказов
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) setSavedOrders(JSON.parse(storedOrders));

    } catch (e) {
      console.error('Ошибка при загрузке данных:', e);
      // Фолбэк на локальное хранилище при сбое сети
      const storedClasses = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
      if (storedClasses) {
        const parsed = JSON.parse(storedClasses);
        setCarClasses(parsed);
        if (parsed.length > 0) setSelectedClass(parsed[0]);
      }
      const storedServices = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      if (storedServices) setServicesList(JSON.parse(storedServices));
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    bridge.send('VKWebAppInit');
    loadData();
  }, []);

  // 2. Сохранение цен администратором (Облако + Локально)
  const handleSaveServices = async (newServices) => {
    setServicesList(newServices);
    
    // Формируем общий пакет для облака (услуги + текущие классы)
    const payload = {
      services: newServices,
      carClasses: carClasses
    };

    const isSuccess = await updateCloudServices(payload);

    if (isSuccess) {
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(newServices));
      Alert.alert('Успех', 'Новые цены сохранены в облаке и обновлены у всех клиентов!');
    } else {
      Alert.alert('Ошибка', 'Не удалось отправить данные в облако. Проверьте подключение.');
    }
  };

  // 3. Сохранение классов автомобилей (Локально + Облако)
  const handleSaveCarClasses = async (newClasses) => {
    setCarClasses(newClasses);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(newClasses));

      // Отправляем в облако полный пакет (текущие услуги + новые классы)
      const payload = {
        services: servicesList,
        carClasses: newClasses
      };
      
      const isSuccess = await updateCloudServices(payload);
      if (isSuccess) {
        Alert.alert('Успех', 'Классы авто сохранены в облако!');
      } else {
        Alert.alert('Внимание', 'Сохранено локально, но не удалось отправить в облако.');
      }
    } catch (e) {
      console.error('Ошибка сохранения классов в хранилище:', e);
    }
  };

  // 4. Секретный вход для админа
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

  // 5. Оформление заказа
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
      const classKey = typeof selectedClass === 'object' ? (selectedClass.id || selectedClass.name) : selectedClass;
      const price = s?.prices?.[classKey]?.[selectedRadius] || 0;
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
      className: typeof selectedClass === 'object' ? (selectedClass.name || selectedClass.id) : selectedClass,
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
          setCarClasses={handleSaveCarClasses}
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
  tabText: { fontSize: 13, fontWeight: '600', color: '#6c757d' },
  tabTextActive: { color: '#0d6efd' },
  tabButtonActive: { borderBottomWidth: 3, borderBottomColor: '#0d6efd' },
});
