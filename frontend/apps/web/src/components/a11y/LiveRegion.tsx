import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';

interface LiveRegionContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useLiveRegion must be used within LiveRegionProvider');
  }
  return context;
}

interface LiveRegionProviderProps {
  children: ReactNode;
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  useEffect(() => {
    if (politeMessage) {
      const timer = setTimeout(() => setPoliteMessage(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [politeMessage]);

  useEffect(() => {
    if (assertiveMessage) {
      const timer = setTimeout(() => setAssertiveMessage(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [assertiveMessage]);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function LiveRegion({ message, priority = 'polite' }: LiveRegionProps) {
  return (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
