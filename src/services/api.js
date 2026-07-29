const BIN_ID = '6a696f58da38895dfe9e2a0b';
const API_KEY = '$2a$10$Q3PRvPm1RQEjwm7ll5VaPuDucTURtRSL23ltthf/WetwodziJe6um';

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export const fetchCloudServices = async () => {
  try {
    const response = await fetch(`${BASE_URL}/latest`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`[API GET Error] Статус: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data?.record || data;
  } catch (error) {
    console.error('[API GET Catch]', error);
    return null;
  }
};

export const updateCloudServices = async (newServicesList) => {
  try {
    const cleanData = JSON.parse(JSON.stringify(newServicesList || []));

    const response = await fetch(BASE_URL, {
      method: 'PUT',
      mode: 'cors',
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
