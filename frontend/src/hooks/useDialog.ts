import { useState, useCallback } from 'react';

export interface UseDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hook for managing dialog open/close state
 */
export const useDialog = (initialOpen = false): UseDialogReturn => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const onOpenChange = useCallback((open: boolean) => setIsOpen(open), []);

  return { isOpen, open, close, toggle, onOpenChange };
};

/**
 * Hook for managing form loading state
 */
export const useFormLoading = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return { isLoading, startLoading, stopLoading };
};
