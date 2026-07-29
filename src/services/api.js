// Ваши данные с jsonbin.io
const BIN_ID = '6a696f58da38895dfe9e2a0b'; 
const API_KEY = '$2a$10$Q3PRvPm1RQEjwm7ll5VaPuDucTURtRSL23ltthf/WetwodziJe6um';

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const headers = {
  'Content-Type': 'application/json',
  'X-Master-Key': API_KEY,
};

// Загрузка данных из внешнего облака
export const fetchCloudServices = async () => {
  try {
    const response = await fetch(`${BASE_URL}/latest`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.status}`);
    }

    const json = await response.json();
    // JSONbin оборачивает данные в защищенное поле record
    const data = json.record || {};

    return {
      services: data.services || null,
      carClasses: data.carClasses || null,
      categories: data.categories || null, // ← Добавлена загрузка категорий
    };
  } catch (error) {
    console.error('Ошибка загрузки из облака JSONbin:', error);
    return null;
  }
};

// Сохранение данных во внешнее облако
export const updateCloudServices = async (payload) => {
  try {
    // Получаем текущие данные, чтобы не затереть то, что не передано в payload
    const current = (await fetchCloudServices()) || {};

    const updatedData = {
      services: payload.services !== undefined ? payload.services : current.services,
      carClasses: payload.carClasses !== undefined ? payload.carClasses : current.carClasses,
      categories: payload.categories !== undefined ? payload.categories : current.categories, // ← Добавлено сохранение категорий
    };

    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сети при сохранении: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Ошибка сохранения в облако JSONbin:', error);
    return false;
  }
};
