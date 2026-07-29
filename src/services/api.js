import bridge from '@vkontakte/vk-bridge';

const VK_KEYS = {
  SERVICES: 'shinomontaj_services_v1',
  CLASSES: 'shinomontaj_classes_v1',
};

// Вспомогательная функция для таймаута (3 секунды), чтобы приложение не висело
const withTimeout = (promise, ms = 3000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('VK Bridge timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Загрузка данных из облака VK с защитой от зависания
export const fetchCloudServices = async () => {
  try {
    const data = await withTimeout(
      bridge.send('VKWebAppStorageGet', {
        keys: [VK_KEYS.SERVICES, VK_KEYS.CLASSES],
      }),
      3000
    );

    let services = null;
    let carClasses = null;

    if (data && data.keys) {
      data.keys.forEach((item) => {
        if (item.key === VK_KEYS.SERVICES && item.value) {
          try {
            services = JSON.parse(item.value);
          } catch (e) {
            console.error('Ошибка парсинга услуг', e);
          }
        }
        if (item.key === VK_KEYS.CLASSES && item.value) {
          try {
            carClasses = JSON.parse(item.value);
          } catch (e) {
            console.error('Ошибка парсинга классов', e);
          }
        }
      });
    }

    return { services, carClasses };
  } catch (error) {
    console.log('ℹ️ VK Storage недоступен или тайм-аут, используем локальный кэш.');
    return null;
  }
};

// Сохранение данных в облако VK с защитой от зависания
export const updateCloudServices = async (payload) => {
  try {
    const requests = [];

    if (payload.services) {
      requests.push(
        withTimeout(
          bridge.send('VKWebAppStorageSet', {
            key: VK_KEYS.SERVICES,
            value: JSON.stringify(payload.services),
          }),
          3000
        )
      );
    }

    if (payload.carClasses) {
      requests.push(
        withTimeout(
          bridge.send('VKWebAppStorageSet', {
            key: VK_KEYS.CLASSES,
            value: JSON.stringify(payload.carClasses),
          }),
          3000
        )
      );
    }

    await Promise.all(requests);
    return true;
  } catch (error) {
    console.log('ℹ️ Не удалось сохранить в VK Storage (тайм-аут или вне VK).');
    return false;
  }
};
