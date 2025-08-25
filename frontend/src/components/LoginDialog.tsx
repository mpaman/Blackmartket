import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Phone, Facebook, Github, Image } from "lucide-react";
import { SignIn, Signup } from "@/services/api";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "@/lib/firebase";

interface AuthResponse {
  token: string;
  token_type: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_profile_image: string;
}

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileImageURL, setProfileImageURL] = useState("");

  // Simple validation for image URL
  const isValidImageURL = (url: string): boolean => {
    if (!url) {
      return true; // Empty is valid (will use default)
    }

    try {
      new URL(url);
      const lowerUrl = url.toLowerCase();
      return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') ||
        lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif') ||
        lowerUrl.endsWith('.webp') || lowerUrl.endsWith('.svg');
    } catch {
      return url.startsWith('/'); // Allow relative paths
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate profile image URL if provided
    if (isSignUp && profileImageURL && !isValidImageURL(profileImageURL)) {
      alert("Please enter a valid image URL (jpg, png, gif, webp, svg)");
      return;
    }

    try {
      if (isSignUp) {
        // Sign up logic
        const response = await Signup({
          name,
          email,
          password,
          phone,
          address,
          profile_image_url: profileImageURL,
          ID: 0
        });

        if (response?.data as AuthResponse) {
          // Store authentication data
          const authData = response.data as AuthResponse;
          localStorage.setItem("token", authData.token);
          localStorage.setItem("token_type", authData.token_type);
          localStorage.setItem("user_id", authData.user_id?.toString() || "");
          localStorage.setItem("user_name", authData.user_name || "");
          localStorage.setItem("user_email", authData.user_email || "");
          localStorage.setItem("user_profile_image", authData.user_profile_image || "");
          
          // Refresh the page to update login state
          window.location.reload();
        }
      } else {
        // Sign in logic
        const response = await SignIn({ email, password });

        if (response?.data as AuthResponse) {
          const authData = response.data as AuthResponse;
          // Store authentication data
          localStorage.setItem("token", authData.token);
          localStorage.setItem("token_type", authData.token_type);
          localStorage.setItem("user_id", authData.user_id?.toString() || "");
          localStorage.setItem("user_name", authData.user_name || "");
          localStorage.setItem("user_email", authData.user_email || "");
          localStorage.setItem("user_profile_image", authData.user_profile_image || "");

          alert("Login successful!");
          onOpenChange(false);
          
          // Refresh the page to update login state
          window.location.reload();
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      alert(error.response?.data?.error || "Authentication failed. Please try again.");
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === "Google") {
      try {
        const auth = getAuth(app);
        const googleProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const token = await user.getIdToken();

        console.log("Google login successful, sending to backend...");

        // Send token to backend for verification and JWT
        const response = await fetch("http://localhost:8000/api/auth/social-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "Google", token }),
        });
        
        const data = await response.json();
        console.log("Backend response:", data);
        
        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("token_type", data.token_type);
          localStorage.setItem("user_id", data.id?.toString() || "");
          localStorage.setItem("user_name", data.name || "");
          localStorage.setItem("user_email", data.email || "");
          localStorage.setItem("user_profile_image", data.profile_image_url || "");
          alert("Google login successful!");
          onOpenChange(false);
          window.location.reload();
        } else {
          console.error("Backend error:", data);
          alert(data.error || "Google login failed. Please try again.");
        }
      } catch (error: any) {
        console.error("Google login error:", error);
        alert("Google login failed. Please try again.");
      }
    } else {
      console.log(`Login with ${provider}`);
      // Handle other social login logic here
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-600">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {isSignUp
              ? "Join JuPiShop to start buying and selling"
              : "Sign in to your JuPiShop account"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {isSignUp && (
            <>
              <Label>Address</Label>
              <Input
                type="text"
                placeholder="Your Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </>
          )}

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="profileImageURL">Profile Image URL (Optional)</Label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="profileImageURL"
                  type="url"
                  placeholder="Enter profile image URL"
                  value={profileImageURL}
                  onChange={(e) => setProfileImageURL(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                Leave empty for default profile image. Supported formats: JPG, PNG, GIF, WebP, SVG
              </p>
            </div>
          )}

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("Google")}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("Facebook")}
            className="w-full"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </Button>
        </div>
        <div className="text-center text-sm">
          <span className="text-gray-600">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-green-600 hover:text-green-700 p-0 ml-1"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { LoginDialog };
