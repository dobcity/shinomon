import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { updateCloudServices } from '../services/api';

const ALL_RADII = ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21', 'R22'];

export default function SettingsTab({ servicesList = [], setServicesList, carClasses = [], categories = ['Шиномонтаж', 'Ремонт'] }) {
  const [newServiceName, setNewServiceName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'Шиномонтаж');

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
    
    const success = await updateCloudServices(updated);
    if (success) {
      Alert.alert('Успех', `Услуга "${trimmedName}" добавлена и сохранена в облако!`);
    } else {
      Alert.alert('Внимание', 'Услуга добавлена локально, но не удалось сохранить в облако.');
    }

    setNewServiceName('');
  };

  const handleDeleteService = async (id) => {
    const updated = servicesList.filter(s => s.id !== id);
    setServicesList(updated);
    const success = await updateCloudServices(updated);
    if (success) {
      Alert.alert('Успех', 'Услуга успешно удалена');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Панель управления ценами</Text>
      
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

      <Text style={styles.subtitle}>Список услуг в базе:</Text>
      {(servicesList || []).map((service, index) => {
        const sName = typeof service.name === 'string' ? service.name : (service.name?.name || 'Услуга');
        const sCat = typeof service.category === 'string' ? service.category : (service.category?.name || 'Категория');
        
        return (
          <View key={service.id || index} style={styles.serviceItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{sName}</Text>
              <Text style={styles.serviceCat}>{sCat}</Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteService(service.id)}>
              <Text style={styles.deleteButtonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#444', marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff', fontSize: 14 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  serviceItem: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  serviceName: { fontSize: 16, fontWeight: '500', color: '#333' },
  serviceCat: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteButton: { backgroundColor: '#ff3b30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  deleteButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
