
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DriverSidebar from "@/components/driver/DriverSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Loader2
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setEarningsLoading,
  setEarningsSuccess,
  setEarningsError,
} from "@/features/rides/ridesSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Simulated API call - replace with actual API integration
const fetchEarningsData = async (timeframe: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate different data based on timeframe
  return {
    daily: 160000,
    weekly: 925000,
    monthly: 3240000,
    transactions: [
      {
        id: 1,
        date: "2024-02-07",
        type: "Ride Payment",
        amount: 45000,
        status: "completed",
      },
      {
        id: 2,
        date: "2024-02-07",
        type: "Bonus",
        amount: 15000,
        status: "completed",
      },
      {
        id: 3,
        date: "2024-02-06",
        type: "Ride Payment",
        amount: 35000,
        status: "completed",
      },
    ],
  };
};

const DriverEarnings = () => {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { status, error, data } = useAppSelector((state) => state.rides.earnings);

  const fetchEarnings = async () => {
    try {
      dispatch(setEarningsLoading());
      const data = await fetchEarningsData(timeframe);
      dispatch(setEarningsSuccess(data));
    } catch (error) {
      dispatch(setEarningsError(error instanceof Error ? error.message : "Failed to fetch earnings"));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load earnings data. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [timeframe]);

  const handleExport = async () => {
    toast({
      title: "Exporting earnings report",
      description: "Your report will be downloaded shortly.",
    });
    
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Export complete",
        description: "Your earnings report has been downloaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export earnings report. Please try again.",
      });
    }
  };

  const StatCard = ({ title, value, icon, trend }: { 
    title: string; 
    value: string; 
    icon: React.ReactNode;
    trend: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {status === 'loading' ? (
          <>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">₦{value}</div>
            <p className="text-xs text-muted-foreground">
              {trend}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <DriverSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
              <p className="text-gray-600">Track your earnings and payment history</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeframe} onValueChange={(value: "daily" | "weekly" | "monthly") => setTimeframe(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily View</SelectItem>
                  <SelectItem value="weekly">Weekly View</SelectItem>
                  <SelectItem value="monthly">Monthly View</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleExport} 
                className="gap-2"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export Report
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Today's Earnings"
              value={data.daily.toLocaleString()}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              trend="+20% from yesterday"
            />
            <StatCard
              title="Week to Date"
              value={data.weekly.toLocaleString()}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              trend="+5% from last week"
            />
            <StatCard
              title="Month to Date"
              value={data.monthly.toLocaleString()}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              trend="+12% from last month"
            />
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest earnings and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'loading' ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : status === 'failed' ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error || 'Failed to load transactions'}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={fetchEarnings}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {transaction.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DriverEarnings;

