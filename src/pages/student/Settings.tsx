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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Bell, 
  Moon,
  Languages, 
  MapPin,
  Camera,
  Trash2,
  Loader2
} from "lucide-react";
import { useStudentSettings } from "@/hooks/use-student-settings";
import { useToast } from "@/hooks/use-toast";

export default function StudentSettings() {
  const { toast } = useToast();
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    updateProfileImage 
  } = useStudentSettings();

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
    updateSettings.mutate({
      ...settings,
      profileImage: undefined,
    });
  };

  const handleSaveSettings = () => {
    updateSettings.mutate(settings);
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
                        value={settings?.name || ''}
                        onChange={(e) => updateSettings.mutate({
                          ...settings,
                          name: e.target.value,
                        })}
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
                        value={settings?.phone || ''}
                        onChange={(e) => updateSettings.mutate({
                          ...settings,
                          phone: e.target.value,
                        })}
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
                      value={settings?.defaultLocations?.home || ""}
                      onChange={(e) =>
                        updateSettings.mutate({
                          ...settings,
                          defaultLocations: {
                            ...settings?.defaultLocations,
                            home: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolLocation">School Location</Label>
                    <Input
                      id="schoolLocation"
                      placeholder="Enter your school address"
                      value={settings?.defaultLocations?.school || ""}
                      onChange={(e) =>
                        updateSettings.mutate({
                          ...settings,
                          defaultLocations: {
                            ...settings?.defaultLocations,
                            school: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive ride updates via email
                        </p>
                      </div>
                      <Switch
                        checked={settings?.notifications?.email}
                        onCheckedChange={(checked) =>
                          updateSettings.mutate({
                            ...settings,
                            notifications: { ...settings?.notifications, email: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <Switch
                        checked={settings?.notifications?.push}
                        onCheckedChange={(checked) =>
                          updateSettings.mutate({
                            ...settings,
                            notifications: { ...settings?.notifications, push: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive ride updates via SMS
                        </p>
                      </div>
                      <Switch
                        checked={settings?.notifications?.sms}
                        onCheckedChange={(checked) =>
                          updateSettings.mutate({
                            ...settings,
                            notifications: { ...settings?.notifications, sms: checked },
                          })
                        }
                      />
                    </div>
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
                        value={settings?.theme}
                        onValueChange={(value: 'light' | 'dark' | 'system') =>
                          updateSettings.mutate({ ...settings, theme: value })
                        }
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
                    <Languages className="h-5 w-5" />
                    Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Select
                      value={settings?.language}
                      onValueChange={(value: 'en' | 'ig' | 'yo' | 'ha') =>
                        updateSettings.mutate({ ...settings, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ig">Igbo</SelectItem>
                        <SelectItem value="yo">Yoruba</SelectItem>
                        <SelectItem value="ha">Hausa</SelectItem>
                      </SelectContent>
                    </Select>
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
