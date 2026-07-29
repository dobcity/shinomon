import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { SafeAreaView, StatusBar, Alert, View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_CLASSES, DEFAULT_CATEGORIES, DEFAULT_SERVICES, STORAGE_KEYS } from './src/constants';
import { getIsAdmin } from './src/utils/vk';
import { savePhotoPermanently } from './src/utils/storage';
import { CalculatorTab } from './src/components/CalculatorTab';

export default function App() {
  const isAdmin = getIsAdmin();
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

  const handleCreateOrder = async (computedTotal) => {
    if (!selectedClass) return;
    const activeIds = Object.keys(selectedServices).filter((id) => selectedServices[id] > 0);
    if (activeIds.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одну услугу.');
      return;
    }

    // Сохранение фото во внутреннее хранилище устройства
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛞 Шиномонтаж Pro</Text>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
});
