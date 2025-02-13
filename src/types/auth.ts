
export interface StudentRegistrationFormData {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  department: string;
  level: string;
  profilePicture: File | null;
}
