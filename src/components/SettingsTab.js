import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { RADIUS_OPTIONS } from '../constants';

export const SettingsTab = ({ servicesList, setServicesList, carClasses, onSaveServices }) => {
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrices, setEditPrices] = useState({});

  const handleStartEdit = (service) => {
    setEditingServiceId(service.id);
    setEditName(service.name);
    setEditPrices(JSON.parse(JSON.stringify(service.prices || {})));
  };

  const handlePriceChange = (classId, radius, value) => {
    setEditPrices((prev) => ({
      ...prev,
      [classId]: {
        ...(prev[classId] || {}),
        [radius]: value,
      },
    }));
  };

  const handleSave = (id) => {
    const updated = servicesList.map((s) => {
      if (s.id === id) {
        return { ...s, name: editName, prices: editPrices };
      }
      return s;
    });
    setServicesList(updated);
    onSaveServices(updated);
    setEditingServiceId(null);
    Alert.alert('Успех', 'Настройки прайс-листа сохранены!');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.title}>Управление прайс-листом</Text>

      {servicesList.map((service) => {
        const isEditing = editingServiceId === service.id;

        return (
          <View key={service.id} style={styles.card}>
            {isEditing ? (
              <View>
                <Text style={styles.label}>Название услуги:</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

                {carClasses.map((c) => (
                  <View key={c.id} style={styles.classBlock}>
                    <Text style={styles.classTitle}>Класс: {c.name}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {RADIUS_OPTIONS.map((r) => (
                        <View key={r} style={styles.priceInputBox}>
                          <Text style={styles.radiusLabel}>{r}</Text>
                          <TextInput
                            style={styles.priceInput}
                            keyboardType="numeric"
                            value={String(editPrices?.[c.id]?.[r] ?? '')}
                            onChangeText={(val) => handlePriceChange(c.id, r, val)}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ))}

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave(service.id)}>
                    <Text style={styles.saveBtnText}>Сохранить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingServiceId(null)}>
                    <Text style={styles.cancelBtnText}>Отмена</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{service.name}</Text>
                  <Text style={styles.serviceCat}>Категория: {service.category}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleStartEdit(service)}>
                  <Text style={styles.editBtnText}>✏️ Редактировать цены</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 14, color: '#212529' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceTitle: { fontSize: 15, fontWeight: 'bold', color: '#212529' },
  serviceCat: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  editBtn: { backgroundColor: '#e7f1ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  editBtnText: { color: '#0d6efd', fontSize: 12, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, padding: 8, marginBottom: 10, backgroundColor: '#fff' },
  classBlock: { marginTop: 8, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 },
  classTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  priceInputBox: { marginRight: 8, alignItems: 'center' },
  radiusLabel: { fontSize: 11, color: '#6c757d', marginBottom: 2 },
  priceInput: { borderWidth: 1, borderColor: '#ced4da', backgroundColor: '#fff', borderRadius: 4, width: 55, padding: 4, textAlign: 'center', fontSize: 12 },
  btnRow: { flexDirection: 'row', marginTop: 12 },
  saveBtn: { flex: 1, backgroundColor: '#198754', padding: 10, borderRadius: 6, alignItems: 'center', marginRight: 6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { flex: 1, backgroundColor: '#6c757d', padding: 10, borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  cancelBtnText: { color: '#fff', fontWeight: 'bold' },
});
