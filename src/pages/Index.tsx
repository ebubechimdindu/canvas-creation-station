
import { Button } from "@/components/ui/button";
import { MapPin, User, Car, Shield, Clock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    // Main container with gradient background
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Hero Section Container */}
      <div className="container mx-auto px-4 py-16">
        {/* Hero Content - Centered text block with animation */}
        <div className="text-center space-y-8 animate-fade-in">
          {/* Main Heading with Gradient Text Effect */}
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl tracking-tight">
            Campus Rides Made
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Easy</span>
          </h1>

          {/* Subheading with value proposition */}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect with Keke drivers on Babcock University campus instantly.
            Safe, reliable, and efficient rides at your fingertips.
          </p>
          
          {/* Call-to-Action Buttons Section */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in" 
            style={{ animationDelay: "200ms" }}
          >
            {/* Student Login Button */}
            <Link to="/auth/student/login">
              <Button 
                size="lg"
                className="gap-2 hover:scale-105 transition-transform duration-300 text-lg px-8 w-full sm:w-auto"
              >
                <User className="w-5 h-5" />
                Student Login
              </Button>
            </Link>

            {/* Driver Login Button */}
            <Link to="/auth/driver/login">
              <Button 
                variant="outline"
                size="lg"
                className="gap-2 hover:scale-105 transition-transform duration-300 text-lg px-8 border-2 w-full sm:w-auto"
              >
                <Car className="w-5 h-5" />
                Driver Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid Section */}
        <div 
          className="grid md:grid-cols-3 gap-8 mt-24 animate-fade-in" 
          style={{ animationDelay: "400ms" }}
        >
          {/* Real-Time Tracking Feature Card */}
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="bg-purple-50 rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Real-Time Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Track your ride in real-time with precise location updates and accurate arrival times.
            </p>
          </div>

          {/* Transparent Pricing Feature Card */}
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="bg-purple-50 rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Transparent Pricing</h3>
            <p className="text-gray-600 leading-relaxed">
              Know your fare upfront with our clear pricing system. No hidden charges or surprises.
            </p>
          </div>

          {/* Verified Drivers Feature Card */}
          <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="bg-purple-50 rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Verified Drivers</h3>
            <p className="text-gray-600 leading-relaxed">
              All drivers are thoroughly verified and approved by the university for your safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
