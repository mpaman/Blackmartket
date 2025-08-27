import { ArrowLeft, ShoppingCart, User, Heart, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useState, useEffect } from "react";
import { LoginDialog } from "@/components/LoginDialog";
import { addToCart as addToCartAPI, updateCartItem, getUserCart } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Wishlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wishlistItems, removeFromWishlist, wishlistCount } = useWishlist();
  const { cartCount, isLoggedIn, refreshCartCount } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // User profile data
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    profileImage: ""
  });

  // Load user profile data
  useEffect(() => {
    if (isLoggedIn) {
      const userName = localStorage.getItem("user_name") || "";
      const userEmail = localStorage.getItem("user_email") || "";
      const userProfileImage = localStorage.getItem("user_profile_image") || "";
      
      setUserProfile({
        name: userName,
        email: userEmail,
        profileImage: userProfileImage
      });
    }
  }, [isLoggedIn]);

  const handleAddToCart = async (product: any) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }

    try {
      // Check if item already exists in cart
      const cartResponse = await getUserCart();
      const existingItem = cartResponse.data.items.find((item: any) => item.product_id === product.id);

      if (existingItem) {
        // Update existing item
        await updateCartItem({
          product_id: product.id,
          quantity: existingItem.quantity + 1
        });
      } else {
        // Add new item
        await addToCartAPI({
          product_id: product.id,
          quantity: 1
        });
      }

      // Refresh cart count
      refreshCartCount();
      
      toast({
        title: "Added to Cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromWishlist = (id: number, title: string) => {
    removeFromWishlist(id);
    toast({
      title: "Removed from Wishlist",
      description: `${title} has been removed from your wishlist.`,
    });
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    navigate('/cart');
  };

  const handleAccountClick = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    // Navigate to profile page
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_profile_image");
    
    // Clear user profile state
    setUserProfile({
      name: "",
      email: "",
      profileImage: ""
    });
    
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-green-600">JuPiShop</h1>
              <span className="ml-2 text-sm text-gray-500 hidden sm:block">Wishlist</span>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-green-600"
                onClick={handleCartClick}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Cart</span>
                {isLoggedIn && cartCount > 0 && (
                  <Badge className="ml-1 bg-green-600 text-white">{cartCount}</Badge>
                )}
              </Button>
              {isLoggedIn ? (
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
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-green-600"
                  onClick={handleAccountClick}
                >
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Account</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h2>
          <p className="text-gray-600">
            You have {wishlistCount} items in your wishlist.
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding products you love to your wishlist.</p>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <Card 
                key={product.id} 
                className="hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onClick={() => navigate(`/product/${product.id}`)}
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.png';
                    }}
                  />
                  {product.originalPrice && product.price < product.originalPrice && (
                    <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
                    onClick={() => handleRemoveFromWishlist(product.id, product.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h4 
                    className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-green-600"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    {/* {product.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                      </div>
                    )} */}
                    {/* {product.condition && (
                      <Badge variant="secondary" className="text-xs">
                        {product.condition}
                      </Badge>
                    )} */}
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-lg font-bold text-green-600">฿{product.price.toLocaleString()}</p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  );
};

export default Wishlist;
