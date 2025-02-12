
import DriverSidebar from "@/components/driver/DriverSidebar";

const DriverEarnings = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <DriverSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600">Track your earnings and payment history</p>
      </main>
    </div>
  );
};

export default DriverEarnings;
