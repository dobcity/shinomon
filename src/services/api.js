import bridge from '@vkontakte/vk-bridge';

const VK_KEYS = {
  SERVICES: 'shinomontaj_services_v1',
  CLASSES: 'shinomontaj_classes_v1',
};

// Загрузка данных из облака VK
export const fetchCloudServices = async () => {
  try {
    const data = await bridge.send('VKWebAppStorageGet', {
      keys: [VK_KEYS.SERVICES, VK_KEYS.CLASSES],
    });

    let services = null;
    let carClasses = null;

    data.keys.forEach((item) => {
      if (item.key === VK_KEYS.SERVICES && item.value) {
        try {
          services = JSON.parse(item.value);
        } catch (e) {
          console.error('Ошибка парсинга услуг из VK Storage', e);
        }
      }
      if (item.key === VK_KEYS.CLASSES && item.value) {
        try {
          carClasses = JSON.parse(item.value);
        } catch (e) {
          console.error('Ошибка парсинга классов из VK Storage', e);
        }
      }
    });

    return { services, carClasses };
  } catch (error) {
    console.error('[VK Storage GET Error]', error);
    return null;
  }
};

// Сохранение данных в облако VK
export const updateCloudServices = async (payload) => {
  try {
    const requests = [];

    if (payload.services) {
      requests.push(
        bridge.send('VKWebAppStorageSet', {
          key: VK_KEYS.SERVICES,
          value: JSON.stringify(payload.services),
        })
      );
    }

    if (payload.carClasses) {
      requests.push(
        bridge.send('VKWebAppStorageSet', {
          key: VK_KEYS.CLASSES,
          value: JSON.stringify(payload.carClasses),
        })
      );
    }

    await Promise.all(requests);
    return true;
  } catch (error) {
    console.error('[VK Storage SET Error]', error);
    return false;
  }
};
