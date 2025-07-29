import { useEffect, useState } from "react";
import { Search, ShoppingCart, User, Menu, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { LoginDialog } from "@/components/LoginDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllProducts, getAllCategories } from "@/services/api";
import type { Product } from "@/types/Product";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/types/Category";

const Index = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const navigate = useNavigate();
    const { addToWishlist, removeFromWishlist, isInWishlist, wishlistCount } = useWishlist();
    const { toast } = useToast();
    const { cartCount, isLoggedIn, refreshCartCount } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        setLoading(true);
        getAllProducts()
            .then((res) => {
                setProducts(res.data || []);
                setLoading(false);
            })
            .catch((err) => {
                setError("Failed to load products");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        getAllCategories()
            .then(res => setCategories(res.data || []))
            .catch(() => setCategories([]));
    }, []);

    const categoryIcons: Record<string, string> = {
        "Electronics": "📱",
        "Fashion": "👕",
        "Home & Garden": "🏠",
        "Sports": "⚽",
        "Books": "📚",
        "Automotive": "🚗",
    };

    const handleCategoryClick = (categoryName: string) => {
        navigate(`/products?category=${encodeURIComponent(categoryName)}`);
    };

    const handleWishlistToggle = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        if (isInWishlist(product.ID)) {
            removeFromWishlist(product.ID);
            toast({
                title: "Removed from wishlist",
                description: `${product.name} has been removed from your wishlist`,
            });
        } else {
            addToWishlist({
                id: product.ID,
                title: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0].url : '/placeholder.svg',
                category: product.category?.name,
            });
            toast({
                title: "Added to wishlist",
                description: `${product.name} has been added to your wishlist`,
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_profile_image");
        window.location.reload();
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
        // Navigate to profile or show user menu
    };

    const handleSellClick = () => {
        navigate('/sell');
    };

    const handleStartShoppingClick = () => {
        navigate('/products');
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-green-600">JuPiShop</h1>
                            <span className="ml-2 text-sm text-gray-500 hidden sm:block">Second-hand treasures</span>
                        </div>

                        {/* Search Bar - Desktop */}
                        <div className="hidden md:flex flex-1 max-w-lg mx-8">
                            <div className="relative w-full">
                                <Input
                                    placeholder="Search for products, brands, or sellers..."
                                    className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            </div>
                            <Button className="ml-2 bg-green-600 hover:bg-green-700 text-white">
                                Search
                            </Button>
                        </div>

                        {/* Header Actions */}
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
                                            <Avatar>
                                                <AvatarImage src="/avatar.jpg" alt="user" />
                                                <AvatarFallback>User</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-40 mt-2">
                                        <DropdownMenuItem onClick={() => alert("Go to Profile")}>
                                            My Profile
                                        </DropdownMenuItem>
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
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Search */}
                <div className="md:hidden px-4 pb-4">
                    <div className="relative">
                        <Input
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-green-500"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-green-50 border-b border-green-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex space-x-8">
                            <button
                                onClick={() => navigate('/products')}
                                className="text-green-700 hover:text-green-800 font-medium text-sm"
                            >
                                All Categories
                            </button>
                            <button
                                onClick={() => handleCategoryClick('Electronics')}
                                className="text-gray-600 hover:text-green-600 text-sm hidden sm:block"
                            >
                                Electronics
                            </button>
                            <button
                                onClick={() => handleCategoryClick('Fashion')}
                                className="text-gray-600 hover:text-green-600 text-sm hidden sm:block"
                            >
                                Fashion
                            </button>
                            <button
                                onClick={() => handleCategoryClick('Home & Garden')}
                                className="text-gray-600 hover:text-green-600 text-sm hidden sm:block"
                            >
                                Home & Garden
                            </button>
                            <button
                                onClick={() => handleCategoryClick('Sports')}
                                className="text-gray-600 hover:text-green-600 text-sm hidden lg:block"
                            >
                                Sports
                            </button>
                        </div>
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleSellClick}
                        >
                            Sell Your Items
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Discover Amazing Second-Hand Treasures
                    </h2>
                    <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
                        Buy and sell pre-loved items with confidence. Quality products at unbeatable prices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                            size="lg" 
                            className="bg-white text-green-600 hover:bg-gray-100"
                            onClick={handleStartShoppingClick}
                        >
                            Start Shopping
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            className="border-white text-green-600 hover:bg-white hover:text-green-600"
                            onClick={handleSellClick}
                        >
                            Become a Seller
                        </Button>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Shop by Category</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((category, index) => (
                            <Card
                                key={category.ID}
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                                onClick={() => handleCategoryClick(category.name)}
                            >
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl mb-3">{categoryIcons[category.name] || "❓"}</div>
                                    <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                        {category.name}
                                    </h4>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <h3 className="text-3xl font-bold text-gray-900">Featured Products</h3>
                        <Button
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => navigate('/products')}
                        >
                            View All
                        </Button>
                    </div>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading products...</div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No products found.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <Card
                                    key={product.ID}
                                    className="hover:shadow-xl transition-all duration-300 group cursor-pointer"
                                    onClick={() => navigate(`/product/${product.ID}`)}
                                >
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={
                                                product.images && product.images.length > 0
                                                    ? product.images[0].url
                                                    : '/placeholder.svg'
                                            }
                                            alt={product.name}
                                            className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`absolute top-3 right-3 bg-white/80 hover:bg-white ${isInWishlist(product.ID)
                                                ? 'text-red-500 hover:text-red-600'
                                                : 'text-gray-400 hover:text-red-500'
                                                }`}
                                            onClick={(e) => handleWishlistToggle(e, product)}
                                        >
                                            <Heart
                                                className={`w-4 h-4 ${isInWishlist(product.ID) ? 'fill-current' : ''}`}
                                            />
                                        </Button>
                                    </div>
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h4>
                                        <div className="flex items-center gap-2 mb-2">
                                            {product.category && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {product.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-green-600">฿{product.price?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/product/${product.ID}`);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Call to Action */}
            <section className="bg-green-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h3 className="text-3xl font-bold mb-4">Ready to Start Selling?</h3>
                    <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                        Turn your unused items into cash. Join thousands of sellers on JuPiShop.
                    </p>
                    <Button 
                        size="lg" 
                        className="bg-white text-green-600 hover:bg-gray-100"
                        onClick={handleSellClick}
                    >
                        Start Selling Today
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="text-xl font-bold text-green-400 mb-4">JuPiShop</h4>
                            <p className="text-gray-300 mb-4">
                                Thailand's premier marketplace for second-hand goods. Buy and sell with confidence.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-4">For Buyers</h5>
                            <ul className="space-y-2 text-gray-300">
                                <li><a href="#" className="hover:text-green-400 transition-colors">Browse Products</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">How to Buy</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Payment Methods</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Buyer Protection</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-4">For Sellers</h5>
                            <ul className="space-y-2 text-gray-300">
                                <li><a href="#" className="hover:text-green-400 transition-colors">Start Selling</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Seller Guide</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Shipping</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Seller Protection</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-4">Support</h5>
                            <ul className="space-y-2 text-gray-300">
                                <li><a href="#" className="hover:text-green-400 transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 JuPiShop. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Login Dialog */}
            <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </div>
    );
};

export default Index;