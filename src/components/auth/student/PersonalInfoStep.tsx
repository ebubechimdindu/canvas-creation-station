
import { Input } from "@/components/ui/input";
import { StudentRegistrationFormData } from "@/types/auth";

interface PersonalInfoStepProps {
  formData: StudentRegistrationFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoStep = ({ formData, handleInputChange }: PersonalInfoStepProps) => {
  return (
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
  );
};
