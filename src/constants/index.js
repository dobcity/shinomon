export const RADIUS_OPTIONS = ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21', 'R22'];

export const DEFAULT_CLASSES = [
  { id: 'sedan', name: 'Легковые' },
  { id: 'crossover', name: 'Кроссоверы / Внедорожники' },
  { id: 'van', name: 'Микроавтобусы / Коммерческие' },
];

export const DEFAULT_CATEGORIES = ['Шиномонтаж', 'Ремонт', 'Дополнительно'];

export const STORAGE_KEYS = {
  SERVICES: '@tyre_app_services_v4',
  ORDERS: '@tyre_app_orders_v4',
  CLASSES: '@tyre_app_classes_v4',
  CATEGORIES: '@tyre_app_categories_v4',
};

const generateDefaultRadiusPrices = (classesList, baseSedan = 1500, step = 100) => {
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

export const DEFAULT_SERVICES = [
  {
    id: '1',
    category: 'Шиномонтаж',
    name: 'Комплексная переобувка (4 колеса)',
    prices: generateDefaultRadiusPrices(DEFAULT_CLASSES, 1800, 150),
  },
  {
    id: '2',
    category: 'Шиномонтаж',
    name: 'Балансировка колеса',
    prices: generateDefaultRadiusPrices(DEFAULT_CLASSES, 200, 30),
  },
  {
    id: '3',
    category: 'Ремонт',
    name: 'Ремонт прокола (жгут)',
    prices: generateDefaultRadiusPrices(DEFAULT_CLASSES, 350, 20),
  },
];
