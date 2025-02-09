
import { Button } from "@/components/ui/button";
import { MapPin, User, Car } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Campus Rides Made Easy
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with Keke drivers on Babcock University campus instantly.
            Safe, reliable, and efficient rides at your fingertips.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg"
              className="gap-2"
            >
              <User className="w-4 h-4" />
              Student Login
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Car className="w-4 h-4" />
              Driver Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <MapPin className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-600">
              Track your ride in real-time and get accurate arrival times.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 flex items-center justify-center text-purple-500 mb-4">
              ₦
            </div>
            <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
            <p className="text-gray-600">
              Know your fare upfront. No surprises or hidden charges.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <User className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verified Drivers</h3>
            <p className="text-gray-600">
              All drivers are verified and approved by the university.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
