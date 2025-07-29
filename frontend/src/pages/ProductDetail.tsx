import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Heart, ShoppingCart, Plus, Minus, MessageCircle, Shield, Truck, ChevronLeft, ChevronRight, User, Calendar, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const [isAutoSliding, setIsAutoSliding] = useState(true);

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

    // Auto-slideshow effect
    useEffect(() => {
        if (!product || !product.images || product.images.length <= 1 || !isAutoSliding) {
            return;
        }

        const interval = setInterval(() => {
            setSelectedImage((prev) => (prev + 1) % product.images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [product, isAutoSliding]);

    // Image navigation functions
    const nextImage = () => {
        if (!product || !product.images) return;
        setIsAutoSliding(false);
        setSelectedImage((prev) => (prev + 1) % product.images.length);
        setTimeout(() => setIsAutoSliding(true), 5000);
    };

    const prevImage = () => {
        if (!product || !product.images) return;
        setIsAutoSliding(false);
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
        setTimeout(() => setIsAutoSliding(true), 5000);
    };

    const selectImage = (index: number) => {
        setIsAutoSliding(false);
        setSelectedImage(index);
        setTimeout(() => setIsAutoSliding(true), 5000);
    };

    const handleAddToCart = async () => {
        if (!product) return;

        if (!isLoggedIn) {
            setIsLoginOpen(true);
            return;
        }

        try {
            try {
                const cartResponse = await getUserCart();
                const existingItem = cartResponse.data.items.find((item: any) => item.product_id === product.ID);

                if (existingItem) {
                    await updateCartItem({
                        product_id: product.ID,
                        quantity: existingItem.quantity + quantity
                    });
                } else {
                    await addToCartAPI({
                        product_id: product.ID,
                        quantity: quantity
                    });
                }

                refreshCartCount();

                toast({
                    title: "Added to Cart",
                    description: `${product.name} has been added to your cart.`,
                });
            } catch (error: any) {
                console.error('Failed to add to cart via API:', error);
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
                title: "Removed from Wishlist",
                description: `${product.name} has been removed from your wishlist`,
            });
        } else {
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
                title: "Added to Wishlist",
                description: `${product.name} has been added to your wishlist`,
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
            </div>
        );
    }
    
    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
                    <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Unknown';
        }
    };

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Images - Takes 2/3 of the space */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Main Image Display with Navigation */}
                        <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-lg group" style={{ height: '600px' }}>
                            <img
                                src={product.images?.[selectedImage]?.url || '/placeholder.svg'}
                                alt={product.name}
                                className="w-full h-full object-contain transition-all duration-300"
                                style={{ objectFit: 'contain' }}
                            />
                            
                            {/* Navigation Arrows */}
                            {product.images && product.images.length > 1 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full p-2"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full p-2"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                </>
                            )}

                            {/* Image Counter */}
                            {product.images && product.images.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    {selectedImage + 1} / {product.images.length}
                                </div>
                            )}

                            {/* Auto-slide indicator */}
                            {product.images && product.images.length > 1 && isAutoSliding && (
                                <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    Auto
                                </div>
                            )}

                            {/* Wishlist Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleWishlist}
                                className={`absolute top-4 left-4 rounded-full p-2 ${
                                    isInWishlist(product.ID) 
                                        ? 'bg-red-500 text-white hover:bg-red-600' 
                                        : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                                }`}
                                title={isInWishlist(product.ID) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                                <Heart className={`w-5 h-5 ${isInWishlist(product.ID) ? 'fill-current' : ''}`} />
                            </Button>
                        </div>

                        {/* Image Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-3">
                                {product.images.map((img: ProductImage, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => selectImage(index)}
                                        title={`View product image ${index + 1}`}
                                        className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 hover:border-green-400 ${
                                            selectedImage === index 
                                                ? 'border-green-500 ring-2 ring-green-200' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Slideshow Controls */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex items-center justify-center space-x-4 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAutoSliding(!isAutoSliding)}
                                    className={isAutoSliding ? 'border-green-600 text-green-600' : 'border-gray-300'}
                                >
                                    {isAutoSliding ? 'Pause' : 'Play'} Slideshow
                                </Button>
                                
                                {/* Dots indicator */}
                                <div className="flex space-x-2">
                                    {product.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => selectImage(index)}
                                            title={`View image ${index + 1}`}
                                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                                selectedImage === index 
                                                    ? 'bg-green-600' 
                                                    : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Info - Takes 1/3 of the space */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Product Title and Price */}
                        <Card>
                            <CardContent className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                                <div className="text-3xl font-bold text-green-600 mb-4">
                                    ฿{product.price.toLocaleString()}
                                </div>
                                
                                {/* Product Status */}
                                <div className="flex items-center space-x-2 mb-4">
                                    <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                                    <Badge variant="outline">New</Badge>
                                </div>

                                {/* Quantity Selector */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-gray-700">Quantity:</span>
                                        <div className="flex items-center border rounded-lg">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                                className="px-3"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="px-3"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <Button
                                            size="lg"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                                            onClick={buyNow}
                                        >
                                            Buy Now
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full border-green-600 text-green-600 hover:bg-green-50 font-medium"
                                            onClick={handleAddToCart}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Add to Cart
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Contact Seller
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Product Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-green-600" />
                                    Product Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-gray-600 flex items-center">
                                            <Tag className="w-4 h-4 mr-2" />
                                            Category:
                                        </span>
                                        <span className="font-medium">{product.category?.name || 'Uncategorized'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-gray-600 flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            Seller:
                                        </span>
                                        <span className="font-medium">{product.user?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b">
                                        <span className="text-gray-600 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Listed:
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(product.CreatedAt || new Date().toISOString())}
                                        </span>
                                    </div>
                                    {/* <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600 flex items-center">
                                            <Package className="w-4 h-4 mr-2" />
                                            Product ID:
                                        </span>
                                        <span className="font-medium">#{product.ID}</span>
                                    </div> */}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Trust Badges */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                                        <span>Buyer Protection Guarantee</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Truck className="w-4 h-4 mr-2 text-green-600" />
                                        <span>Fast & Secure Shipping</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                                        <span>24/7 Customer Support</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                
                {/* Reviews Section */}
                <div className="mt-12">
                    <ProductReviews productId={product.ID} />
                </div>
            </div>

            {/* Login Dialog */}
            <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </div>
    );
};

export default ProductDetail;