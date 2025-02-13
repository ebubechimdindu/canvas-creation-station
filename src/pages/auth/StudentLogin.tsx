
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudentAuth } from "@/hooks/useStudentAuth";

const StudentLogin = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { loginStudent, isLoading } = useStudentAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginStudent(studentId, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <Link 
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transform transition-transform hover:scale-105 duration-300">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Student Login</h2>
          <p className="mt-2 text-gray-600">Welcome back to Campus Rides</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <Input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 transition-transform duration-300 focus:translate-y-[-2px]"
                placeholder="Enter your student ID"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 transition-transform duration-300 focus:translate-y-[-2px]"
                  placeholder="Enter your password"
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 cursor-pointer"
              >
                Remember me
              </label>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full gap-2 hover:scale-105 transition-transform duration-300"
            disabled={isLoading}
          >
            <User className="w-5 h-5" />
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/auth/student/register" className="text-purple-600 hover:text-purple-500 font-medium transition-colors">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
