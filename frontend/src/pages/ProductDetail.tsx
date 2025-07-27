import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Heart, ShoppingCart, Plus, Minus, MessageCircle, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import ProductReviews from "@/components/ProductReviews";
import { getProductById, addToCart as addToCartAPI, updateCartItem, getUserCart } from "@/services/api";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/Product";
import type { ProductImage } from "@/types/ProductImage";
import { LoginDialog } from "@/components/LoginDialog";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistCount } = useWishlist();
  const { cartCount, isLoggedIn, refreshCartCount } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductById(Number(id))
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }

    try {
      // User is logged in - use API
      try {
        // First try to get current cart to check if item exists
        const cartResponse = await getUserCart();
        const existingItem = cartResponse.data.items.find((item: any) => item.product_id === product.ID);

        if (existingItem) {
          // Update existing item
          await updateCartItem({ 
            product_id: product.ID, 
            quantity: existingItem.quantity + quantity 
          });
        } else {
          // Add new item
          await addToCartAPI({ 
            product_id: product.ID, 
            quantity: quantity 
          });
        }

        // Refresh cart count
        refreshCartCount();

        toast({
          title: "Added to Cart",
          description: `${product.name} has been added to your cart.`,
        });
      } catch (error: any) {
        console.error('Failed to add to cart via API:', error);
        
        // Log the actual data being sent for debugging
        console.log('Product ID being sent:', product.ID);
        console.log('Quantity being sent:', quantity);
        
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to add item to cart. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const buyNow = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    handleAddToCart();
    navigate('/cart');
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    navigate('/cart');
  };

  const toggleWishlist = () => {
    if (!product) return;

    if (isInWishlist(product.ID)) {
      removeFromWishlist(product.ID);
      toast({
        title: "ลบจากรายการโปรดแล้ว",
        description: `${product.name} ได้ถูกลบจากรายการโปรดของคุณ`,
      });
    } else {
      // Map Product to WishlistItem
      const wishlistItem = {
        id: product.ID,
        title: product.name,
        price: product.price,
        originalPrice: (product as any).originalPrice || product.price,
        image: product.images[0]?.url || '',
        seller: (product as any).seller || '-',
        rating: (product as any).rating || 0,
        condition: (product as any).condition || '-',
        category: product.category?.name || '-',
      };
      addToWishlist(wishlistItem);
      toast({
        title: "เพิ่มลงรายการโปรดแล้ว",
        description: `${product.name} ได้ถูกเพิ่มลงในรายการโปรดของคุณ`,
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;
  }

  // Calculate discount if you have original price (optional, fallback to 0)
  const originalPrice = (product as any).originalPrice || product.price;
  const discountPercentage = Math.round((1 - product.price / originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
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
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-gray-600 hover:text-green-600"
                onClick={() => navigate('/wishlist')}
              >
                <Heart className="w-4 h-4 mr-1" />
                Wishlist
                {wishlistCount > 0 && (
                  <Badge className="ml-1 bg-green-600 text-white">{wishlistCount}</Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCartClick}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {isLoggedIn && cartCount > 0 && (
                  <Badge className="ml-1 bg-green-600 text-white">{cartCount}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              <img
                src={product.images?.[0]?.url || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((img: ProductImage, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedImage === index ? 'border-green-500' : 'border-gray-200'}`}
                >
                  <img
                    src={img.url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                  <p className="text-gray-600 mt-2">by {product.user?.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleWishlist}
                  className={isInWishlist(product.ID) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.ID) ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-gray-600">{product.rating}</span>
                </div>
                <Badge variant="secondary">{product.condition}</Badge>
                <span className="text-sm text-gray-500">{product.views} views</span>
              </div> */}

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-green-600">฿{product.price.toLocaleString()}</span>
                  <Badge className="bg-green-100 text-green-800">
                    {discountPercentage}% OFF
                  </Badge>
                </div>
                <p className="text-lg text-gray-400 line-through">฿{originalPrice.toLocaleString()}</p>
                <p className="text-sm text-gray-600">You save ฿{(originalPrice - product.price).toLocaleString()}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-medium">{product.category?.name || '-'}</p>
                </div>
                {/* <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">{product.location}</p>
              </div> */}
              </div>

              <Separator />

              {/* Quantity and Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={buyNow}
                  >
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  Buyer Protection
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2 text-green-600" />
                  Fast Shipping
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <ProductReviews productId={product.ID} />
          </div>
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  );
};

export default ProductDetail;