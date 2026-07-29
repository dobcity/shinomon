import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const RADIUS_OPTIONS = [
  'R13',
  'R14',
  'R15',
  'R16',
  'R17',
  'R18',
  'R19',
  'R20',
  'R21',
  'R22',
];

// Дефолтные классы авто
const DEFAULT_CLASSES = [
  { id: 'sedan', name: 'Легковые' },
  { id: 'crossover', name: 'Кроссоверы / Внедорожники' },
  { id: 'van', name: 'Микроавтобусы / Коммерческие' },
];

// Дефолтные категории услуг
const DEFAULT_CATEGORIES = ['Шиномонтаж', 'Ремонт', 'Дополнительно'];

// Функция для генерации дефолтных цен по радиусам
const generateDefaultRadiusPricesForClasses = (
  classesList,
  baseSedan = 1500,
  step = 100
) => {
  const prices = {};
  classesList.forEach((c, cIdx) => {
    prices[c.id] = {};
    const classBase = baseSedan + cIdx * 400;
    RADIUS_OPTIONS.forEach((r, idx) => {
      prices[c.id][r] = classBase + idx * step;
    });
  });
  return prices;
};

// Начальные данные услуг
const DEFAULT_SERVICES = [
  {
    id: '1',
    category: 'Шиномонтаж',
    name: 'Комплексная переобувка (4 колеса)',
    prices: generateDefaultRadiusPricesForClasses(DEFAULT_CLASSES, 1800, 150),
  },
  {
    id: '2',
    category: 'Шиномонтаж',
    name: 'Снятие / установка колеса',
    prices: generateDefaultRadiusPricesForClasses(DEFAULT_CLASSES, 150, 20),
  },
  {
    id: '3',
    category: 'Шиномонтаж',
    name: 'Балансировка колеса',
    prices: generateDefaultRadiusPricesForClasses(DEFAULT_CLASSES, 200, 30),
  },
  {
    id: '4',
    category: 'Ремонт',
    name: 'Ремонт прокола (жгут)',
    prices: generateDefaultRadiusPricesForClasses(DEFAULT_CLASSES, 350, 20),
  },
  {
    id: '5',
    category: 'Ремонт',
    name: 'Установка заплатки',
    prices: generateDefaultRadiusPricesForClasses(DEFAULT_CLASSES, 600, 50),
  },
  {
    id: '6',
    category: 'Дополнительно',
    name: 'Сезонное хранение шин',
    prices: generateDefaultRadiusPricesForClasses(DEFAULT_CLASSES, 2000, 100),
  },
];

const STORAGE_KEYS = {
  SERVICES: '@tyre_app_services_v4',
  ORDERS: '@tyre_app_orders_v4',
  CLASSES: '@tyre_app_classes_v4',
  CATEGORIES: '@tyre_app_categories_v4',
};

