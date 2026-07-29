import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';

export const HistoryTab = ({ savedOrders, onClearHistory }) => {
  if (!savedOrders || savedOrders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>История заказов пока пуста 📜</Text>
      </View>
    );
  }

  const confirmClear = () => {
    Alert.alert('Очистка истории', 'Вы уверены, что хотите удалить все чеки?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: onClearHistory },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Всего чеков: {savedOrders.length}</Text>
        <TouchableOpacity onPress={confirmClear} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Очистить всё</Text>
        </TouchableOpacity>
      </View>

      {savedOrders.map((order) => (
        <View key={order.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.date}>{order.date}</Text>
            <Text style={styles.total}>{order.total} ₽</Text>
          </View>

          <Text style={styles.details}>
            🚗 {order.className} • {order.radius}
          </Text>

          {order.carNote ? <Text style={styles.note}>📝 {order.carNote}</Text> : null}

          {order.carPhoto && (
            <Image source={{ uri: order.carPhoto }} style={styles.photo} resizeMode="cover" />
          )}

          <View style={styles.divider} />

          {order.services.map((s, idx) => (
            <View key={idx} style={styles.serviceRow}>
              <Text style={styles.serviceName}>
                {s.name} x{s.qty}
              </Text>
              <Text style={styles.servicePrice}>{s.totalPrice} ₽</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#6c757d', fontSize: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#212529' },
  clearBtn: { padding: 4 },
  clearBtnText: { color: '#dc3545', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 12, color: '#6c757d' },
  total: { fontSize: 16, fontWeight: 'bold', color: '#198754' },
  details: { fontSize: 14, fontWeight: '600', color: '#212529', marginBottom: 4 },
  note: { fontSize: 13, color: '#495057', fontStyle: 'italic', marginBottom: 6 },
  photo: { width: '100%', height: 160, borderRadius: 6, marginVertical: 6 },
  divider: { height: 1, backgroundColor: '#f1f3f5', marginVertical: 8 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  serviceName: { fontSize: 13, color: '#495057' },
  servicePrice: { fontSize: 13, fontWeight: '600' },
});
