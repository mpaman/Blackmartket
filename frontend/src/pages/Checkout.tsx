
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/types/CartItem";
import { getCheckoutSession, processCheckout } from "@/services/api";
import { isTokenExpired, getTokenExpirationTime } from "@/utils/tokenUtils";

interface CheckoutData {
  cart_items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
  };
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoggedIn, refreshCartCount } = useCart();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    profileImage: ""
  });
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });

  // Load user profile data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const userName = localStorage.getItem("user_name") || "";
      const userEmail = localStorage.getItem("user_email") || "";
      const userProfileImage = localStorage.getItem("user_profile_image") || "";
      
      setUserProfile({
        name: userName,
        email: userEmail,
        profileImage: userProfileImage
      });

      // Set email from user profile
      setFormData(prev => ({
        ...prev,
        email: userEmail
      }));
    }
  }, []);

  useEffect(() => {
    console.log("Checkout page mounted");
    
    // Check token directly instead of relying on useCart hook
    const token = localStorage.getItem("token");
    console.log("isLoggedIn from useCart:", isLoggedIn);
    console.log("Token exists:", !!token);
    console.log("Token:", token);
    
    if (!token) {
      console.log("No token found, redirecting to home");
      navigate('/');
      return;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      const expTime = getTokenExpirationTime(token);
      console.log("Token is expired. Expiration time:", expTime);
      console.log("Current time:", new Date());
      
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      
      // Clear expired token
      localStorage.removeItem("token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_profile_image");
      
      navigate('/');
      return;
    }
    
    console.log("Token is valid, loading checkout data");
    // Load checkout data regardless of useCart isLoggedIn state
    loadCheckoutData();
  }, [navigate]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      console.log("Loading checkout data...");
      
      const response = await getCheckoutSession();
      console.log("Checkout session response:", response.data);
      const data = response.data as CheckoutData;
      
      if (!data.cart_items || data.cart_items.length === 0) {
        console.log("Cart is empty, redirecting to cart page");
        toast({
          title: "Cart is empty",
          description: "Please add items to your cart before checkout.",
          variant: "destructive",
        });
        navigate('/cart');
        return;
      }

      console.log("Setting checkout data:", data);
      setCheckoutData(data);

      // Pre-fill form with saved address if available
      if (data.address) {
        console.log("Pre-filling form with address:", data.address);
        setFormData({
          email: data.address.email || formData.email,
          firstName: data.address.first_name || '',
          lastName: data.address.last_name || '',
          address: data.address.address || '',
          city: data.address.city || '',
          postalCode: data.address.postal_code || '',
          phone: data.address.phone || ''
        });
      }
    } catch (error: any) {
      console.error('Failed to load checkout data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || "Failed to load checkout information. Please try again.";
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Error loading checkout",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If it's an authentication error, clear token and redirect to login
      if (error.response?.status === 401) {
        console.log("Authentication failed, clearing token and redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_profile_image");
        navigate('/');
        return;
      }
      
      // Only redirect to cart if it's a cart not found error
      if (error.response?.status === 404 || error.response?.data?.error?.includes("Cart not found")) {
        console.log("Cart not found, redirecting to cart page");
        navigate('/cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async () => {
    // Validate form
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const checkoutPayload = {
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          is_default: false
        },
        payment_method: "stripe"
      };

      const response = await processCheckout(checkoutPayload);
      const { order, message } = response.data as { order: any; message?: string };

      // Refresh cart count
      refreshCartCount();

      toast({
        title: "Payment Successful!",
        description: message || "Your order has been placed successfully.",
      });

      // Navigate to success page with order ID
      navigate(`/payment-success?order=${order.ID}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.response?.data?.error || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_profile_image");
    
    setUserProfile({
      name: "",
      email: "",
      profileImage: ""
    });
    
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkoutData && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Checkout</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => {
              setError(null);
              loadCheckoutData();
            }} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/cart')} 
              className="w-full"
            >
              Go to Cart
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No checkout data available.</p>
          <Button onClick={() => navigate('/cart')} className="mt-4">
            Go to Cart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cart')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Button>
              <h1 className="text-2xl font-bold text-green-600">Secure Checkout</h1>
              <Lock className="w-5 h-5 ml-2 text-green-600" />
            </div>

            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-4">
              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={userProfile.profileImage || "/avatar.jpg"} 
                          alt={userProfile.name || "User"} 
                        />
                        <AvatarFallback className="text-sm font-medium">
                          {userProfile.name 
                            ? userProfile.name.slice(0, 2).toUpperCase() 
                            : "US"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-2" align="end">
                    <div className="flex items-center space-x-3 p-3 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={userProfile.profileImage || "/avatar.jpg"} 
                          alt={userProfile.name || "User"} 
                        />
                        <AvatarFallback className="text-sm font-medium">
                          {userProfile.name 
                            ? userProfile.name.slice(0, 2).toUpperCase() 
                            : "US"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userProfile.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {userProfile.email || "user@example.com"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/seller-management')}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Manage Products
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Bangkok"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="10110"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+66 XX XXX XXXX"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Stripe Secure Payment</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Your payment will be processed securely through Stripe. We accept all major credit cards.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {checkoutData.cart_items.map((item) => (
                    <div key={item.product_id} className="flex items-center space-x-3">
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder.svg'}
                        alt={item.product?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {item.product?.name || 'Product'}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">
                        ฿{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>฿{checkoutData.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{checkoutData.shipping === 0 ? 'Free' : `฿${checkoutData.shipping.toLocaleString()}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">฿{checkoutData.total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    "Processing Payment..."
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Complete Payment
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By completing your purchase, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