// Создание пустой структуры цен для активных классов
const createEmptyPricesStructure = (classesList) => {
  const prices = {};
  classesList.forEach((c) => {
    prices[c.id] = {};
    RADIUS_OPTIONS.forEach((r) => {
      prices[c.id][r] = '';
    });
  });
  return prices;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('calc'); // 'calc' | 'history' | 'settings'
  const [isLoaded, setIsLoaded] = useState(false);

  // Справочники
  const [carClasses, setCarClasses] = useState(DEFAULT_CLASSES);
  const [serviceCategories, setServiceCategories] =
    useState(DEFAULT_CATEGORIES);
  const [servicesList, setServicesList] = useState(DEFAULT_SERVICES);
  const [savedOrders, setSavedOrders] = useState([]);

  // Состояние калькулятора
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState('R16');
  const [selectedServices, setSelectedServices] = useState({});
  const [carNote, setCarNote] = useState('');
  const [carPhoto, setCarPhoto] = useState(null); // URI фотографии
  const [selectedCategory, setSelectedCategory] = useState('Все');

  // Чек
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [currentOrderReceipt, setCurrentOrderReceipt] = useState(null);

  // Подраздел в настройках: 'services' | 'classes' | 'categories'
  const [settingsSubTab, setSettingsSubTab] = useState('services');

  // Модалка добавления/редактирования Услуги
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [formPrices, setFormPrices] = useState({});
  const [activeModalClassTab, setActiveModalClassTab] = useState('');
  const [quickBasePrice, setQuickBasePrice] = useState('1500');
  const [quickStep, setQuickStep] = useState('100');

  // Модалка добавления/редактирования Класса авто
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classNameInput, setClassNameInput] = useState('');

  // Модалка добавления/редактирования Категории
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedClasses = await AsyncStorage.getItem(STORAGE_KEYS.CLASSES);
      const storedCategories = await AsyncStorage.getItem(
        STORAGE_KEYS.CATEGORIES
      );
      const storedServices = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);

      let loadedClasses = DEFAULT_CLASSES;
      if (storedClasses) {
        loadedClasses = JSON.parse(storedClasses);
      }
      setCarClasses(loadedClasses);
      if (loadedClasses.length > 0) {
        setSelectedClass(loadedClasses[0]);
        setActiveModalClassTab(loadedClasses[0].id);
      }

      let loadedCategories = DEFAULT_CATEGORIES;
      if (storedCategories) {
        loadedCategories = JSON.parse(storedCategories);
      }
      setServiceCategories(loadedCategories);
      if (loadedCategories.length > 0) {
        setNewServiceCategory(loadedCategories[0]);
      }

      if (storedServices) {
        const parsed = JSON.parse(storedServices);
        const migrated = parsed.map((s) => {
          const newPrices = {};
          loadedClasses.forEach((c) => {
            newPrices[c.id] = {};
            RADIUS_OPTIONS.forEach((r) => {
              if (
                s.prices &&
                s.prices[c.id] &&
                s.prices[c.id][r] !== undefined
              ) {
                newPrices[c.id][r] = s.prices[c.id][r];
              } else if (s.prices && typeof s.prices[c.id] === 'number') {
                newPrices[c.id][r] = s.prices[c.id];
              } else {
                newPrices[c.id][r] = 500;
              }
            });
          });
          return { ...s, prices: newPrices };
        });
        setServicesList(migrated);
      }

      if (storedOrders) {
        setSavedOrders(JSON.parse(storedOrders));
      }
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    } finally {
      setIsLoaded(true);
    }
  };

  // Сохранение в AsyncStorage
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(
        STORAGE_KEYS.CLASSES,
        JSON.stringify(carClasses)
      ).catch(console.error);
    }
  }, [carClasses, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(serviceCategories)
      ).catch(console.error);
    }
  }, [serviceCategories, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(
        STORAGE_KEYS.SERVICES,
        JSON.stringify(servicesList)
      ).catch(console.error);
    }
  }, [servicesList, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(
        STORAGE_KEYS.ORDERS,
        JSON.stringify(savedOrders)
      ).catch(console.error);
    }
  }, [savedOrders, isLoaded]);

  // --- РАБОТА С КАМЕРОЙ И ГАЛЕРЕЕЙ ---
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Ошибка',
        'Разрешите доступ к камере в настройках устройства.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCarPhoto(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCarPhoto(result.assets[0].uri);
    }
  };

  // Безопасное получение цены
  const getItemPrice = (service, classId, radius) => {
    if (service.prices && service.prices[classId]) {
      const val = service.prices[classId][radius];
      if (val !== undefined && val !== null && val !== '') {
        return Number(val) || 0;
      }
    }
    return 0;
  };

  const calculateTotal = () => {
    if (!selectedClass) return 0;
    return Object.keys(selectedServices).reduce((sum, id) => {
      const service = servicesList.find((s) => s.id === id);
      const qty = selectedServices[id] || 0;
      if (!service || qty <= 0) return sum;
      return (
        sum + getItemPrice(service, selectedClass.id, selectedRadius) * qty
      );
    }, 0);
  };

  const handleQtyChange = (id, delta) => {
    setSelectedServices((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  // Оформление заказа
  const handleCreateOrder = () => {
    if (!selectedClass) return;
    const activeIds = Object.keys(selectedServices).filter(
      (id) => selectedServices[id] > 0
    );
    if (activeIds.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одну услугу.');
      return;
    }

    const orderServices = activeIds.map((id) => {
      const s = servicesList.find((item) => item.id === id);
      const price = getItemPrice(s, selectedClass.id, selectedRadius);
      const qty = selectedServices[id];
      return {
        id,
        name: s?.name || 'Услуга',
        category: s?.category || 'Разное',
        qty,
        unitPrice: price,
        totalPrice: price * qty,
      };
    });

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      className: selectedClass.name,
      radius: selectedRadius,
      carNote,
      carPhoto,
      services: orderServices,
      total: calculateTotal(),
    };

    setSavedOrders((prev) => [newOrder, ...prev]);
    setCurrentOrderReceipt(newOrder);
    setIsReceiptModalVisible(true);
    setSelectedServices({});
    setCarNote('');
    setCarPhoto(null);
  };

  // --- УПРАВЛЕНИЕ КЛАССАМИ АВТО ---
  const handleOpenAddClassModal = () => {
    setEditingClass(null);
    setClassNameInput('');
    setIsClassModalVisible(true);
  };

  const handleOpenEditClassModal = (cls) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setIsClassModalVisible(true);
  };

  const handleSaveClass = () => {
    if (!classNameInput.trim()) {
      Alert.alert('Ошибка', 'Введите название класса.');
      return;
    }

    if (editingClass) {
      setCarClasses((prev) =>
        prev.map((c) =>
          c.id === editingClass.id ? { ...c, name: classNameInput.trim() } : c
        )
      );
    } else {
      const newId = 'class_' + Date.now();
      const newCls = { id: newId, name: classNameInput.trim() };

      setCarClasses((prev) => [...prev, newCls]);

      setServicesList((prev) =>
        prev.map((s) => {
          const updatedPrices = { ...s.prices };
          updatedPrices[newId] = {};
          RADIUS_OPTIONS.forEach((r, idx) => {
            updatedPrices[newId][r] = 1500 + idx * 100;
          });
          return { ...s, prices: updatedPrices };
        })
      );

      if (!selectedClass) setSelectedClass(newCls);
    }

    setIsClassModalVisible(false);
  };

  const handleDeleteClass = (id) => {
    if (carClasses.length <= 1) {
      Alert.alert('Ошибка', 'Должен остаться хотя бы один класс авто.');
      return;
    }
    Alert.alert(
      'Удаление класса',
      'Удалить этот класс авто? Цены по нему будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setCarClasses((prev) => prev.filter((c) => c.id !== id));
            if (selectedClass?.id === id) {
              const remaining = carClasses.filter((c) => c.id !== id);
              setSelectedClass(remaining[0]);
            }
            setServicesList((prev) =>
              prev.map((s) => {
                const newP = { ...s.prices };
                delete newP[id];
                return { ...s, prices: newP };
              })
            );
          },
        },
      ]
    );
  };

  // --- УПРАВЛЕНИЕ КАТЕГОРИЯМИ ---
  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryNameInput('');
    setIsCategoryModalVisible(true);
  };

  const handleOpenEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryNameInput(cat);
    setIsCategoryModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmed = categoryNameInput.trim();
    if (!trimmed) {
      Alert.alert('Ошибка', 'Введите название категории.');
      return;
    }

    if (editingCategory) {
      if (serviceCategories.includes(trimmed) && editingCategory !== trimmed) {
        Alert.alert('Ошибка', 'Такая категория уже существует.');
        return;
      }
      setServiceCategories((prev) =>
        prev.map((c) => (c === editingCategory ? trimmed : c))
      );
      setServicesList((prev) =>
        prev.map((s) =>
          s.category === editingCategory ? { ...s, category: trimmed } : s
        )
      );
    } else {
      if (serviceCategories.includes(trimmed)) {
        Alert.alert('Ошибка', 'Такая категория уже есть.');
        return;
      }
      setServiceCategories((prev) => [...prev, trimmed]);
    }
    setIsCategoryModalVisible(false);
  };

  const handleDeleteCategory = (cat) => {
    if (serviceCategories.length <= 1) {
      Alert.alert('Ошибка', 'Должна остаться хотя бы одна категория.');
      return;
    }
    Alert.alert(
      'Удаление',
      `Удалить категорию "${cat}"? Услуги в ней перейдут в первую доступную категорию.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            const fallback = serviceCategories.filter((c) => c !== cat)[0];
            setServiceCategories((prev) => prev.filter((c) => c !== cat));
            setServicesList((prev) =>
              prev.map((s) =>
                s.category === cat ? { ...s, category: fallback } : s
              )
            );
          },
        },
      ]
    );
  };

  // --- УПРАВЛЕНИЕ УСЛУГАМИ ---
  const handleOpenAddServiceModal = () => {
    setEditingService(null);
    setNewServiceName('');
    setNewServiceCategory(serviceCategories[0] || 'Общие');
    setFormPrices(createEmptyPricesStructure(carClasses));
    if (carClasses.length > 0) setActiveModalClassTab(carClasses[0].id);
    setIsServiceModalVisible(true);
  };

  const handleOpenEditServiceModal = (service) => {
    setEditingService(service);
    setNewServiceName(service.name);
    setNewServiceCategory(service.category);
    if (carClasses.length > 0) setActiveModalClassTab(carClasses[0].id);

    const loaded = {};
    carClasses.forEach((c) => {
      loaded[c.id] = {};
      RADIUS_OPTIONS.forEach((r) => {
        const val = service.prices?.[c.id]?.[r];
        loaded[c.id][r] = val !== undefined ? val.toString() : '';
      });
    });
    setFormPrices(loaded);
    setIsServiceModalVisible(true);
  };

  const handleSaveService = () => {
    if (!newServiceName.trim()) {
      Alert.alert('Ошибка', 'Укажите название услуги.');
      return;
    }

    const cleanPrices = {};
    carClasses.forEach((c) => {
      cleanPrices[c.id] = {};
      RADIUS_OPTIONS.forEach((r) => {
        const val = formPrices[c.id]?.[r];
        cleanPrices[c.id][r] =
          val === '' || isNaN(Number(val)) ? 0 : Number(val);
      });
    });

    if (editingService) {
      setServicesList((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: newServiceName.trim(),
                category: newServiceCategory,
                prices: cleanPrices,
              }
            : s
        )
      );
    } else {
      const newS = {
        id: Date.now().toString(),
        name: newServiceName.trim(),
        category: newServiceCategory,
        prices: cleanPrices,
      };
      setServicesList((prev) => [...prev, newS]);
    }
    setIsServiceModalVisible(false);
  };

  const handleDeleteService = (id) => {
    Alert.alert('Удаление', 'Удалить эту услугу?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () =>
          setServicesList((prev) => prev.filter((s) => s.id !== id)),
      },
    ]);
  };

  const applyQuickFillModal = () => {
    const base = parseFloat(quickBasePrice) || 0;
    const step = parseFloat(quickStep) || 0;
    setFormPrices((prev) => {
      const updated = { ...prev };
      RADIUS_OPTIONS.forEach((r, idx) => {
        updated[activeModalClassTab][r] = (base + idx * step).toString();
      });
      return updated;
    });
  };

  const categoriesFilter = ['Все', ...serviceCategories];
  const filteredServices =
    selectedCategory === 'Все'
      ? servicesList
      : servicesList.filter((s) => s.category === selectedCategory);

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛞 Шиномонтаж Pro</Text>
        <Text style={styles.headerSubtitle}>
          Динамические классы авто и категории
        </Text>
      </View>

      {/* НАВИГАЦИОННЫЕ ВКЛАДКИ */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'calc' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('calc')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'calc' && styles.tabTextActive,
            ]}>
            🧮 Расчёт
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('history')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}>
            📜 История ({savedOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'settings' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('settings')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'settings' && styles.tabTextActive,
            ]}>
            ⚙️ Настройки
          </Text>
        </TouchableOpacity>
      </View>

      {/* КАЛЬКУЛЯТОР */}
      {activeTab === 'calc' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ paddingBottom: 110 }}>
            {/* Выбор класса авто */}
            <Text style={styles.sectionTitle}>1. Класс авто</Text>
            <View style={styles.classRow}>
              {carClasses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.classCard,
                    selectedClass?.id === c.id && styles.classCardSelected,
                  ]}
                  onPress={() => setSelectedClass(c)}>
                  <Text
                    style={[
                      styles.classCardTitle,
                      selectedClass?.id === c.id &&
                        styles.classCardTitleSelected,
                    ]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Выбор радиуса */}
            <Text style={styles.sectionTitle}>2. Диаметр колес (Радиус)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.radiusContainer}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.radiusChip,
                    selectedRadius === r && styles.radiusChipSelected,
                  ]}
                  onPress={() => setSelectedRadius(r)}>
                  <Text
                    style={[
                      styles.radiusChipText,
                      selectedRadius === r && styles.radiusChipTextSelected,
                    ]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Фильтр категорий */}
            <Text style={styles.sectionTitle}>3. Услуги</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}>
              {categoriesFilter.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat &&
                        styles.categoryChipTextSelected,
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Список услуг */}
            {filteredServices.map((service) => {
              const itemPrice = selectedClass
                ? getItemPrice(service, selectedClass.id, selectedRadius)
                : 0;
              const qty = selectedServices[service.id] || 0;

              return (
                <View key={service.id} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>
                      {itemPrice} ₽{' '}
                      <Text style={styles.servicePriceSub}>
                        ({selectedClass?.name || ''}, {selectedRadius})
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => handleQtyChange(service.id, -1)}>
                      <Text style={styles.counterBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterQty}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => handleQtyChange(service.id, 1)}>
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Заметка и Фотография авто */}
            <Text style={styles.sectionTitle}>
              4. Инфо о клиенте и фото авто
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Введите госномер, марку или имя клиента"
              value={carNote}
              onChangeText={setCarNote}
            />

            <View style={styles.photoPickerContainer}>
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={handleTakePhoto}>
                  <Text style={styles.photoBtnText}>📷 Сделать фото</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoBtn, styles.photoBtnSecondary]}
                  onPress={handlePickPhoto}>
                  <Text style={styles.photoBtnTextSecondary}>
                    🖼️ Из галереи
                  </Text>
                </TouchableOpacity>
              </View>

              {carPhoto && (
                <View style={styles.photoPreviewWrapper}>
                  <Image
                    source={{ uri: carPhoto }}
                    style={styles.photoPreview}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setCarPhoto(null)}>
                    <Text style={styles.removePhotoBtnText}>
                      ✕ Удалить фото
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setSelectedServices({});
                setCarNote('');
                setCarPhoto(null);
              }}>
              <Text style={styles.clearBtnText}>Очистить выбор</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footerBar}>
            <View>
              <Text style={styles.footerTotalLabel}>Итого к оплате:</Text>
              <Text style={styles.footerTotalVal}>{calculateTotal()} ₽</Text>
            </View>
            <TouchableOpacity
              style={styles.createOrderBtn}
              onPress={handleCreateOrder}>
              <Text style={styles.createOrderBtnText}>Оформить чек 🧾</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ИСТОРИЯ */}
      {activeTab === 'history' && (
        <View style={{ flex: 1 }}>
          {savedOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>История заказов пуста</Text>
            </View>
          ) : (
            <FlatList
              data={savedOrders}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyTotal}>{item.total} ₽</Text>
                  </View>
                  <Text style={styles.historySub}>
                    Авто: {item.className} | Размер: {item.radius}
                  </Text>
                  {item.carNote ? (
                    <Text style={styles.historyNote}>📝 {item.carNote}</Text>
                  ) : null}

                  {item.carPhoto && (
                    <Image
                      source={{ uri: item.carPhoto }}
                      style={styles.historyPhotoThumbnail}
                    />
                  )}

                  <View style={styles.historyServicesList}>
                    {item.services.map((s, idx) => (
                      <View key={idx} style={styles.historyServiceItem}>
                        <Text style={styles.historyServiceName}>
                          • {s.name} x{s.qty}
                        </Text>
                        <Text style={styles.historyServicePrice}>
                          {s.totalPrice} ₽
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.reopenReceiptBtn}
                    onPress={() => {
                      setCurrentOrderReceipt(item);
                      setIsReceiptModalVisible(true);
                    }}>
                    <Text style={styles.reopenReceiptText}>Посмотреть чек</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* НАСТРОЙКИ (ПОДРАЗДЕЛЫ) */}
      {activeTab === 'settings' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={styles.settingsSubBar}>
            <TouchableOpacity
              style={[
                styles.settingsSubBtn,
                settingsSubTab === 'services' && styles.settingsSubBtnActive,
              ]}
              onPress={() => setSettingsSubTab('services')}>
              <Text
                style={[
                  styles.settingsSubText,
                  settingsSubTab === 'services' && styles.settingsSubTextActive,
                ]}>
                Услуги
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingsSubBtn,
                settingsSubTab === 'classes' && styles.settingsSubBtnActive,
              ]}
              onPress={() => setSettingsSubTab('classes')}>
              <Text
                style={[
                  styles.settingsSubText,
                  settingsSubTab === 'classes' && styles.settingsSubTextActive,
                ]}>
                Классы авто
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingsSubBtn,
                settingsSubTab === 'categories' && styles.settingsSubBtnActive,
              ]}
              onPress={() => setSettingsSubTab('categories')}>
              <Text
                style={[
                  styles.settingsSubText,
                  settingsSubTab === 'categories' &&
                    styles.settingsSubTextActive,
                ]}>
                Категории
              </Text>
            </TouchableOpacity>
          </View>

          {/* КОНТЕНТ ПОДРАЗДЕЛА: УСЛУГИ */}
          {settingsSubTab === 'services' && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleOpenAddServiceModal}>
                <Text style={styles.addBtnText}>+ Добавить услугу</Text>
              </TouchableOpacity>
              <FlatList
                data={servicesList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => {
                  const firstClassId = carClasses[0]?.id;
                  const samplePrice = firstClassId
                    ? getItemPrice(item, firstClassId, 'R16')
                    : 0;
                  return (
                    <View style={styles.settingRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingCategory}>
                          {item.category}
                        </Text>
                        <Text style={styles.settingName}>{item.name}</Text>
                        <Text style={styles.settingPrice}>
                          R16 ({carClasses[0]?.name || ''}): {samplePrice} ₽
                        </Text>
                      </View>
                      <View style={styles.settingActions}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleOpenEditServiceModal(item)}>
                          <Text style={styles.editBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteService(item.id)}>
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          )}

          {/* КОНТЕНТ ПОДРАЗДЕЛА: КЛАССЫ АВТО */}
          {settingsSubTab === 'classes' && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleOpenAddClassModal}>
                <Text style={styles.addBtnText}>+ Добавить класс авто</Text>
              </TouchableOpacity>
              <FlatList
                data={carClasses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingName}>{item.name}</Text>
                      <Text style={styles.settingCategory}>ID: {item.id}</Text>
                    </View>
                    <View style={styles.settingActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenEditClassModal(item)}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteClass(item.id)}>
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          {/* КОНТЕНТ ПОДРАЗДЕЛА: КАТЕГОРИИ */}
          {settingsSubTab === 'categories' && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleOpenAddCategoryModal}>
                <Text style={styles.addBtnText}>+ Добавить категорию</Text>
              </TouchableOpacity>
              <FlatList
                data={serviceCategories}
                keyExtractor={(item) => item}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingName}>{item}</Text>
                    </View>
                    <View style={styles.settingActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenEditCategoryModal(item)}>
                        <Text style={styles.editBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteCategory(item)}>
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      )}

      {/* МОДАЛКА ЧЕКА */}
      <Modal
        visible={isReceiptModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReceiptModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.receiptTitle}>🧾 ЧЕК ОПЛАТЫ</Text>
              <Text style={styles.receiptSubtitle}>
                Шиномонтажная мастерская
              </Text>
              <View style={styles.divider} />
              {currentOrderReceipt && (
                <>
                  <Text style={styles.receiptMeta}>
                    Дата: {currentOrderReceipt.date}
                  </Text>
                  <Text style={styles.receiptMeta}>
                    Авто: {currentOrderReceipt.className} (
                    {currentOrderReceipt.radius})
                  </Text>
                  {currentOrderReceipt.carNote ? (
                    <Text style={styles.receiptMeta}>
                      Заметка: {currentOrderReceipt.carNote}
                    </Text>
                  ) : null}

                  {currentOrderReceipt.carPhoto && (
                    <Image
                      source={{ uri: currentOrderReceipt.carPhoto }}
                      style={styles.receiptPhoto}
                    />
                  )}

                  <View style={styles.divider} />
                  <Text style={styles.receiptSectionHeader}>Услуги:</Text>
                  {currentOrderReceipt.services.map((item, idx) => (
                    <View key={idx} style={styles.receiptItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.receiptItemName}>{item.name}</Text>
                        <Text style={styles.receiptItemDetails}>
                          {item.qty} шт x {item.unitPrice} ₽
                        </Text>
                      </View>
                      <Text style={styles.receiptItemTotal}>
                        {item.totalPrice} ₽
                      </Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>ИТОГО:</Text>
                    <Text style={styles.receiptTotalVal}>
                      {currentOrderReceipt.total} ₽
                    </Text>
                  </View>
                </>
              )}
              <TouchableOpacity
                style={styles.closeReceiptBtn}
                onPress={() => setIsReceiptModalVisible(false)}>
                <Text style={styles.closeReceiptBtnText}>Закрыть</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* МОДАЛКА УСЛУГИ / ЦЕН */}
      <Modal
        visible={isServiceModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsServiceModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHeaderTitle}>
                {editingService ? 'Редактирование услуги' : 'Новая услуга'}
              </Text>

              <Text style={styles.fieldLabel}>Название услуги:</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: Замена вентиля"
                value={newServiceName}
                onChangeText={setNewServiceName}
              />

              <Text style={styles.fieldLabel}>Категория:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}>
                {serviceCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newServiceCategory === cat && styles.categoryChipSelected,
                    ]}
                    onPress={() => setNewServiceCategory(cat)}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        newServiceCategory === cat &&
                          styles.categoryChipTextSelected,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>
                Класс авто для настройки цен:
              </Text>
              <View style={styles.modalTabRow}>
                {carClasses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.modalTabBtn,
                      activeModalClassTab === c.id && styles.modalTabBtnActive,
                    ]}
                    onPress={() => setActiveModalClassTab(c.id)}>
                    <Text
                      style={[
                        styles.modalTabText,
                        activeModalClassTab === c.id &&
                          styles.modalTabTextActive,
                      ]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.quickFillBox}>
                <Text style={styles.quickFillTitle}>
                  ⚡ Автозаполнение радиусов
                </Text>
                <View style={styles.quickFillRow}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.subFieldLabel}>База R13:</Text>
                    <TextInput
                      style={styles.quickInput}
                      keyboardType="numeric"
                      value={quickBasePrice}
                      onChangeText={setQuickBasePrice}
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.subFieldLabel}>Шаг за R (+):</Text>
                    <TextInput
                      style={styles.quickInput}
                      keyboardType="numeric"
                      value={quickStep}
                      onChangeText={setQuickStep}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.quickApplyBtn}
                    onPress={applyQuickFillModal}>
                    <Text style={styles.quickApplyBtnText}>Заполнить</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Цены по радиусам (₽):</Text>
              <View style={styles.radiusGrid}>
                {RADIUS_OPTIONS.map((r) => (
                  <View key={r} style={styles.radiusInputItem}>
                    <Text style={styles.radiusInputLabel}>{r}</Text>
                    <TextInput
                      style={styles.radiusInput}
                      keyboardType="numeric"
                      placeholder="0"
                      value={formPrices[activeModalClassTab]?.[r] ?? ''}
                      onChangeText={(text) => {
                        setFormPrices((prev) => ({
                          ...prev,
                          [activeModalClassTab]: {
                            ...prev[activeModalClassTab],
                            [r]: text,
                          },
                        }));
                      }}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setIsServiceModalVisible(false)}>
                  <Text style={styles.modalBtnCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={handleSaveService}>
                  <Text style={styles.modalBtnSaveText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* МОДАЛКА КЛАССА АВТО */}
      <Modal
        visible={isClassModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsClassModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>
              {editingClass ? 'Редактировать класс' : 'Новый класс авто'}
            </Text>
            <Text style={styles.fieldLabel}>Название:</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Легковые, Мото, Грузовые"
              value={classNameInput}
              onChangeText={setClassNameInput}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setIsClassModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveClass}>
                <Text style={styles.modalBtnSaveText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* МОДАЛКА КАТЕГОРИИ */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsCategoryModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>
              {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
            </Text>
            <Text style={styles.fieldLabel}>Название:</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Мойка, Шиномонтаж"
              value={categoryNameInput}
              onChangeText={setCategoryNameInput}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setIsCategoryModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveCategory}>
                <Text style={styles.modalBtnSaveText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  loadingText: { fontSize: 16, color: '#6c757d' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#6c757d' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 3, borderBottomColor: '#0d6efd' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6c757d' },
  tabTextActive: { color: '#0d6efd' },
  tabContent: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
    marginTop: 12,
    marginBottom: 8,
  },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  classCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classCardSelected: { borderColor: '#0d6efd', backgroundColor: '#e7f1ff' },
  classCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  classCardTitleSelected: { color: '#0d6efd' },
  radiusContainer: { flexDirection: 'row', marginBottom: 12 },
  radiusChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginRight: 8,
  },
  radiusChipSelected: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
  radiusChipText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  radiusChipTextSelected: { color: '#ffffff' },
  categoryContainer: { flexDirection: 'row', marginBottom: 12 },
  categoryChip: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  categoryChipSelected: { backgroundColor: '#212529' },
  categoryChipText: { fontSize: 12, color: '#495057' },
  categoryChipTextSelected: { color: '#ffffff', fontWeight: '600' },
  serviceRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  serviceInfo: { flex: 1, paddingRight: 8 },
  serviceName: { fontSize: 14, fontWeight: '500', color: '#212529' },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0d6efd',
    marginTop: 2,
  },
  servicePriceSub: { fontSize: 11, fontWeight: 'normal', color: '#6c757d' },
  counterRow: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  counterQty: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },

  // Стили для добавления снимков авто
  photoPickerContainer: { marginBottom: 12 },
  photoButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  photoBtn: {
    flex: 1,
    backgroundColor: '#0d6efd',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
  },
  photoBtnSecondary: {
    backgroundColor: '#e9ecef',
    marginRight: 0,
    marginLeft: 6,
  },
  photoBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  photoBtnTextSecondary: { color: '#495057', fontWeight: 'bold', fontSize: 13 },
  photoPreviewWrapper: {
    marginTop: 10,
    alignItems: 'center',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#dc3545',
    borderRadius: 4,
  },
  removePhotoBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  clearBtn: { alignSelf: 'center', paddingVertical: 10, marginTop: 8 },
  clearBtnText: { color: '#dc3545', fontSize: 13, fontWeight: '600' },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    elevation: 8,
  },
  footerTotalLabel: { fontSize: 12, color: '#6c757d' },
  footerTotalVal: { fontSize: 20, fontWeight: 'bold', color: '#198754' },
  createOrderBtn: {
    backgroundColor: '#198754',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createOrderBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6c757d' },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: { fontSize: 13, color: '#6c757d' },
  historyTotal: { fontSize: 16, fontWeight: 'bold', color: '#198754' },
  historySub: { fontSize: 13, fontWeight: '600', color: '#212529' },
  historyNote: { fontSize: 12, color: '#495057', marginTop: 4 },
  historyPhotoThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 6,
    marginTop: 8,
    resizeMode: 'cover',
  },
  historyServicesList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  historyServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyServiceName: { fontSize: 12, color: '#495057' },
  historyServicePrice: { fontSize: 12, fontWeight: '500', color: '#212529' },
  reopenReceiptBtn: { marginTop: 10, alignSelf: 'flex-start' },
  reopenReceiptText: { fontSize: 12, color: '#0d6efd', fontWeight: '600' },
  settingsSubBar: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  settingsSubBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  settingsSubBtnActive: { backgroundColor: '#ffffff', elevation: 1 },
  settingsSubText: { fontSize: 12, color: '#6c757d', fontWeight: '500' },
  settingsSubTextActive: { color: '#0d6efd', fontWeight: 'bold' },
  addBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  settingRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingCategory: {
    fontSize: 11,
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  settingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginTop: 2,
  },
  settingPrice: {
    fontSize: 12,
    color: '#198754',
    fontWeight: '500',
    marginTop: 3,
  },
  settingActions: { flexDirection: 'row' },
  editBtn: { padding: 8, marginRight: 4 },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#212529',
  },
  receiptSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: '#dee2e6', marginVertical: 10 },
  receiptMeta: { fontSize: 13, color: '#495057', marginBottom: 4 },
  receiptPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginVertical: 8,
    resizeMode: 'cover',
  },
  receiptSectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptItemName: { fontSize: 13, color: '#212529' },
  receiptItemDetails: { fontSize: 11, color: '#6c757d' },
  receiptItemTotal: { fontSize: 13, fontWeight: 'bold', color: '#212529' },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
  receiptTotalVal: { fontSize: 22, fontWeight: 'bold', color: '#198754' },
  closeReceiptBtn: {
    backgroundColor: '#212529',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeReceiptBtnText: { color: '#ffffff', fontWeight: 'bold' },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212529',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 6,
    fontWeight: '600',
  },
  subFieldLabel: { fontSize: 11, color: '#6c757d', marginBottom: 2 },
  modalTabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 2,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalTabBtnActive: { backgroundColor: '#ffffff', elevation: 1 },
  modalTabText: { fontSize: 12, color: '#6c757d', fontWeight: '500' },
  modalTabTextActive: { color: '#0d6efd', fontWeight: 'bold' },
  quickFillBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  quickFillTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 6,
  },
  quickFillRow: { flexDirection: 'row', alignItems: 'flex-end' },
  quickInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
  },
  quickApplyBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  quickApplyBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  radiusInputItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radiusInputLabel: {
    width: 38,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#495057',
  },
  radiusInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  modalBtnCancel: { backgroundColor: '#e9ecef' },
  modalBtnCancelText: { color: '#495057', fontWeight: '600' },
  modalBtnSave: { backgroundColor: '#0d6efd' },
  modalBtnSaveText: { color: '#ffffff', fontWeight: '600' },
});
