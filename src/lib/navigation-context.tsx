'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type NavigationContextValue = {
  isNavigating: boolean;
  pendingPath: string;
  startNavigation: (path: string) => void;
};

const NavigationContext = createContext<NavigationContextValue>({
  isNavigating: false,
  pendingPath: '',
  startNavigation: () => {},
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingPath, setPendingPath] = useState('');
  const pathname = usePathname();

  // When the real pathname matches the pending path, navigation is complete
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = (path: string) => {
    setPendingPath(path);
    setIsNavigating(true);
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, pendingPath, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
