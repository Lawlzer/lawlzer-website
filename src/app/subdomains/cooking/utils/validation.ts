// Common validation rules
export const validators = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  min: (min: number) => (value: number) => {
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  max: (max: number) => (value: number) => {
    if (value > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },

  pattern: (pattern: RegExp, message: string) => (value: string) => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  },

  email: (value: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailPattern.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  url: (value: string) => {
    try {
      if (value) {
        new URL(value);
      }
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  numeric: (value: string) => {
    if (value && isNaN(Number(value))) {
      return 'Must be a number';
    }
    return null;
  },

  integer: (value: string) => {
    if (value && !Number.isInteger(Number(value))) {
      return 'Must be a whole number';
    }
    return null;
  },

  positive: (value: number) => {
    if (value <= 0) {
      return 'Must be a positive number';
    }
    return null;
  },
};

// Combine multiple validators
export const combineValidators = (
  ...validators: Array<(value: any) => string | null>
) => {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
};

// Validate entire form
export const validateForm = <T extends Record<string, any>>(
  values: T,
  rules: Partial<Record<keyof T, (value: any) => string | null>>
): Partial<Record<keyof T, string>> => {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [field, validator] of Object.entries(rules) as Array<
    [keyof T, (value: any) => string | null]
  >) {
    if (validator) {
      const error = validator(values[field]);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return errors;
};

// Recipe-specific validators
export const recipeValidators = {
  recipeName: combineValidators(
    validators.required,
    validators.minLength(3),
    validators.maxLength(100)
  ),

  servings: combineValidators(
    validators.required,
    validators.numeric,
    validators.positive,
    validators.max(100)
  ),

  ingredient: combineValidators(
    validators.required,
    validators.minLength(2),
    validators.maxLength(100)
  ),

  quantity: combineValidators(
    validators.required,
    validators.numeric,
    validators.positive
  ),

  calories: combineValidators(
    validators.numeric,
    validators.min(0),
    validators.max(10000)
  ),
};
