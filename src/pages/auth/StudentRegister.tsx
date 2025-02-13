
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { PersonalInfoStep } from "@/components/auth/student/PersonalInfoStep";
import { AcademicInfoStep } from "@/components/auth/student/AcademicInfoStep";
import { SecurityStep } from "@/components/auth/student/SecurityStep";
import { ProgressSteps } from "@/components/auth/ProgressSteps";
import { StudentRegistrationFormData } from "@/types/auth";

const StudentRegister = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StudentRegistrationFormData>({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    department: "",
    level: "",
    profilePicture: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { registerStudent, isLoading } = useStudentAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "The passwords you entered don't match.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await registerStudent({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      studentId: formData.studentId,
      phone: formData.phone,
      department: formData.department,
      level: formData.level,
      profilePicture: formData.profilePicture,
    });
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.studentId || !formData.email || !formData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    } else if (step === 2) {
      if (!formData.department || !formData.level) {
        toast({
          title: "Missing Information",
          description: "Please select your department and level.",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <Link 
          to="/auth/student/login"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transform transition-transform hover:scale-105 duration-300">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Student Registration</h2>
          <p className="mt-2 text-gray-600">Create your Campus Rides account</p>
        </div>

        <ProgressSteps currentStep={step} totalSteps={3} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <PersonalInfoStep 
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          {step === 2 && (
            <AcademicInfoStep 
              formData={formData}
              previewUrl={previewUrl}
              handleFileChange={handleFileChange}
              setFormData={setFormData}
              setPreviewUrl={setPreviewUrl}
            />
          )}

          {step === 3 && (
            <SecurityStep 
              formData={formData}
              handleInputChange={handleInputChange}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              setShowPassword={setShowPassword}
              setShowConfirmPassword={setShowConfirmPassword}
            />
          )}

          <div className="flex justify-between gap-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="w-full hover:scale-105 transition-transform duration-300"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="w-full hover:scale-105 transition-transform duration-300"
                disabled={isLoading}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full hover:scale-105 transition-transform duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Complete Registration"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
