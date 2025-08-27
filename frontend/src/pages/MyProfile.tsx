import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentUser, updateUserProfile, changePassword, GetUserAddresses } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    profile_image_url: z.string().optional(),
});

const passwordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "New password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function MyProfile() {
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { toast } = useToast();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            profile_image_url: "",
        },
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            current_password: "",
            new_password: "",
            confirm_password: "",
        },
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const response = await getCurrentUser();
            const userData = response.data;

            // Also get address data if available
            const addressData = userData && typeof userData === 'object' && 'address' in userData && userData.address && Array.isArray(userData.address) && userData.address.length > 0 ? userData.address[0] : {};

            const formData = {
                name: userData && typeof userData === 'object' && 'name' in userData ? String(userData.name || "") : "",
                email: userData && typeof userData === 'object' && 'email' in userData ? String(userData.email || "") : "",
                phone: String(addressData.phone || ""),
                address: String(addressData.address || ""),
                profile_image_url: userData && typeof userData === 'object' && 'profile_image_url' in userData ? String(userData.profile_image_url || "") : "",
            };

            setUserData(userData);
            form.reset(formData);
        } catch (error) {
            console.error("Error loading user data:", error);
            // Fallback to localStorage if API fails
            const userName = localStorage.getItem("user_name") || "";
            const userEmail = localStorage.getItem("user_email") || "";
            const userProfileImage = localStorage.getItem("user_profile_image") || "";

            const fallbackData = {
                name: userName,
                email: userEmail,
                phone: "",
                address: "",
                profile_image_url: userProfileImage,
            };

            setUserData(fallbackData);
            form.reset(fallbackData);

            toast({
                title: "Warning",
                description: "Could not load profile from server, using cached data",
                variant: "destructive",
            });
        }
    };

    const onSubmit = async (data: ProfileFormData) => {
        setIsLoading(true);
        try {
            // Ensure required fields are present
            const profileData = {
                name: data.name || "",
                email: data.email || "",
                profile_image_url: data.profile_image_url,
                phone: data.phone,
                address: data.address,
            };

            const response = await updateUserProfile(profileData);
            
            // Update localStorage with new data
            localStorage.setItem("user_name", profileData.name);
            localStorage.setItem("user_email", profileData.email);
            if (profileData.profile_image_url) {
                localStorage.setItem("user_profile_image", profileData.profile_image_url);
            }

            toast({
                title: "Success",
                description: "Profile updated successfully",
            });

            // Reload user data to get updated info
            await loadUserData();
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsPasswordLoading(true);
        try {
            await changePassword({
                current_password: data.current_password,
                new_password: data.new_password,
            });

            toast({
                title: "Success",
                description: "Password changed successfully",
            });

            // Reset password form
            passwordForm.reset();
        } catch (error: any) {
            console.error("Error changing password:", error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to change password",
                variant: "destructive",
            });
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "Image size must be less than 5MB",
                    variant: "destructive",
                });
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Error",
                    description: "Please select a valid image file",
                    variant: "destructive",
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                form.setValue("profile_image_url", imageUrl);
                toast({
                    title: "Success",
                    description: "Image uploaded successfully",
                });
            };
            reader.onerror = () => {
                toast({
                    title: "Error",
                    description: "Failed to read image file",
                    variant: "destructive",
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="max-w-2xl mx-auto">
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile">Profile Information</TabsTrigger>
                            <TabsTrigger value="password">Change Password</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="profile">
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Profile</CardTitle>
                                    <CardDescription>
                                        Update your personal information and profile settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex justify-center">
                                        <div className="relative">
                                            <Avatar className="h-24 w-24">
                                                <AvatarImage src={form.watch("profile_image_url")} />
                                                <AvatarFallback className="text-lg">
                                                    {userData?.name ? userData.name.slice(0, 2).toUpperCase() : "UN"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <label
                                                htmlFor="image-upload"
                                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90"
                                            >
                                                <Camera className="h-4 w-4" />
                                                <input
                                                    id="image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                    aria-label="Upload profile image"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter your full name" {...field} />
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
                                                            <Input placeholder="Enter your phone number" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter your address"
                                                                className="min-h-[100px]"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="profile_image_url"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Profile Image URL (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="url"
                                                                placeholder="Enter image URL or upload a file above"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                        <p className="text-xs text-gray-500">
                                                            You can upload a file using the camera icon or enter a direct image URL
                                                        </p>
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" disabled={isLoading} className="w-full">
                                                <Save className="mr-2 h-4 w-4" />
                                                {isLoading ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="password">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>
                                        Update your password to keep your account secure
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...passwordForm}>
                                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                            <FormField
                                                control={passwordForm.control}
                                                name="current_password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Current Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showCurrentPassword ? "text" : "password"}
                                                                    placeholder="Enter your current password"
                                                                    {...field}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                >
                                                                    {showCurrentPassword ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={passwordForm.control}
                                                name="new_password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>New Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showNewPassword ? "text" : "password"}
                                                                    placeholder="Enter your new password"
                                                                    {...field}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                                >
                                                                    {showNewPassword ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={passwordForm.control}
                                                name="confirm_password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirm New Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    placeholder="Confirm your new password"
                                                                    {...field}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                >
                                                                    {showConfirmPassword ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" disabled={isPasswordLoading} className="w-full">
                                                <Lock className="mr-2 h-4 w-4" />
                                                {isPasswordLoading ? "Changing..." : "Change Password"}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}