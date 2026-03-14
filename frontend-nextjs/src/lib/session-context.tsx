'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type SessionContextValue = {
  sessionLoading: boolean;
  setSessionLoading: (v: boolean) => void;
};

const SessionContext = createContext<SessionContextValue>({
  sessionLoading: true,
  setSessionLoading: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionLoading, setSessionLoading] = useState(true);
  return (
    <SessionContext.Provider value={{ sessionLoading, setSessionLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
