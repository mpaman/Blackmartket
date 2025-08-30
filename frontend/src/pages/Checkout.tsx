import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, ShoppingCart, User, Plus, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/types/CartItem";
import { getCheckoutSession, processCheckout, GetUserAddresses, addAddress, deleteAddress } from "@/services/api";
import { isTokenExpired, getTokenExpirationTime } from "@/utils/tokenUtils";
import { CheckoutData } from "@/types/CheckoutData";

interface Address {
  ID: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  is_default: boolean;
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

  // Address management states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });

  // Load user profile and addresses
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

      // Load user addresses
      loadUserAddresses();
    }
  }, []);

  useEffect(() => {
    console.log("Checkout page mounted");

    // Check token directly instead of relying on useCart hook
    const token = localStorage.getItem("token");
    console.log("isLoggedIn from useCart:", isLoggedIn);
    console.log("Token exists:", !!token);

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
      localStorage.clear();
      navigate('/');
      return;
    }

    console.log("Token is valid, loading checkout data");
    loadCheckoutData();
  }, [navigate]);

  const loadUserAddresses = async () => {
    try {
      const response = await GetUserAddresses();
      console.log("User addresses:", response.data);
      const addressList = Array.isArray(response.data) ? response.data : [];
      setAddresses(addressList);

      // Set default address as selected if available
      const defaultAddress = addressList.find((addr: Address) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.ID);
        fillFormWithAddress(defaultAddress);
      } else if (addressList.length > 0) {
        // If no default, select the first address
        setSelectedAddressId(addressList[0].ID);
        fillFormWithAddress(addressList[0]);
      }
    } catch (error: any) {
      console.error('Failed to load addresses:', error);
      // Don't show error toast for addresses as it's not critical
    }
  };

  const fillFormWithAddress = (address: Address) => {
    setFormData({
      email: address.email || formData.email,
      firstName: address.first_name || '',
      lastName: address.last_name || '',
      address: address.address || '',
      city: address.city || '',
      postalCode: address.postal_code || '',
      phone: address.phone || ''
    });
  };

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

    } catch (error: any) {
      console.error('Failed to load checkout data:', error);
      const errorMessage = error.response?.data?.error || "Failed to load checkout information. Please try again.";
      setError(errorMessage);

      toast({
        title: "Error loading checkout",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
        return;
      }

      if (error.response?.status === 404 || error.response?.data?.error?.includes("Cart not found")) {
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

  const handleAddressSelect = (addressId: string) => {
    const selectedAddress = addresses.find(addr => addr.ID === parseInt(addressId));
    if (selectedAddress) {
      setSelectedAddressId(selectedAddress.ID);
      fillFormWithAddress(selectedAddress);
    }
  };

  const handleSaveAddress = async () => {
    // Validate form
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim());

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const addressData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postal_code: formData.postalCode.trim(),
        is_default: addresses.length === 0 // Make first address default
      };

      if (isEditMode && editingAddressId) {
        // TODO: Implement update address API
        toast({
          title: "Feature coming soon",
          description: "Address editing will be available soon.",
        });
      } else {
        // Add new address
        const response = await addAddress(addressData);
        console.log("Address added:", response.data);
        
        toast({
          title: "Address saved",
          description: "Your address has been saved successfully.",
        });

        // Reload addresses
        await loadUserAddresses();
      }

      setIsAddressDialogOpen(false);
      setIsEditMode(false);
      setEditingAddressId(null);
    } catch (error: any) {
      console.error('Failed to save address:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await deleteAddress(addressId);
      
      toast({
        title: "Address deleted",
        description: "The address has been deleted successfully.",
      });

      // Reload addresses
      await loadUserAddresses();
      
      // If deleted address was selected, clear selection
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
        setFormData({
          email: userProfile.email,
          firstName: '',
          lastName: '',
          address: '',
          city: '',
          postalCode: '',
          phone: ''
        });
      }
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
    setDeleteConfirmId(null);
  };

  const openAddAddressDialog = () => {
    setIsEditMode(false);
    setEditingAddressId(null);
    setFormData({
      email: userProfile.email,
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      postalCode: '',
      phone: ''
    });
    setIsAddressDialogOpen(true);
  };

  const openEditAddressDialog = (address: Address) => {
    setIsEditMode(true);
    setEditingAddressId(address.ID);
    fillFormWithAddress(address);
    setIsAddressDialogOpen(true);
  };

  const handlePayment = async () => {
    // Validate form
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim());

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
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postal_code: formData.postalCode.trim(),
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
    localStorage.clear();
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
            {/* Saved Addresses */}
            {addresses.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Saved Addresses
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAddAddressDialog}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedAddressId?.toString()}
                    onValueChange={handleAddressSelect}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <div key={address.ID} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value={address.ID.toString()} id={`address-${address.ID}`} />
                        <div className="flex-1">
                          <label htmlFor={`address-${address.ID}`} className="cursor-pointer">
                            <div className="font-medium">
                              {address.first_name} {address.last_name}
                              {address.is_default && (
                                <Badge variant="secondary" className="ml-2">Default</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {address.address}, {address.city} {address.postal_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {address.phone} • {address.email}
                            </div>
                          </label>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditAddressDialog(address)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(address.ID)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Shipping Information</CardTitle>
                  {addresses.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAddAddressDialog}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Save Address
                    </Button>
                  )}
                </div>
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
                        src={item.product?.images?.[0]?.url?.startsWith('data:') 
                          ? item.product.images[0].url 
                          : item.product?.images?.[0]?.url || '/placeholder.svg'}
                        alt={item.product?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
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
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Complete Payment - ฿{checkoutData.total.toLocaleString()}
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

      {/* Add/Edit Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dialogEmail">Email Address *</Label>
              <Input
                id="dialogEmail"
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
                <Label htmlFor="dialogFirstName">First Name *</Label>
                <Input
                  id="dialogFirstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dialogLastName">Last Name *</Label>
                <Input
                  id="dialogLastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dialogAddress">Address *</Label>
              <Input
                id="dialogAddress"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dialogCity">City *</Label>
                <Input
                  id="dialogCity"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Bangkok"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dialogPostalCode">Postal Code *</Label>
                <Input
                  id="dialogPostalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="10110"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dialogPhone">Phone Number *</Label>
              <Input
                id="dialogPhone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+66 XX XXX XXXX"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddressDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAddress}>
                {isEditMode ? 'Update' : 'Save'} Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteAddress(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checkout;
