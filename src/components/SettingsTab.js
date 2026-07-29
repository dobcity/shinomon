import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

const ALL_RADII = ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21', 'R22'];

export function SettingsTab({
  servicesList,
  setServicesList,
  carClasses,
  onSaveServices,
}) {
  // Список категорий из текущих услуг
  const existingCategories = Array.from(
    new Set(servicesList.map((s) => s.category).filter(Boolean))
  );

  const [categories, setCategories] = useState(
    existingCategories.length > 0 ? existingCategories : ['Шиномонтаж', 'Ремонт']
  );

  // Состояния для добавления новой категории
  const [newCategoryName, setNewCategoryName] = useState('');

  // Состояния для добавления новой услуги
  const [newServiceName, setNewServiceName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'Шиномонтаж');

  // 1. Добавление новой категории
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Alert.alert('Ошибка', 'Введите название категории');
      return;
    }
    if (categories.includes(trimmed)) {
      Alert.alert('Ошибка', 'Такая категория уже существует');
      return;
    }

    setCategories([...categories, trimmed]);
    setSelectedCategory(trimmed);
    setNewCategoryName('');
    Alert.alert('Успех', `Категория "${trimmed}" добавлена!`);
  };

  // 2. Добавление новой услуги
  const handleAddService = () => {
    const trimmedName = newServiceName.trim();
    if (!trimmedName) {
      Alert.alert('Ошибка', 'Введите название услуги');
      return;
    }

    // Создаем стандартную сетку цен (нули по умолчанию)
    const emptyPrices = {};
    carClasses.forEach((cls) => {
      emptyPrices[cls.id] = {};
      ALL_RADII.forEach((r) => {
        emptyPrices[cls.id][r] = 0;
      });
    });

    const newService = {
      id: Date.now().toString(), // Уникальный ID
      category: selectedCategory,
      name: trimmedName,
      prices: emptyPrices,
    };

    const updated = [...servicesList, newService];
    setServicesList(updated);
    setNewServiceName('');
    Alert.alert('Успех', `Услуга "${trimmedName}" добавлена! Теперь укажите для неё цены ниже.`);
  };

  // 3. Изменение цены для конкретной услуги, класса и радиуса
  const handlePriceChange = (serviceId, classId, radius, value) => {
    const numericValue = parseInt(value, 10) || 0;

    const updated = servicesList.map((service) => {
      if (service.id !== serviceId) return service;

      return {
        ...service,
        prices: {
          ...service.prices,
          [classId]: {
            ...service.prices?.[classId],
            [radius]: numericValue,
          },
        },
      };
    });

    setServicesList(updated);
  };

  // 4. Удаление услуги
  const handleDeleteService = (id, name) => {
    Alert.alert('Удаление', `Удалить услугу "${name}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          setServicesList(servicesList.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* --- БЛОК 1: ДОБАВЛЕНИЕ КАТЕГОРИИ --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📁 Новая категория</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Название категории (напр. Ошиповка)"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
            <Text style={styles.addButtonText}>+ Добавить</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- БЛОК 2: ДОБАВЛЕНИЕ УСЛУГИ --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>➕ Новая услуга</Text>
        <TextInput
          style={styles.input}
          placeholder="Название услуги (напр. Промывка колеса)"
          value={newServiceName}
          onChangeText={setNewServiceName}
        />

        <Text style={styles.label}>Выберите категорию:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}>
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat && styles.catChipTextActive,
                ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.createServiceBtn} onPress={handleAddService}>
          <Text style={styles.createServiceBtnText}>Создать услугу</Text>
        </TouchableOpacity>
      </View>

      {/* --- БЛОК 3: СОХРАНЕНИЕ В ОБЛАКО --- */}
      <TouchableOpacity
        style={styles.saveCloudBtn}
        onPress={() => onSaveServices(servicesList)}>
        <Text style={styles.saveCloudBtnText}>☁️ Сохранить всё в облако</Text>
      </TouchableOpacity>

      {/* --- БЛОК 4: РЕДАКТИРОВАНИЕ ПРАЙС-ЛИСТА --- */}
      <Text style={styles.sectionHeader}>Прайс-лист услуг</Text>

      {servicesList.map((service) => (
        <View key={service.id} style={styles.card}>
          <View style={styles.serviceHeader}>
            <View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCategory}>Категория: {service.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteService(service.id, service.name)}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {/* Таблица цен по классам авто */}
          {carClasses.map((cls) => (
            <View key={cls.id} style={styles.classSection}>
              <Text style={styles.className}>Класс: {cls.name}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.radiiRow}>
                  {ALL_RADII.map((r) => {
                    const priceVal = service.prices?.[cls.id]?.[r] ?? 0;
                    return (
                      <View key={r} style={styles.priceBox}>
                        <Text style={styles.radiusLabel}>{r}</Text>
                        <TextInput
                          style={styles.priceInput}
                          keyboardType="numeric"
                          value={String(priceVal)}
                          onChangeText={(val) =>
                            handlePriceChange(service.id, cls.id, r, val)
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ))}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f4f6f8' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#212529' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginVertical: 12, color: '#212529' },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 8,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  label: { fontSize: 13, color: '#6c757d', marginVertical: 4 },
  catPicker: { flexDirection: 'row', marginBottom: 10 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    marginRight: 6,
  },
  catChipActive: { backgroundColor: '#0d6efd' },
  catChipText: { fontSize: 12, color: '#495057' },
  catChipTextActive: { color: '#fff', fontWeight: 'bold' },
  createServiceBtn: {
    backgroundColor: '#198754',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  createServiceBtnText: { color: '#fff', fontWeight: 'bold' },
  saveCloudBtn: {
    backgroundColor: '#0d6efd',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveCloudBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 8,
    marginBottom: 8,
  },
  serviceName: { fontSize: 15, fontWeight: 'bold', color: '#212529' },
  serviceCategory: { fontSize: 12, color: '#6c757d' },
  deleteText: { fontSize: 18 },
  classSection: { marginTop: 6 },
  className: { fontSize: 12, fontWeight: '600', color: '#495057', marginBottom: 4 },
  radiiRow: { flexDirection: 'row' },
  priceBox: { width: 55, marginRight: 6, alignItems: 'center' },
  radiusLabel: { fontSize: 10, color: '#6c757d', marginBottom: 2 },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
    textAlign: 'center',
    fontSize: 12,
    width: '100%',
    backgroundColor: '#fff',
  },
});
