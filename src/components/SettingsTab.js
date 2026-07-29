import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { updateCloudServices } from '../services/api';

const ALL_RADII = ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21', 'R22'];

export default function SettingsTab({ servicesList, setServicesList, carClasses, categories = ['Шиномонтаж', 'Ремонт'] }) {
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
      emptyPrices[cls.id] = {};
      ALL_RADII.forEach((r) => {
        emptyPrices[cls.id][r] = 0;
      });
    });

    const newService = {
      id: Date.now().toString(),
      category: selectedCategory,
      name: trimmedName,
      prices: emptyPrices,
    };

    const updated = [...(servicesList || []), newService];
    setServicesList(updated);
    
    // Синхронизация с облаком JSONBin
    const success = await updateCloudServices(updated);
    if (success) {
      Alert.alert('Успех', `Услуга "${trimmedName}" добавлена и сохранена в облако!`);
    } else {
      Alert.alert('Внимание', 'Услуга добавлена локально, но не удалось сохранить в облако.');
    }

    setNewServiceName('');
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff', fontSize: 14 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
