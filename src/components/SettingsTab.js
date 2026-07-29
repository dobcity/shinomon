import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { updateCloudServices } from '../services/api';

const ALL_RADII = ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21', 'R22'];

export function SettingsTab({ 
  servicesList = [], 
  setServicesList, 
  carClasses = [], 
  setCarClasses = () => {}, 
  categories = ['Шиномонтаж', 'Ремонт'],
  onSaveServices 
}) {
  const [newServiceName, setNewServiceName] = useState('');
  const [newCarClassName, setNewCarClassName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'Шиномонтаж');

  // Вспомогательная функция для безопасного сохранения всего стейта в облако
  const saveAllToCloud = async (services, classes) => {
    try {
      const payload = {
        services: services,
        carClasses: classes
      };
      const success = await updateCloudServices(payload);
      return success;
    } catch (e) {
      console.error('Ошибка облака:', e);
      return false;
    }
  };

  // Добавление нового класса автомобиля
  const handleAddCarClass = async () => {
    const trimmed = newCarClassName.trim();
    if (!trimmed) {
      Alert.alert('Ошибка', 'Введите название класса авто');
      return;
    }

    const exists = carClasses.some(cls => {
      const name = typeof cls === 'object' && cls !== null ? (cls.name || cls.id) : cls;
      return name.toLowerCase() === trimmed.toLowerCase();
    });

    if (exists) {
      Alert.alert('Ошибка', 'Такой класс уже существует');
      return;
    }

    const newClassObj = {
      id: trimmed,
      name: trimmed
    };

    const updatedClasses = [...carClasses, newClassObj];
    setCarClasses(updatedClasses);

    const updatedServices = servicesList.map(service => ({
      ...service,
      prices: {
        ...(service.prices || {}),
        [trimmed]: ALL_RADII.reduce((acc, r) => ({ ...acc, [r]: 0 }), {})
      }
    }));

    setServicesList(updatedServices);
    
    const success = await saveAllToCloud(updatedServices, updatedClasses);
    if (success) {
      Alert.alert('Успех', `Класс "${trimmed}" успешно добавлен и сохранен в облако!`);
    } else {
      Alert.alert('Внимание', 'Класс добавлен локально, но не удалось сохранить в облако.');
    }

    setNewCarClassName('');
  };

  // Удаление класса автомобиля
  const handleDeleteCarClass = async (carClassToRemove) => {
    if (carClasses.length <= 1) {
      Alert.alert('Ошибка', 'Должен остаться хотя бы один класс автомобиля');
      return;
    }

    const classId = typeof carClassToRemove === 'object' && carClassToRemove !== null 
      ? (carClassToRemove.id || carClassToRemove.name) 
      : carClassToRemove;

    const className = typeof carClassToRemove === 'object' && carClassToRemove !== null 
      ? (carClassToRemove.name || carClassToRemove.id) 
      : carClassToRemove;

    const updatedClasses = carClasses.filter(c => {
      const cId = typeof c === 'object' && c !== null ? (c.id || c.name) : c;
      return cId !== classId;
    });
    
    setCarClasses(updatedClasses);

    const updatedServices = servicesList.map(service => {
      const newPrices = { ...(service.prices || {}) };
      delete newPrices[classId];
      return { ...service, prices: newPrices };
    });

    setServicesList(updatedServices);
    
    const success = await saveAllToCloud(updatedServices, updatedClasses);
    if (success) {
      Alert.alert('Успех', `Класс "${className}" удален`);
    } else {
      Alert.alert('Внимание', 'Удалено локально, но произошла ошибка при обновлении облака.');
    }
  };

  // Добавление новой услуги
  const handleAddService = async () => {
    const trimmedName = newServiceName.trim();
    if (!trimmedName) {
      Alert.alert('Ошибка', 'Введите название услуги');
      return;
    }

    const emptyPrices = {};
    (carClasses || []).forEach((cls) => {
      const classId = typeof cls === 'object' && cls !== null ? (cls.id || cls.name) : cls;
      if (classId) {
        emptyPrices[classId] = {};
        ALL_RADII.forEach((r) => {
          emptyPrices[classId][r] = 0;
        });
      }
    });

    const categoryStr = typeof selectedCategory === 'object' && selectedCategory !== null 
      ? (selectedCategory.name || 'Шиномонтаж') 
      : selectedCategory;

    const newService = {
      id: Date.now().toString(),
      category: categoryStr,
      name: trimmedName,
      prices: emptyPrices,
    };

    const updated = [...(servicesList || []), newService];
    setServicesList(updated);
    
    const success = await saveAllToCloud(updated, carClasses);
    if (success) {
      Alert.alert('Успех', `Услуга "${trimmedName}" добавлена и сохранена в облако!`);
    } else {
      Alert.alert('Внимание', 'Услуга добавлена локально, но не удалось сохранить в облако.');
    }

    setNewServiceName('');
  };

  // Изменение цены в матрице для конкретной услуги, класса и радиуса
  const handlePriceChange = (serviceId, classId, radius, value) => {
    const numericValue = value === '' ? 0 : Number(value);
    const updated = servicesList.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          prices: {
            ...(service.prices || {}),
            [classId]: {
              ...(service.prices?.[classId] || {}),
              [radius]: isNaN(numericValue) ? 0 : numericValue
            }
          }
        };
      }
      return service;
    });
    setServicesList(updated);
  };

  // Ручное сохранение всех изменений цен
  const handleSaveToCloud = async () => {
    if (onSaveServices) {
      await onSaveServices(servicesList);
    } else {
      const success = await saveAllToCloud(servicesList, carClasses);
      if (success) {
        Alert.alert('Успех', 'Все изменения цен успешно сохранены в облако!');
      } else {
        Alert.alert('Ошибка', 'Не удалось сохранить изменения в облако.');
      }
    }
  };

  // Удаление услуги
  const handleDeleteService = async (id) => {
    const updated = servicesList.filter(s => s.id !== id);
    setServicesList(updated);
    const success = await saveAllToCloud(updated, carClasses);
    if (success) {
      Alert.alert('Успех', 'Услуга успешно удалена');
    } else {
      Alert.alert('Внимание', 'Услуга удалена локально, но в облаке не обновилось.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Панель управления ценами</Text>
      
      {/* Карточка управления классами авто */}
      <View style={styles.card}>
        <Text style={styles.label}>Классы автомобилей</Text>
        <TextInput
          style={styles.input}
          placeholder="Новый класс (например: Премиум)"
          placeholderTextColor="#999"
          value={newCarClassName}
          onChangeText={setNewCarClassName}
        />
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleAddCarClass}>
          <Text style={styles.buttonText}>Добавить класс авто</Text>
        </TouchableOpacity>

        <View style={styles.chipsContainer}>
          {(carClasses || []).map((cls, idx) => {
            const className = typeof cls === 'object' && cls !== null ? (cls.name || cls.id) : cls;
            return (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{className}</Text>
                <TouchableOpacity onPress={() => handleDeleteCarClass(cls)}>
                  <Text style={styles.chipDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Карточка добавления услуги */}
      <View style={styles.card}>
        <Text style={styles.label}>Добавить новую услугу</Text>
        <TextInput
          style={styles.input}
          placeholder="Название услуги (например: Правка диска)"
          placeholderTextColor="#999"
          value={newServiceName}
          onChangeText={setNewServiceName}
        />
        <TouchableOpacity style={styles.button} onPress={handleAddService}>
          <Text style={styles.buttonText}>Добавить услугу</Text>
        </TouchableOpacity>
      </View>

      {/* Заголовок списка и кнопка глобального сохранения */}
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Редактирование цен (Матрица):</Text>
        <TouchableOpacity style={styles.saveAllButton} onPress={handleSaveToCloud}>
          <Text style={styles.saveAllButtonText}>💾 Сохранить цены</Text>
        </TouchableOpacity>
      </View>

      {/* Список услуг с матрицей цен */}
      {(servicesList || []).map((service, index) => {
        const sName = typeof service.name === 'string' ? service.name : (service.name?.name || 'Услуга');
        const sCat = typeof service.category === 'string' ? service.category : (service.category?.name || 'Категория');
        
        return (
          <View key={service.id || index} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{sName}</Text>
                <Text style={styles.serviceCat}>{sCat}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteService(service.id)}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>

            {/* Цикл по классам автомобилей */}
            {(carClasses || []).map((carClass) => {
              const classId = typeof carClass === 'object' && carClass !== null ? (carClass.id || carClass.name) : carClass;
              const className = typeof carClass === 'object' && carClass !== null ? (carClass.name || carClass.id) : carClass;

              return (
                <View key={classId} style={styles.classRow}>
                  <Text style={styles.className}>{className}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiiScroll}>
                    {ALL_RADII.map((radius) => {
                      const currentPrice = service.prices?.[classId]?.[radius] ?? '';
                      return (
                        <View key={radius} style={styles.priceCell}>
                          <Text style={styles.radiusLabel}>{radius}</Text>
                          <TextInput
                            style={styles.priceInput}
                            keyboardType="numeric"
                            value={String(currentPrice)}
                            onChangeText={(val) => handlePriceChange(service.id, classId, radius, val)}
                          />
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

export default SettingsTab;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#444' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff', fontSize: 14 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#5856D6', marginBottom: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  saveAllButton: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  saveAllButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: { flexDirection: 'row', backgroundColor: '#eef2f7', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8, marginBottom: 8, alignItems: 'center' },
  chipText: { fontSize: 13, color: '#333', marginRight: 6 },
  chipDelete: { fontSize: 13, color: '#ff3b30', fontWeight: 'bold' },
  serviceCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  serviceCat: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteButton: { backgroundColor: '#ff3b30', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  classRow: { marginBottom: 8, backgroundColor: '#fafafa', padding: 8, borderRadius: 6 },
  className: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  radiiScroll: { flexDirection: 'row' },
  priceCell: { marginRight: 8, alignItems: 'center' },
  radiusLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  priceInput: { borderWidth: 1, borderColor: '#ccc', width: 50, height: 36, textAlign: 'center', borderRadius: 4, backgroundColor: '#fff', fontSize: 13 }
});
