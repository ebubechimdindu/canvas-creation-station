
import { useStudentLogin } from './auth/useStudentLogin';
import { useStudentRegistration } from './auth/useStudentRegistration';
import { useVerificationEmail } from './auth/useVerificationEmail';

export const useStudentAuth = () => {
  const { loginStudent, isLoading: isLoginLoading } = useStudentLogin();
  const { registerStudent, isLoading: isRegistrationLoading } = useStudentRegistration();
  const { resendVerificationEmail } = useVerificationEmail();

  return {
    registerStudent,
    loginStudent,
    isLoading: isLoginLoading || isRegistrationLoading,
    resendVerificationEmail,
  };
};
