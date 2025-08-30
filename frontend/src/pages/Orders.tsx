import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getUserOrders } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface OrderItem {
    ID: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: {
        ID: number;
        name: string; // Changed from 'title' to 'name' to match backend
        price: number;
        images?: Array<{
            ID: number;
            url: string; // Changed from 'image_url' to 'url' to match backend
        }>;
    };
}

interface Order {
    ID: number;
    status: string;
    total_price: number;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
    address?: {
        ID: number;
        first_name: string;
        last_name: string;
        phone: string;
        address: string;
        city: string;
        postal_code: string;
    };
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast({
                    title: "Authentication required",
                    description: "Please log in to view your orders",
                    variant: "destructive",
                });
                navigate("/");
                return;
            }

            const data = await getUserOrders();
            console.log("Orders data:", data); // Debug log
            setOrders(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error("Error fetching orders:", error);
            if (error.response?.status === 401) {
                toast({
                    title: "Session expired",
                    description: "Please log in again",
                    variant: "destructive",
                });
                localStorage.clear();
                navigate("/");
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load orders. Please try again.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'shipped':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'delivered':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateItemTotal = (item: OrderItem) => {
        return Number(item.price) * Number(item.quantity);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
                <p className="text-muted-foreground mt-2">
                    Track your order history and status
                </p>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="space-y-4">
                            <div className="text-4xl">📦</div>
                            <h3 className="text-xl font-semibold">No orders yet</h3>
                            <p className="text-muted-foreground">
                                When you place your first order, it will appear here.
                            </p>
                            <Button onClick={() => navigate('/products')}>
                                Browse Products
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <Card key={order.ID} className="overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        Order #{order.ID}
                                    </CardTitle>
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Placed on {order.created_at ? formatDate(order.created_at) : 'Date unavailable'}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Order Details</h4>
                                        <div className="space-y-1 text-sm">
                                            <div>Total: <span className="font-semibold">${Number(order.total_price).toFixed(2)}</span></div>
                                            <div>Items: {order.items?.length || 0}</div>
                                            <div className="text-muted-foreground">
                                                Ordered on {order.created_at ? formatDate(order.created_at) : 'Date unavailable'}
                                            </div>
                                        </div>
                                    </div>

                                    {order.address && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Delivery Address</h4>
                                            <div className="space-y-1 text-sm">
                                                <div>{order.address.first_name} {order.address.last_name}</div>
                                                <div>{order.address.phone}</div>
                                                <div className="text-muted-foreground">
                                                    {order.address.address}, {order.address.city} {order.address.postal_code}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {order.items && order.items.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold mb-3">Order Items</h4>
                                            <div className="space-y-3">
                                                {order.items.map((item) => (
                                                    <div key={item.ID} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            {item.product?.images && item.product.images[0] && (
                                                                <img
                                                                    src={item.product.images[0].url.startsWith('data:') 
                                                                        ? item.product.images[0].url 
                                                                        : `http://localhost:8000${item.product.images[0].url}`
                                                                    }
                                                                    alt={item.product.name}
                                                                    className="w-12 h-12 object-cover rounded"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.src = '/placeholder.svg';
                                                                    }}
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="font-medium">
                                                                    {item.product?.name || `Product #${item.product_id}`}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    Quantity: {item.quantity}
                                                                </div>
                                                                <div className="text-sm font-medium">
                                                                    ${Number(item.price).toFixed(2)} each
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold">
                                                                ${calculateItemTotal(item).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator />
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-muted-foreground">
                                        Order #{order.ID}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.ID}`)}>
                                            View Details
                                        </Button>
                                        {order.status === 'pending' && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => {
                                                    // TODO: Implement cancel order functionality
                                                    toast({
                                                        title: "Feature coming soon",
                                                        description: "Order cancellation will be available soon",
                                                    });
                                                }}
                                            >
                                                Cancel Order
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}