
import { useState, useEffect } from "react";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  MapPin,
  Camera,
  Trash2,
  Loader2,
  LogOut,
  Moon
} from "lucide-react";
import { useStudentSettings } from "@/hooks/use-student-settings";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function StudentSettings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    updateProfileImage 
  } = useStudentSettings();

  // Local state for form fields
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    defaultLocations: {
      home: '',
      school: ''
    },
    theme: 'system' as 'light' | 'dark' | 'system'
  });

  // Initialize form values when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormValues({
        name: settings.name || '',
        phone: settings.phone || '',
        defaultLocations: {
          home: settings.defaultLocations?.home || '',
          school: settings.defaultLocations?.school || ''
        },
        theme: settings.theme || 'system'
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: 'home' | 'school', value: string) => {
    setFormValues(prev => ({
      ...prev,
      defaultLocations: {
        ...prev.defaultLocations,
        [field]: value
      }
    }));
  };

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setFormValues(prev => ({
      ...prev,
      theme: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    await updateProfileImage.mutateAsync(file);
  };

  const handleRemoveImage = () => {
    if (settings) {
      updateSettings.mutate({
        ...settings,
        profileImage: undefined,
      });
    }
  };

  const handleSaveSettings = () => {
    if (settings) {
      updateSettings.mutate({
        ...settings,
        name: formValues.name,
        phone: formValues.phone,
        defaultLocations: formValues.defaultLocations,
        theme: formValues.theme,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/auth/student/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <StudentSidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <StudentSidebar />
        <main className="flex-1 p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Settings</h1>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={settings?.profileImage?.url} />
                      <AvatarFallback className="text-4xl">
                        {settings?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => document.getElementById("image-upload")?.click()}
                        disabled={updateProfileImage.isPending}
                      >
                        {updateProfileImage.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        Change Photo
                      </Button>
                      {settings?.profileImage && (
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={handleRemoveImage}
                          disabled={updateSettings.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: JPEG, PNG. Max size: 5MB
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={formValues.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={settings?.email || ''}
                        disabled
                        placeholder="Your email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={formValues.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Your phone number" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input 
                        id="studentId" 
                        value={settings?.studentId || ''}
                        disabled
                        placeholder="Your student ID" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Default Locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeLocation">Home Location</Label>
                    <Input
                      id="homeLocation"
                      placeholder="Enter your home address"
                      value={formValues.defaultLocations.home}
                      onChange={(e) => handleLocationChange('home', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolLocation">School Location</Label>
                    <Input
                      id="schoolLocation"
                      placeholder="Enter your school address"
                      value={formValues.defaultLocations.school}
                      onChange={(e) => handleLocationChange('school', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Label>Theme</Label>
                      <Select
                        value={formValues.theme}
                        onValueChange={(value: 'light' | 'dark' | 'system') => handleThemeChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={handleLogout}
                    >
                      Log Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
