// Замените на ваши реальные значения из JSONBin.io
const BIN_ID = '6a6964f0da38895dfe9e0f3a';
const API_KEY = '$2a$10$Q3PRvPm1RQEjwm7ll5VaPuDucTURtRSL23ltthf/WetwodziJe6um'; 

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Загрузка актуального прайс-листа из облака
export const fetchCloudServices = async () => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();
    // JSONBin возвращает данные внутри объекта record
    return data.record;
  } catch (error) {
    console.error('Не удалось загрузить цены из облака:', error);
    return null;
  }
};

// Сохранение обновленного прайс-листа в облако
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
      throw new Error(`Ошибка обновления: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Не удалось сохранить цены в облако:', error);
    return false;
  }
};
