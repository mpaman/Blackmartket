import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Heart, Star, ArrowLeft, Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllProducts, getAllCategories, addToCart as addToCartAPI, updateCartItem, getUserCart } from "@/services/api";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/Product";
import type { Category } from "@/types/Category";
import type { CartItem } from "@/types/CartItem";
import { LoginDialog } from "@/components/LoginDialog";
import { useUserProfile } from "@/hooks/use-user-profile";

// Local interface for localStorage cart items

// interface CartItem {
//   id: number;
//   title: string;
//   price: number;
//   image: string;
//   seller: string;
//   quantity: number;
// }

const AllProducts = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToWishlist, removeFromWishlist, isInWishlist, wishlistCount } = useWishlist();
    const { cartCount, isLoggedIn, refreshCartCount } = useCart();
    const { userProfile, loadUserProfile, clearUserProfile } = useUserProfile();

    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState(""); // Add search state
    const productsPerPage = 12;
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState("");

    // Check for search and category parameters from URL
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        const searchParam = searchParams.get('search');
        
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }
        
        if (searchParam) {
            setSearchQuery(searchParam);
        }
    }, [searchParams]);

    // Fetch products from API
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

    // Fetch categories from API
    useEffect(() => {
        setCategoriesLoading(true);
        getAllCategories()
            .then((res) => {
                setCategories(res.data || []);
                setCategoriesLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load categories:", err);
                setCategories([]);
                setCategoriesLoading(false);
            });
    }, []);

    // Load user profile data
    useEffect(() => {
        if (isLoggedIn) {
            loadUserProfile();
        } else {
            clearUserProfile();
        }
    }, [isLoggedIn]);

    // Enhanced search and filter function
    const getFilteredProducts = () => {
        let filtered = [...products];

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter(product => 
                product.category?.name === selectedCategory
            );
        }

        // Filter by search query (search in product name, description, and seller name)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => {
                const productName = product.name?.toLowerCase() || '';
                const productDescription = product.description?.toLowerCase() || '';
                const sellerName = product.user?.name?.toLowerCase() || '';
                
                return productName.includes(query) || 
                       productDescription.includes(query) || 
                       sellerName.includes(query);
            });
        }

        return filtered;
    };

    // Get filtered products
    const filteredProducts = getFilteredProducts();

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            case "rating":
                // If you have rating field, use it here
                return 0;
            default:
                return b.ID - a.ID; // newest first
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const currentProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

    // Search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page
        
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams);
        if (searchQuery.trim()) {
            newSearchParams.set('search', searchQuery.trim());
        } else {
            newSearchParams.delete('search');
        }
        setSearchParams(newSearchParams);
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1); // Reset to first page
        
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams);
        if (category !== "all") {
            newSearchParams.set('category', category);
        } else {
            newSearchParams.delete('category');
        }
        setSearchParams(newSearchParams);
    };

    const clearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);
        
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('search');
        setSearchParams(newSearchParams);
    };

    const handleWishlistToggle = (productId: number) => {
        const product = products.find(p => p.ID === productId);
        if (!product) {
            return;
        }

        if (isInWishlist(productId)) {
            removeFromWishlist(productId);
            toast({
                title: "Removed from Wishlist",
                description: `${product.name} has been removed from your wishlist`,
            });
        } else {
            // Fix: Map Product to WishlistItem structure
            addToWishlist({
                id: product.ID,
                title: product.name, // Changed from title to name
                originalPrice: product.price,
                image: product.images?.[0]?.url || '/placeholder.svg',
                seller: product.user?.name || 'Unknown Seller', // Use actual seller name
                price: product.price,
                rating: 0,
                condition: 'New',
                category: product.category?.name || 'Uncategorized'
            });
            toast({
                title: "Added to Wishlist",
                description: `${product.name} has been added to your wishlist`,
            });
        }
    };

    const handleAddToCart = async (product: Product) => {
        if (!isLoggedIn) {
            setIsLoginOpen(true);
            return;
        }

        try {
            // Check if item already exists in cart
            const cartResponse = await getUserCart();
            const existingItem = cartResponse.data.items.find((item: any) => item.product_id === product.ID);

            if (existingItem) {
                // Update existing item
                await updateCartItem({
                    product_id: product.ID,
                    quantity: existingItem.quantity + 1
                });
            } else {
                // Add new item
                await addToCartAPI({
                    product_id: product.ID,
                    quantity: 1
                });
            }

            // Refresh cart count
            refreshCartCount();

            toast({
                title: "Added to Cart",
                description: `${product.name} has been added to your cart.`,
            });
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            console.log('Product ID being sent:', product.ID);

            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to add item to cart. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Helper function to get proper image URL
    const getProfileImageUrl = (imageUrl: string) => {
        if (!imageUrl) return "/avatar.jpg";
        
        if (imageUrl.startsWith('data:')) {
            return imageUrl;
        }
        
        if (imageUrl.startsWith('/')) {
            return `http://localhost:8000${imageUrl}`;
        }
        
        return imageUrl;
    };

    const handleLogout = () => {
        localStorage.clear();
        clearUserProfile();
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
        // Navigate to profile page
        navigate('/profile');
    };

    // Helper function for search highlighting
    const highlightSearchTerm = (text: string, searchTerm: string) => {
        if (!searchTerm.trim()) return text;
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 rounded px-1">$1</mark>');
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
                            <span className="ml-2 text-sm text-gray-500 hidden sm:block">All Products</span>
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
                                                    src={getProfileImageUrl(userProfile.profileImage)}
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
                                                    src={getProfileImageUrl(userProfile.profileImage)}
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
                                        <DropdownMenuItem onClick={() => navigate('/orders')}>
                                            My Orders
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
                {/* Enhanced Search and Filters */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <form onSubmit={handleSearch} className="relative flex">
                                <Input
                                    placeholder="Search products, brands, or sellers..."
                                    className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-green-500"
                                    value={searchQuery}
                                    onChange={handleSearchInputChange}
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Button 
                                    type="submit" 
                                    className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                >
                                    Search
                                </Button>
                                {searchQuery && (
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="ml-1"
                                        onClick={clearSearch}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </form>
                        </div>

                        <div className="flex items-center gap-4">
                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder={categoriesLoading ? "Loading..." : "Category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {!categoriesLoading && categories.map((category) => (
                                        <SelectItem key={category.ID} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                    {categoriesLoading && (
                                        <SelectItem value="loading" disabled>
                                            Loading categories...
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                    <SelectItem value="rating">Highest Rated</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex border rounded-lg">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                    className="rounded-r-none"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("list")}
                                    className="rounded-l-none"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Search Results Info */}
                    {searchQuery && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                                <span className="font-medium">Search results for:</span> "{searchQuery}"
                                {selectedCategory !== "all" && (
                                    <span> in <span className="font-medium">{selectedCategory}</span></span>
                                )}
                            </p>
                            {filteredProducts.length === 0 && (
                                <p className="text-sm text-green-600 mt-1">
                                    No products found. Try different keywords or browse all products.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Enhanced Results Summary */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing {filteredProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                        {selectedCategory !== "all" && ` in ${selectedCategory}`}
                        {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No products found' : 'No products available'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery 
                                ? `We couldn't find any products matching "${searchQuery}". Try different keywords or browse all products.`
                                : 'There are no products available at the moment.'
                            }
                        </p>
                        <div className="flex gap-4 justify-center">
                            {searchQuery && (
                                <Button onClick={clearSearch} variant="outline">
                                    Clear Search
                                </Button>
                            )}
                            <Button onClick={() => navigate('/products')}>
                                Browse All Products
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={`grid gap-6 mb-8 ${viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1"
                        }`}>
                        {currentProducts.map((product) => (
                            <Card
                                key={product.ID}
                                className={`hover:shadow-xl transition-all duration-300 group cursor-pointer ${viewMode === "list" ? "flex flex-row" : ""
                                    }`}
                                onClick={() => navigate(`/product/${product.ID}`)}
                            >
                                <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                                    <img
                                        src={product.images?.[0]?.url?.startsWith('data:')
                                            ? product.images[0].url
                                            : product.images?.[0]?.url || '/placeholder.svg'}
                                        alt={product.name}
                                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${viewMode === "list" ? "w-full h-full" : "w-full h-48"
                                            }`}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder.svg';
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`absolute top-3 right-3 bg-white/80 hover:bg-white ${isInWishlist(product.ID) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleWishlistToggle(product.ID);
                                        }}
                                    >
                                        <Heart className={`w-4 h-4 ${isInWishlist(product.ID) ? 'fill-current' : ''}`} />
                                    </Button>
                                </div>
                                <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {searchQuery ? (
                                            <span dangerouslySetInnerHTML={{
                                                __html: highlightSearchTerm(product.name, searchQuery)
                                            }} />
                                        ) : (
                                            product.name
                                        )}
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                            {product.category?.name}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-green-600">฿{product.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        by{' '}
                                        {searchQuery && product.user?.name ? (
                                            <span dangerouslySetInnerHTML={{
                                                __html: highlightSearchTerm(product.user.name, searchQuery)
                                            }} />
                                        ) : (
                                            product.user?.name || 'Unknown Seller'
                                        )}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(product);
                                            }}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Add to Cart
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/product/${product.ID}`);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination className="mt-8">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let page;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            onClick={() => setCurrentPage(page)}
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>

            {/* Login Dialog */}
            <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </div>
    );
};

export default AllProducts;