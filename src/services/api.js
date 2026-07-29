// Замените на ваши реальные значения из JSONBin.io

// ⚠️ УБЕДИТЕСЬ, ЧТО ЗДЕСЬ ВСТАВЛЕНЫ НАСТОЯЩИЕ ЗНАЧЕНИЯ БЕЗ СКОБОК И ПРОБЕЛОВ!


// ⚠️ Замените на ваши реальные данные из JSONBin.io
const BIN_ID = '6a696f58da38895dfe9e2a0b';
const API_KEY = '$2a$10$Q3PRvPm1RQEjwm7ll5VaPuDucTURtRSL23ltthf/WetwodziJe6um'; 

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export const fetchCloudServices = async () => {
  try {
    const response = await fetch(`${BASE_URL}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`[API GET Error] Статус: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // 🔍 ТЕСТОВЫЙ ВЫВОД В КОНСОЛЬ
    console.log('--- ДАННЫЕ ИЗ ОБЛАКА ---', data.record);
    console.log('Это массив?', Array.isArray(data.record));

    return data.record;
  } catch (error) {
    console.error('[API GET Catch]', error);
    return null;
  }
};

export const updateCloudServices = async (newServicesList) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(newServicesList),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(` Ошибка сохранения в облако (${response.status}): ${errText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Сетевая ошибка при отправке в облако:', error);
    return false;
  }
};

