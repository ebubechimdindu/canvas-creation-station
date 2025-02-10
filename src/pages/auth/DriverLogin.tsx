
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Car, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

const DriverLogin = () => {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will implement actual auth logic in Phase 2
    toast({
      title: "Login Attempted",
      description: "Authentication will be implemented in Phase 2",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Back Button */}
        <Link 
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Driver Login</h2>
          <p className="mt-2 text-gray-600">Welcome back to Campus Rides</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="driverId" className="block text-sm font-medium text-gray-700">
                Driver ID
              </label>
              <Input
                id="driverId"
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="mt-1"
                placeholder="Enter your driver ID"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Remember Me Checkbox */}
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
          >
            <Car className="w-5 h-5" />
            Login
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/auth/driver/register" className="text-purple-600 hover:text-purple-500 font-medium">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default DriverLogin;
