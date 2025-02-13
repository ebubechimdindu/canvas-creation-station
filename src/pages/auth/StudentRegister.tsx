
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, User, Mail, Phone, GraduationCap, Building2, Camera, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudentAuth } from "@/hooks/useStudentAuth";

const StudentRegister = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    department: "",
    level: "",
    profilePicture: null as File | null,
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

        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-1/3 h-2 rounded-full mx-1 transition-colors duration-300 ${
                step >= num ? "bg-purple-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="mt-1 transition-transform duration-300 focus:translate-y-[-2px]"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <Input
                  id="studentId"
                  name="studentId"
                  type="text"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="mt-1 transition-transform duration-300 focus:translate-y-[-2px]"
                  placeholder="Enter your student ID"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 transition-transform duration-300 focus:translate-y-[-2px]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 transition-transform duration-300 focus:translate-y-[-2px]"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department/Faculty
                </label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="business">Business Administration</SelectItem>
                    <SelectItem value="medicine">Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                  Current Level
                </label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Picture (Optional)
                </label>
                <div className="mt-1 flex flex-col items-center justify-center">
                  {previewUrl ? (
                    <div className="relative w-32 h-32 mb-4">
                      <img
                        src={previewUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, profilePicture: null }));
                          setPreviewUrl(null);
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="profile-upload"
                      className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-gray-500 mb-2" />
                      <span className="text-sm text-gray-500">Upload Photo</span>
                    </label>
                  )}
                  <input
                    id="profile-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pr-10 transition-transform duration-300 focus:translate-y-[-2px]"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pr-10 transition-transform duration-300 focus:translate-y-[-2px]"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{" "}
                  <a href="#" className="text-purple-600 hover:text-purple-500">
                    Terms and Conditions
                  </a>
                </label>
              </div>
            </div>
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
