import { useState, useCallback } from 'react';

/**
 * Generic hook for managing form data state
 */
export const useFormData = <T extends Record<string, any>>(initialData: T) => {
  const [formData, setFormData] = useState<T>(initialData);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateNestedField = useCallback(<K extends keyof T, NK extends keyof T[K]>(
    field: K,
    nestedField: NK,
    value: T[K][NK]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [nestedField]: value }
    }));
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  const setData = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  return {
    formData,
    updateField,
    updateNestedField,
    reset,
    setData,
    setFormData,
  };
};
