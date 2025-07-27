import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Cart as CartType } from "@/types/Cart";
import { CartItem } from "@/types/CartItem";
import { getUserCart, addToCart, deleteCart, updateCartItem, removeCartItem } from "@/services/api";
import { LoginDialog } from "@/components/LoginDialog";

const Cart = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [cart, setCart] = useState<CartType | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // Fetch cart data from API
    useEffect(() => {
        const fetchCart = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    // If no token, show empty cart with login prompt
                    setCartItems([]);
                    setError("Please log in to view your cart");
                    setLoading(false);
                    return;
                }

                const response = await getUserCart();
                const cartData = response.data;
                setCart(cartData);
                setCartItems(cartData.items || []);
                setError("");
            } catch (err: any) {
                console.error("Failed to fetch cart:", err);
                if (err.response?.status === 404) {
                    // Cart not found, show empty cart
                    setCartItems([]);
                } else if (err.response?.status === 401) {
                    // Unauthorized, clear token and prompt login
                    localStorage.removeItem("token");
                    setError("Please log in to view your cart");
                } else {
                    setError("Failed to load cart");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, []);

    const refreshCart = async () => {
        try {
            const response = await getUserCart();
            const cartData = response.data;
            setCart(cartData);
            setCartItems(cartData.items || []);
        } catch (err) {
            console.error("Failed to refresh cart:", err);
        }
    };

    const updateQuantity = async (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }

        try {
            await updateCartItem({ product_id: productId, quantity: newQuantity });
            await refreshCart();
            toast({
                title: "Cart Updated",
                description: "Item quantity has been updated.",
            });
        } catch (err) {
            toast({
                title: "Update Failed",
                description: "Failed to update item quantity.",
                variant: "destructive",
            });
        }
    };

    const removeItem = async (productId: number) => {
        try {
            await removeCartItem(productId);
            await refreshCart();
            toast({
                title: "Item Removed",
                description: "Item has been removed from your cart.",
            });
        } catch (err) {
            toast({
                title: "Remove Failed",
                description: "Failed to remove item from cart.",
                variant: "destructive",
            });
        }
    };

    const clearCart = async () => {
        try {
            await deleteCart();
            setCartItems([]);
            setCart(null);
            toast({
                title: "Cart Cleared",
                description: "All items have been removed from your cart.",
            });
        } catch (err) {
            toast({
                title: "Clear Failed",
                description: "Failed to clear cart.",
                variant: "destructive",
            });
        }
    };

    const proceedToCheckout = () => {
        if (cartItems.length === 0) {
            toast({
                title: "Cart is Empty",
                description: "Please add items to your cart before checkout.",
                variant: "destructive",
            });
            return;
        }
        navigate("/checkout");
    };

    const subtotal = cartItems.reduce((sum, item) => {
        const price = item.product?.price || item.price || 0;
        return sum + price * item.quantity;
    }, 0);
    const shipping = subtotal > 1000 ? 0 : 100;
    const total = subtotal + shipping;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your cart...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="text-center p-8">
                    <CardContent>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                                onClick={() => navigate("/")}
                                className="mr-4"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Continue Shopping
                            </Button>
                            <h1 className="text-2xl font-bold text-green-600">Shopping Cart</h1>
                        </div>
                        {cartItems.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearCart}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                                Clear Cart
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {cartItems.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {error === "Please log in to view your cart" ? "Please log in" : "Your cart is empty"}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {error === "Please log in to view your cart"
                                    ? "You need to be logged in to view and manage your cart"
                                    : "Start shopping to add items to your cart"
                                }
                            </p>
                            {error === "Please log in to view your cart" ? (
                                <div className="space-x-4">
                                    <Button
                                        size="lg"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => setIsLoginOpen(true)}
                                    >
                                        Log In
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate("/")}
                                    >
                                        Continue Shopping
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => navigate("/")}
                                >
                                    Start Shopping
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Cart Items ({cartItems.length})
                            </h2>

                            {cartItems.map((item) => (
                                <Card key={item.ID}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <img
                                                src={item.product?.images?.[0]?.url || "/placeholder.jpg"}
                                                alt={item.product?.name || "Product"}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />

                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {item.product?.name || "Unknown Product"}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Category: {item.product?.category?.name || "N/A"}
                                                </p>
                                                <p className="font-bold text-green-600">
                                                    ฿{(item.product?.price || item.price || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-bold text-lg">
                                                    ฿{((item.product?.price || item.price || 0) * item.quantity).toLocaleString()}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.product_id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">฿{subtotal.toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Shipping</span>
                                            <span className="font-medium">
                                                {shipping === 0 ? "Free" : `฿${shipping.toLocaleString()}`}
                                            </span>
                                        </div>

                                        {shipping === 0 && (
                                            <p className="text-sm text-green-600">
                                                🎉 Free shipping on orders over ฿1,000
                                            </p>
                                        )}

                                        <Separator />

                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span className="text-green-600">฿{total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={proceedToCheckout}
                                    >
                                        Proceed to Checkout
                                    </Button>

                                    <p className="text-xs text-gray-500 text-center mt-4">
                                        Secure checkout powered by Stripe
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Login Dialog */}
            <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </div>
    );
};

export default Cart;
