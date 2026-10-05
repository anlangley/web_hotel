/**
 * Storage utility using Web localStorage
 * Drop-in replacement for mobile expo-secure-store
 */

export async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return null;
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting ${key} from localStorage:`, error);
  }
}
