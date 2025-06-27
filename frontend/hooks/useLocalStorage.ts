'use client';

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.log('Error reading from localStorage', error);
      }
    }
  }, [isMounted, key]);

  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.log('Error writing to localStorage', error);
      }
    }
  }, [key, storedValue, isMounted]);

  return [storedValue, setStoredValue] as const;
}

export default useLocalStorage;
