
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Languages, 
  MapPin,
  Lock,
  Trash2
} from "lucide-react";
import { StudentSettings as StudentSettingsType } from "@/types";

export default function StudentSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StudentSettingsType>({
    id: "1",
    preferredPaymentType: "cash",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    defaultLocations: {},
    theme: "system",
    language: "en",
  });

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been successfully updated.",
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <StudentSidebar />
        <main className="flex-1 p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Settings</h1>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Your email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="Your phone number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input id="studentId" placeholder="Your student ID" />
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
                      value={settings.defaultLocations.home || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultLocations: {
                            ...settings.defaultLocations,
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
                      value={settings.defaultLocations.school || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultLocations: {
                            ...settings.defaultLocations,
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
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, email: checked },
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
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, push: checked },
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
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, sms: checked },
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
                        value={settings.theme}
                        onValueChange={(value: 'light' | 'dark' | 'system') =>
                          setSettings({ ...settings, theme: value })
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
                      value={settings.language}
                      onValueChange={(value: 'en' | 'ig' | 'yo' | 'ha') =>
                        setSettings({ ...settings, language: value })
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
