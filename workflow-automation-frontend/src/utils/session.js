export const AUTH_STORAGE_KEY = 'auth-storage';

export const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
