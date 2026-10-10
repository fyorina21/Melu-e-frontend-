import { useState, useCallback } from 'react';

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;
export type ValidatorFn<T> = (values: T) => ValidationErrors<T> | Promise<ValidationErrors<T>>;

export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validate?: ValidatorFn<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T> | ((prev: T) => T)) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void;
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
  validateAll: () => Promise<boolean>;
  handleSubmit: () => Promise<void>;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const setValue = useCallback(
    <K extends keyof T>(field: K, val: T[K]) => {
      setValuesState((prev) => {
        const updated = { ...prev, [field]: val };
        if (validate) {
          const res = validate(updated);
          if (!(res instanceof Promise)) {
            setErrors(res);
          }
        }
        return updated;
      });
    },
    [validate],
  );

  const setValues = useCallback(
    (updater: Partial<T> | ((prev: T) => T)) => {
      setValuesState((prev) => {
        const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        if (validate) {
          const res = validate(updated);
          if (!(res instanceof Promise)) {
            setErrors(res);
          }
        }
        return updated;
      });
    },
    [validate],
  );

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string | undefined) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const handleChange = useCallback(
    <K extends keyof T>(field: K) => {
      return (val: T[K]) => {
        setValue(field, val);
      };
    },
    [setValue],
  );

  const handleBlur = useCallback(
    <K extends keyof T>(field: K) => {
      return () => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        if (validate) {
          const res = validate(values);
          if (!(res instanceof Promise)) {
            setErrors(res);
          }
        }
      };
    },
    [validate, values],
  );

  const validateAll = useCallback(async (): Promise<boolean> => {
    if (!validate) return true;
    const validationErrors = await validate(values);
    setErrors(validationErrors);
    const hasErrors = Object.values(validationErrors).some(Boolean);
    return !hasErrors;
  }, [validate, values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce<Partial<Record<keyof T, boolean>>>(
        (acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        },
        {},
      );
      setTouched(allTouched);

      const isValidForm = await validateAll();
      if (isValidForm) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, onSubmit]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.values(errors).every((err) => !err);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    setFieldError,
    handleChange,
    handleBlur,
    validateAll,
    handleSubmit,
    reset,
  };
}

export default useFormValidation;
