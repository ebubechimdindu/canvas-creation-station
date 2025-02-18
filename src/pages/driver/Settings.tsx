import { useForm } from "react-hook-form";
import { useDriverSettings, type DriverSettings, type BankAccount } from "@/hooks/use-driver-settings";
import DriverSidebar from "@/components/driver/DriverSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCircle, Trash2, Star } from "lucide-react";

type FormValues = {
  name: string;
  phone: string;
  driverLicenseNumber: string;
};

type BankAccountFormValues = {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
};

const DriverSettings = () => {
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    updateProfileImage,
    bankAccounts,
    addBankAccount,
    deleteBankAccount,
    setPrimaryAccount,
  } = useDriverSettings();
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: settings?.name ?? "",
      phone: settings?.phone ?? "",
      driverLicenseNumber: settings?.driverLicenseNumber ?? "",
    },
  });

  const bankForm = useForm<BankAccountFormValues>({
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    updateSettings.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateProfileImage.mutate(file);
    }
  };

  const onBankAccountSubmit = (data: BankAccountFormValues) => {
    addBankAccount.mutate(data, {
      onSuccess: () => {
        bankForm.reset();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  const canAddBankAccount = !bankAccounts || bankAccounts.length < 2;

  return (
    <div className="flex h-screen bg-gray-50">
      <DriverSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={settings?.profileImage?.url} />
                  <AvatarFallback>
                    <UserCircle className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driverLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver License Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-4">
                    <Label>Account Status</Label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
                        {settings?.status === 'verified' ? 'bg-green-100 text-green-800' : 
                         settings?.status === 'suspended' ? 'bg-red-100 text-red-800' : 
                         'bg-yellow-100 text-yellow-800'}">
                        {settings?.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              {bankAccounts && bankAccounts.length > 0 && (
                <div className="mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bank Name</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead>Account Holder</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>{account.bankName}</TableCell>
                          <TableCell>{account.accountNumber}</TableCell>
                          <TableCell>{account.accountHolderName}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPrimaryAccount.mutate(account.id)}
                                disabled={account.isPrimary}
                              >
                                <Star className={account.isPrimary ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBankAccount.mutate(account.id)}
                              >
                                <Trash2 className="text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {canAddBankAccount && (
                <Form {...bankForm}>
                  <form onSubmit={bankForm.handleSubmit(onBankAccountSubmit)} className="space-y-4">
                    <FormField
                      control={bankForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bankForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bankForm.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit"
                      disabled={addBankAccount.isPending}
                    >
                      {addBankAccount.isPending ? "Adding..." : "Add Bank Account"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DriverSettings;
