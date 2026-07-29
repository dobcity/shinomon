const BIN_ID = '6a696f58da38895dfe9e2a0b';
const API_KEY = '$2a$10$Q3PRvPm1RQEjwm7ll5VaPuDucTURtRSL23ltthf/WetwodziJe6um';

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// 1. Получение данных (без X-Master-Key, так как бин публичный для чтения)
export const fetchCloudServices = async () => {
  try {
    const response = await fetch(`${BASE_URL}/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[API GET Error] Статус: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data?.record || null;
  } catch (error) {
    console.error('[API GET Catch]', error);
    return null;
  }
};

// 2. Обновление данных (требует X-Master-Key для записи)
export const updateCloudServices = async (newServicesList) => {
  try {
    const cleanData = JSON.parse(JSON.stringify(newServicesList || []));

    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(cleanData),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Ошибка сохранения в облако (${response.status}): ${errText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Сетевая ошибка при отправке в облако:', error);
    return false;
  }
};
