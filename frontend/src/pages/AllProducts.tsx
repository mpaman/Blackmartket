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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllProducts, getAllCategories, addToCart as addToCartAPI, updateCartItem, getUserCart } from "@/services/api";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/Product";
import type { Category } from "@/types/Category";
import type { CartItem } from "@/types/CartItem";
import { LoginDialog } from "@/components/LoginDialog";

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
    const [searchParams] = useSearchParams();
    const { addToWishlist, removeFromWishlist, isInWishlist, wishlistCount } = useWishlist();
    const { cartCount, isLoggedIn, refreshCartCount } = useCart();

    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const productsPerPage = 12;
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [error, setError] = useState("");

    // Check for category parameter from URL
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setSelectedCategory(categoryParam);
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
                // Fallback to empty array if categories fail to load
                setCategories([]);
                setCategoriesLoading(false);
            });
    }, []);

    // Filter products based on selected category
    const filteredProducts = selectedCategory === "all"
        ? products
        : products.filter(product => product.category?.name === selectedCategory);

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            // case "rating":
            //   return b.views - a.views;
            default:
                return b.ID - a.ID; // newest first
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const currentProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

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
                title: product.name,
                originalPrice: product.price,
                image: product.images?.[0]?.url || '/placeholder.svg',
                seller: 'Unknown Seller', // Remove seller property reference
                price: product.price,
                rating: 0, // Remove rating property reference
                condition: 'New', // Remove condition property reference
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
        // If logged in, you could navigate to profile or show user menu
        alert("Go to Profile");
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
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Input
                                    placeholder="Search products..."
                                    className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-green-500"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                </div>

                {/* Results Summary */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, sortedProducts.length)} of {sortedProducts.length} products
                        {selectedCategory !== "all" && ` in ${selectedCategory}`}
                    </p>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div>Loading products...</div>
                ) : error ? (
                    <div>{error}</div>
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
                                        src={product.images?.[0]?.url || '/placeholder.svg'}
                                        alt={product.name}
                                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${viewMode === "list" ? "w-full h-full" : "w-full h-48"
                                            }`}
                                    />
                                    {/* <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </Badge> */}
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
                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        {/* <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                    </div> */}
                                        {/* <Badge variant="secondary" className="text-xs">
                      {product.condition}
                    </Badge> */}
                                        <Badge variant="outline" className="text-xs">
                                            {product.category?.name}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-green-600">฿{product.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">by {product.user?.name}</p>
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

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

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