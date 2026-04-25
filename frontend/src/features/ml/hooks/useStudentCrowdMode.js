import { useEffect, useMemo, useState } from 'react';
import { isCrowdDemoEnabled } from '../demo/crowdDemo';

const CROWD_MODE_STORAGE_KEYS = {
  student: 'student_crowd_mode',
  manager: 'manager_crowd_mode',
};

const getDefaultMode = () => (isCrowdDemoEnabled() ? 'demo' : 'live');

const getStorageKey = (scope) => CROWD_MODE_STORAGE_KEYS[scope] || CROWD_MODE_STORAGE_KEYS.student;

const getStoredMode = (scope) => {
  if (typeof window === 'undefined') {
    return getDefaultMode();
  }

  const storedMode = window.localStorage.getItem(getStorageKey(scope));
  if (storedMode === 'demo' || storedMode === 'live') {
    return storedMode;
  }

  return getDefaultMode();
};

export function useCrowdModePreference(scope = 'student') {
  const storageKey = getStorageKey(scope);
  const [mode, setMode] = useState(() => getStoredMode(scope));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.localStorage.setItem(storageKey, mode);
    return undefined;
  }, [mode, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== storageKey) {
        return;
      }

      if (event.newValue === 'demo' || event.newValue === 'live') {
        setMode(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  return useMemo(
    () => ({
      mode,
      demoModeEnabled: mode === 'demo',
      setMode,
    }),
    [mode]
  );
}

export function useStudentCrowdMode() {
  return useCrowdModePreference('student');
}

export function useManagerCrowdMode() {
  return useCrowdModePreference('manager');
}

export default useStudentCrowdMode;
