export const getIsAdmin = () => {
  if (typeof window === 'undefined') return true;

  // Безопасный поиск vk_viewer_group_role в query и hash параметрах
  const searchParams = new URLSearchParams(window.location.search);
  let role = searchParams.get('vk_viewer_group_role');

  if (!role && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    role = hashParams.get('vk_viewer_group_role');
  }

  if (!role) return true; // Режим локальной разработки

  return ['admin', 'editor', 'owner'].includes(role);
};
