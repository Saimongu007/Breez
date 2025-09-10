export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Check for EDU domain requirement
  if (!email.toLowerCase().endsWith('@eastdelta.edu.bd')) {
    return { isValid: false, error: 'Please use your East Delta University email (@eastdelta.edu.bd)' };
  }
  
  return { isValid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  return { isValid: true };
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Password confirmation is required' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
}

export function validateStudentId(studentId: string): ValidationResult {
  if (!studentId) {
    return { isValid: false, error: 'Student ID is required' };
  }
  
  // Remove any spaces and convert to uppercase
  const cleanId = studentId.replace(/\s/g, '').toUpperCase();
  
  // Check if it matches the pattern (e.g., EDU123456 or similar)
  const studentIdRegex = /^[A-Z]{2,4}\d{4,8}$/;
  if (!studentIdRegex.test(cleanId)) {
    return { isValid: false, error: 'Please enter a valid Student ID (e.g., EDU123456)' };
  }
  
  return { isValid: true };
}

export function validateSemester(semester: string): ValidationResult {
  if (!semester) {
    return { isValid: false, error: 'Semester is required' };
  }
  
  const semesterNum = parseInt(semester);
  if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 12) {
    return { isValid: false, error: 'Please select a semester between 1 and 12' };
  }
  
  return { isValid: true };
}