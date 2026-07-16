import { useCallback, useRef, useState } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
  undoAction?: () => void;
  duration: number;
  position?: { x: number; y: number };
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    visible: false,
    duration: 2000,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, options?: { duration?: number; undoAction?: () => void; position?: { x: number; y: number } }) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const duration = options?.duration ?? 2000;
    setToast({ message, visible: true, undoAction: options?.undoAction, duration, position: options?.position });

    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
