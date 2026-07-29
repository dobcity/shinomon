import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RADIUS_OPTIONS } from '../constants';
import { triggerHaptic } from '../utils/storage';

export const CalculatorTab = ({
  carClasses,
  selectedClass,
  setSelectedClass,
  selectedRadius,
  setSelectedRadius,
  serviceCategories,
  selectedCategory,
  setSelectedCategory,
  servicesList,
  selectedServices,
  setSelectedServices,
  carNote,
  setCarNote,
  carPhoto,
  setCarPhoto,
  onCreateOrder,
}) => {
  const getItemPrice = useCallback((service, classId, radius) => {
    if (service?.prices?.[classId]) {
      const val = service.prices[classId][radius];
      return val !== undefined && val !== null && val !== '' ? Number(val) : 0;
    }
    return 0;
  }, []);

  // Вычисление итоговой суммы через useMemo
  const totalSum = useMemo(() => {
    if (!selectedClass) return 0;
    return Object.keys(selectedServices).reduce((sum, id) => {
      const service = servicesList.find((s) => s.id === id);
      const qty = selectedServices[id] || 0;
      if (!service || qty <= 0) return sum;
      return sum + getItemPrice(service, selectedClass.id, selectedRadius) * qty;
    }, 0);
  }, [selectedServices, selectedClass, selectedRadius, servicesList, getItemPrice]);

  // Фильтрация списка услуг через useMemo
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Все') return servicesList;
    return servicesList.filter((s) => s.category === selectedCategory);
  }, [servicesList, selectedCategory]);

  const handleQtyChange = useCallback(
    (id, delta) => {
      triggerHaptic();
      setSelectedServices((prev) => {
        const current = prev[id] || 0;
        const next = Math.max(0, current + delta);
        const updated = { ...prev };
        if (next === 0) delete updated[id];
        else updated[id] = next;
        return updated;
      });
    },
    [setSelectedServices]
  );

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.6 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setCarPhoto(res.assets[0].uri);
    }
  };

  const categoriesFilter = useMemo(() => ['Все', ...serviceCategories], [serviceCategories]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <Text style={styles.sectionTitle}>1. Класс авто</Text>
        <View style={styles.classRow}>
          {carClasses.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.classCard, selectedClass?.id === c.id && styles.classCardSelected]}
              onPress={() => {
                triggerHaptic();
                setSelectedClass(c);
              }}>
              <Text 
                style={[styles.classCardTitle, selectedClass?.id === c.id && styles.classCardTitleSelected]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>2. Диаметр колес (Радиус)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowMargin}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, selectedRadius === r && styles.radiusChipSelected]}
              onPress={() => {
                triggerHaptic();
                setSelectedRadius(r);
              }}>
              <Text style={[styles.radiusChipText, selectedRadius === r && styles.radiusChipTextSelected]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>3. Услуги</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowMargin}>
          {categoriesFilter.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredServices.map((service) => {
          const itemPrice = selectedClass ? getItemPrice(service, selectedClass.id, selectedRadius) : 0;
          const qty = selectedServices[service.id] || 0;
          return (
            <View key={service.id} style={styles.serviceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>{itemPrice} ₽</Text>
              </View>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => handleQtyChange(service.id, -1)}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterQty}>{qty}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => handleQtyChange(service.id, 1)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>4. Инфо о клиенте и фото</Text>
        <TextInput
          style={styles.input}
          placeholder="Госномер / марка авто"
          value={carNote}
          onChangeText={setCarNote}
        />
        {carPhoto ? (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: carPhoto }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setCarPhoto(null)}>
              <Text style={styles.removeBtnText}>Удалить фото</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
            <Text style={styles.photoBtnText}>📷 Сделать фото авто</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerLabel}>Итого:</Text>
          <Text style={styles.footerVal}>{totalSum} ₽</Text>
        </View>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => {
            triggerHaptic();
            onCreateOrder(totalSum);
          }}>
          <Text style={styles.orderBtnText}>Оформить чек 🧾</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#212529', marginTop: 12, marginBottom: 8 },
  
  // Изменено: добавлено flexWrap для переноса строк и небольшой gap вместо фиксированных отступов
  classRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  
  // Изменено: убран flex: 1, добавлены фиксированные отступы по бокам, чтобы кнопка сама адаптировалась под текст
  classCard: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ced4da', alignItems: 'center' },
  classCardSelected: { borderColor: '#0d6efd', backgroundColor: '#e7f1ff' },
  classCardTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  classCardTitleSelected: { color: '#0d6efd' },
  
  rowMargin: { marginBottom: 12 },
  radiusChip: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ced4da', marginRight: 8 },
  radiusChipSelected: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
  radiusChipText: { fontSize: 13, color: '#495057' },
  radiusChipTextSelected: { color: '#fff', fontWeight: 'bold' },
  categoryChip: { backgroundColor: '#e9ecef', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6 },
  categoryChipSelected: { backgroundColor: '#212529' },
  categoryChipText: { fontSize: 12, color: '#495057' },
  categoryChipTextSelected: { color: '#fff', fontWeight: 'bold' },
  serviceRow: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  serviceName: { fontSize: 14, color: '#212529' },
  servicePrice: { fontSize: 15, fontWeight: 'bold', color: '#0d6efd', marginTop: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
  counterBtnText: { fontSize: 18, fontWeight: 'bold' },
  counterQty: { fontSize: 15, fontWeight: 'bold', marginHorizontal: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 10, marginBottom: 8 },
  photoBtn: { backgroundColor: '#e9ecef', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  photoBtnText: { color: '#495057', fontWeight: 'bold' },
  photoWrapper: { marginTop: 8, alignItems: 'center' },
  photoPreview: { width: '100%', height: 160, borderRadius: 8 },
  removeBtn: { marginTop: 6 },
  removeBtnText: { color: '#dc3545', fontSize: 12, fontWeight: 'bold' },
  footerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#dee2e6' },
  footerLabel: { fontSize: 12, color: '#6c757d' },
  footerVal: { fontSize: 20, fontWeight: 'bold', color: '#198754' },
  orderBtn: { backgroundColor: '#198754', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  orderBtnText: { color: '#fff', fontWeight: 'bold' },
});
