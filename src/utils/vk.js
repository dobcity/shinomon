export const getIsAdmin = () => {
  if (typeof window === 'undefined') return false;

  try {
    const fullUrl = window.location.href;
    const urlObj = new URL(fullUrl);

    // 1. Ищем роль пользователя в параметрах URL (search или hash)
    let role = urlObj.searchParams.get('vk_viewer_group_role');

    if (!role && window.location.hash) {
      const hashString = window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.hash.replace('#', '');
      const hashParams = new URLSearchParams(hashString);
      role = hashParams.get('vk_viewer_group_role');
    }

    // 2. Если роли нет: на localhost разрешаем доступ для разработки, в сети — БЛОКИРУЕМ (false)
    if (!role) {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      return isLocalhost;
    }

    // 3. Точная проверка ролей ВКонтакте
    const allowedRoles = ['admin', 'editor', 'owner'];
    return allowedRoles.includes(role.toLowerCase());
  } catch (e) {
    console.error('Ошибка проверки роли VK:', e);
    return false; // При любых ошибках считаем пользователя клиентом
  }
};
