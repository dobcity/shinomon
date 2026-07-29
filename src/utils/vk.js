export const getIsAdmin = () => {
  if (typeof window === 'undefined') return true;

  try {
    const fullUrl = window.location.href;
    const urlObj = new URL(fullUrl);

    // 1. Проверка на принудительный параметр в URL (например, app.vercel.app/?admin=1)
    if (urlObj.searchParams.get('admin') === '1' || urlObj.searchParams.get('admin') === 'true') {
      return true;
    }

    // 2. Извлечение роли из URL search или hash
    let role = urlObj.searchParams.get('vk_viewer_group_role');

    if (!role && window.location.hash) {
      const hashString = window.location.hash.includes('?') 
        ? window.location.hash.split('?')[1] 
        : window.location.hash.replace('#', '');
      const hashParams = new URLSearchParams(hashString);
      role = hashParams.get('vk_viewer_group_role');
    }

    // Если параметров ВК нет вообще (прямой запуск вне ВК), даем полный доступ
    if (!role) return true;

    // Роли в ВК: "admin", "editor", "moderator", "member", "none"
    // Владелец сообщества в ВК всегда передается со значением "admin"
    const allowedRoles = ['admin', 'editor', 'moderator', 'owner'];
    return allowedRoles.includes(role.toLowerCase());
  } catch (e) {
    console.error('Ошибка проверки роли VK:', e);
    return true; // В случае ошибки не блокируем доступ
  }
};
