
import { Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentRegistrationFormData } from "@/types/auth";

interface AcademicInfoStepProps {
  formData: StudentRegistrationFormData;
  previewUrl: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<StudentRegistrationFormData>>;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AcademicInfoStep = ({
  formData,
  previewUrl,
  handleFileChange,
  setFormData,
  setPreviewUrl,
}: AcademicInfoStepProps) => {
  return (
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
  );
};
