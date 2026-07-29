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
  setCategories = () => {},
  onSaveServices 
}) {
  const [newServiceName, setNewServiceName] = useState('');
  const [newCarClassName, setNewCarClassName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Состояния для редактирования названий категорий
  const [editingCategoryOldName, setEditingCategoryOldName] = useState(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  const [selectedCategoryForNewService, setSelectedCategoryForNewService] = useState(categories[0] || 'Шиномонтаж');

  // Универсальное сохранение всего стейта в облако
  const saveAllToCloud = async (services, classes, cats) => {
    try {
      const payload = {
        services: services,
        carClasses: classes,
        categories: cats
      };
      const success = await updateCloudServices(payload);
      return success;
    } catch (e) {
      console.error('Ошибка облака:', e);
      return false;
    }
  };

  // --- УПРАВЛЕНИЕ КАТЕГОРИЯМИ ---

  // Добавление новой категории
  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Alert.alert('Ошибка', 'Введите название категории');
      return;
    }

    if (categories.includes(trimmed)) {
      Alert.alert('Ошибка', ' Такая категория уже существует');
      return;
    }

    const updatedCategories = [...categories, trimmed];
    setCategories(updatedCategories);

    const success = await saveAllToCloud(servicesList, carClasses, updatedCategories);
    if (success) {
      Alert.alert('Успех', `Категория "${trimmed}" добавлена!`);
    } else {
      Alert.alert('Внимание', 'Добавлено локально, но не удалось сохранить в облако.');
    }

    setNewCategoryName('');
  };

  // Переименование категории (с обновлением во всех услугах)
  const handleSaveRenameCategory = async (oldName) => {
    const trimmed = editingCategoryNewName.trim();
    if (!trimmed) {
      Alert.alert('Ошибка', 'Имя категории не может быть пустым');
      return;
    }

    if (categories.includes(trimmed) && trimmed !== oldName) {
      Alert.alert('Ошибка', 'Такая категория уже существует');
      return;
    }

    // Обновляем список категорий
    const updatedCategories = categories.map(cat => cat === oldName ? trimmed : cat);
    setCategories(updatedCategories);

    // Обновляем категорию у всех услуг, которые к ней относились
    const updatedServices = servicesList.map(service => {
      if (service.category === oldName) {
        return { ...service, category: trimmed };
      }
      return service;
    });
    setServicesList(updatedServices);

    setEditingCategoryOldName(null);
    setEditingCategoryNewName('');

    const success = await saveAllToCloud(updatedServices, carClasses, updatedCategories);
    if (success) {
      Alert.alert('Успех', 'Категория переименована!');
    }
  };

  // Удаление категории
  const handleDeleteCategory = async (catNameToDelete) => {
    if (categories.length <= 1) {
      Alert.alert('Ошибка', 'Должна остаться хотя бы одна категория');
      return;
    }

    Alert.alert(
      'Удаление категории',
      `Удалить категорию "${catNameToDelete}"? Услуги из этой категории будут перенесены в первую доступную категорию.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const fallbackCategory = categories.find(c => c !== catNameToDelete) || 'Шиномонтаж';
            const updatedCategories = categories.filter(c => c !== catNameToDelete);
            setCategories(updatedCategories);

            // Переносим услуги удаленной категории на fallback-категорию
            const updatedServices = servicesList.map(service => {
              if (service.category === catNameToDelete) {
                return { ...service, category: fallbackCategory };
              }
              return service;
            });
            setServicesList(updatedServices);

            await saveAllToCloud(updatedServices, carClasses, updatedCategories);
            Alert.alert('Успех', 'Категория удалена');
          }
        }
      ]
    );
  };

  // --- УПРАВЛЕНИЕ КЛАССАМИ АВТО ---

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

    const newClassObj = { id: trimmed, name: trimmed };
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
    
    const success = await saveAllToCloud(updatedServices, updatedClasses, categories);
    if (success) {
      Alert.alert('Успех', `Класс "${trimmed}" успешно добавлен!`);
    }
    setNewCarClassName('');
  };

  const handleDeleteCarClass = async (carClassToRemove) => {
    if (carClasses.length <= 1) {
      Alert.alert('Ошибка', 'Должен остаться хотя бы один класс автомобиля');
      return;
    }

    const classId = typeof carClassToRemove === 'object' && carClassToRemove !== null 
      ? (carClassToRemove.id || carClassToRemove.name) 
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
    await saveAllToCloud(updatedServices, updatedClasses, categories);
    Alert.alert('Успех', 'Класс удален');
  };

  // --- УПРАВЛЕНИЕ УСЛУГАМИ ---

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

    const newService = {
      id: Date.now().toString(),
      category: selectedCategoryForNewService || categories[0] || 'Шиномонтаж',
      name: trimmedName,
      prices: emptyPrices,
    };

    const updated = [...(servicesList || []), newService];
    setServicesList(updated);
    
    await saveAllToCloud(updated, carClasses, categories);
    Alert.alert('Успех', `Услуга "${trimmedName}" добавлена!`);
    setNewServiceName('');
  };

  // Изменение категории у конкретной услуги
  const handleChangeServiceCategory = async (serviceId, newCat) => {
    const updated = servicesList.map(s => {
      if (s.id === serviceId) {
        return { ...s, category: newCat };
      }
      return s;
    });
    setServicesList(updated);
    await saveAllToCloud(updated, carClasses, categories);
  };

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

  const handleSaveToCloud = async () => {
    if (onSaveServices) {
      await onSaveServices(servicesList);
    } else {
      const success = await saveAllToCloud(servicesList, carClasses, categories);
      if (success) {
        Alert.alert('Успех', 'Все изменения цен успешно сохранены в облако!');
      } else {
        Alert.alert('Ошибка', 'Не удалось сохранить изменения в облако.');
      }
    }
  };

  const handleDeleteService = async (id) => {
    const updated = servicesList.filter(s => s.id !== id);
    setServicesList(updated);
    await saveAllToCloud(updated, carClasses, categories);
    Alert.alert('Успех', 'Услуга успешно удалена');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Панель управления ценами</Text>
      
      {/* 1. КАРТОЧКА УПРАВЛЕНИЯ КАТЕГОРИЯМИ */}
      <View style={styles.card}>
        <Text style={styles.label}>Категории услуг</Text>
        <TextInput
          style={styles.input}
          placeholder="Новая категория (например: Доп. услуги)"
          placeholderTextColor="#999"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
        />
        <TouchableOpacity style={[styles.button, styles.categoryButton]} onPress={handleAddCategory}>
          <Text style={styles.buttonText}>Добавить категорию</Text>
        </TouchableOpacity>

        <View style={styles.chipsContainer}>
          {(categories || []).map((cat, idx) => (
            <View key={idx} style={styles.chip}>
              {editingCategoryOldName === cat ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={styles.editChipInput}
                    value={editingCategoryNewName}
                    onChangeText={setEditingCategoryNewName}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleSaveRenameCategory(cat)}>
                    <Text style={styles.chipSave}>💾</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingCategoryOldName(null)}>
                    <Text style={styles.chipCancel}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.chipText}>{cat}</Text>
                  <TouchableOpacity onPress={() => { setEditingCategoryOldName(cat); setEditingCategoryNewName(cat); }}>
                    <Text style={styles.chipEdit}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                    <Text style={styles.chipDelete}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 2. КАРТОЧКА УПРАВЛЕНИЯ КЛАССАМИ АВТО */}
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

      {/* 3. КАРТОЧКА ДОБАВЛЕНИЯ УСЛУГИ */}
      <View style={styles.card}>
        <Text style={styles.label}>Добавить новую услугу</Text>
        <TextInput
          style={styles.input}
          placeholder="Название услуги (например: Правка диска)"
          placeholderTextColor="#999"
          value={newServiceName}
          onChangeText={setNewServiceName}
        />
        <Text style={styles.subLabel}>Выберите категорию для услуги:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(categories || []).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catSelectChip, selectedCategoryForNewService === cat && styles.catSelectChipActive]}
              onPress={() => setSelectedCategoryForNewService(cat)}
            >
              <Text style={[styles.catSelectText, selectedCategoryForNewService === cat && styles.catSelectTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={handleAddService}>
          <Text style={styles.buttonText}>Добавить услугу</Text>
        </TouchableOpacity>
      </View>

      {/* СПИСОК УСЛУГ И МАТРИЦА ЦЕН */}
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Редактирование цен (Матрица):</Text>
        <TouchableOpacity style={styles.saveAllButton} onPress={handleSaveToCloud}>
          <Text style={styles.saveAllButtonText}>💾 Сохранить цены</Text>
        </TouchableOpacity>
      </View>

      {(servicesList || []).map((service, index) => {
        const sName = typeof service.name === 'string' ? service.name : (service.name?.name || 'Услуга');
        const sCat = service.category || categories[0] || 'Шиномонтаж';
        
        return (
          <View key={service.id || index} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{sName}</Text>
                {/* Быстрая смена категории прямо у услуги */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {(categories || []).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.miniCatChip, sCat === cat && styles.miniCatChipActive]}
                      onPress={() => handleChangeServiceCategory(service.id, cat)}
                    >
                      <Text style={[styles.miniCatText, sCat === cat && styles.miniCatTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteService(service.id)}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>

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
  subLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff', fontSize: 14 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#5856D6', marginBottom: 12 },
  categoryButton: { backgroundColor: '#FF9500', marginBottom: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  saveAllButton: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  saveAllButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: { flexDirection: 'row', backgroundColor: '#eef2f7', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8, marginBottom: 8, alignItems: 'center' },
  chipText: { fontSize: 13, color: '#333', marginRight: 6 },
  chipDelete: { fontSize: 13, color: '#ff3b30', fontWeight: 'bold', marginLeft: 4 },
  chipEdit: { fontSize: 12, marginLeft: 4 },
  chipSave: { fontSize: 12, marginLeft: 6 },
  chipCancel: { fontSize: 12, color: '#ff3b30', marginLeft: 6 },
  editChipInput: { borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 13, width: 90, marginRight: 4 },
  catSelectChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eee', borderRadius: 16, marginRight: 8 },
  catSelectChipActive: { backgroundColor: '#007AFF' },
  catSelectText: { fontSize: 13, color: '#333' },
  catSelectTextActive: { color: '#fff', fontWeight: 'bold' },
  miniCatChip: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f0f0f0', borderRadius: 10, marginRight: 6, marginTop: 4 },
  miniCatChipActive: { backgroundColor: '#34C759' },
  miniCatText: { fontSize: 11, color: '#555' },
  miniCatTextActive: { color: '#fff', fontWeight: 'bold' },
  serviceCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  deleteButton: { backgroundColor: '#ff3b30', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  classRow: { marginBottom: 8, backgroundColor: '#fafafa', padding: 8, borderRadius: 6 },
  className: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  radiiScroll: { flexDirection: 'row' },
  priceCell: { marginRight: 8, alignItems: 'center' },
  radiusLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  priceInput: { borderWidth: 1, borderColor: '#ccc', width: 50, height: 36, textAlign: 'center', borderRadius: 4, backgroundColor: '#fff', fontSize: 13 }
});
