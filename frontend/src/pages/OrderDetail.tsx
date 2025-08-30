import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getOrderById } from "@/services/api";
import { Order } from "@/types/Order";
import { OrderItem } from "@/types/OrderItem";

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (id) {
            fetchOrderDetail(id);
        }
    }, [id]);

    const fetchOrderDetail = async (orderId: string) => {
        try {
            const data = await getOrderById(orderId);
            console.log("Order detail data:", data); // Debug log
            setOrder(data as Order);
        } catch (error: any) {
            console.error("Error fetching order detail:", error);
            toast({
                title: "Error",
                description: "Failed to load order details",
                variant: "destructive",
            });
            // Redirect to orders page if order not found
            if (error.response?.status === 404) {
                navigate("/orders");
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateItemTotal = (item: OrderItem) => {
        return Number(item.price) * Number(item.quantity);
    };

    const calculateOrderSubtotal = (items: OrderItem[]) => {
        return items.reduce((total, item) => total + calculateItemTotal(item), 0);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted rounded w-48"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="h-64 bg-muted rounded"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-32 bg-muted rounded"></div>
                            <div className="h-32 bg-muted rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="space-y-4">
                            <div className="text-4xl">📦</div>
                            <h3 className="text-xl font-semibold">Order not found</h3>
                            <p className="text-muted-foreground">
                                The order you're looking for doesn't exist or you don't have permission to view it.
                            </p>
                            <Button onClick={() => navigate("/orders")}>
                                Back to Orders
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate("/orders")} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Orders
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Order #{order.ID}</h1>
                        <p className="text-muted-foreground">
                            Placed on {order.created_at ? formatDate(order.created_at) : 'Date unavailable'}
                        </p>
                    </div>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items ({order.items?.length || 0} items)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.items && order.items.length > 0 ? (
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.ID} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                {item.product?.images && item.product.images[0] && (
                                                    <img
                                                        src={item.product.images[0].url.startsWith('data:')
                                                            ? item.product.images[0].url
                                                            : `http://localhost:8000${item.product.images[0].url}`
                                                        }
                                                        alt={item.product.name}
                                                        className="w-16 h-16 object-cover rounded"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = '/placeholder.svg';
                                                        }}
                                                    />
                                                )}
                                                <div>
                                                    <h4 className="font-medium">
                                                        {item.product?.name || `Product #${item.product_id}`}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                    <p className="text-sm font-medium">
                                                        ${Number(item.price).toFixed(2)} each
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">
                                                    ${calculateItemTotal(item).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Separator />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-medium">Subtotal:</span>
                                        <span className="font-semibold">
                                            ${calculateOrderSubtotal(order.items).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No items in this order</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Status:</span>
                                <Badge className={getStatusColor(order.status)} variant="secondary">
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Items:</span>
                                <span>{order.items?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Order Date:</span>
                                <span className="text-sm">
                                    {order.created_at ? formatDate(order.created_at) : 'N/A'}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total:</span>
                                <span>${Number(order.total_price).toFixed(2)}</span>
                            </div>
                            {order.status === 'pending' && (
                                <Button
                                    variant="destructive"
                                    className="w-full mt-4"
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
                        </CardContent>
                    </Card>

                    {order.address && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Delivery Address</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="font-medium">
                                        {order.address.first_name} {order.address.last_name}
                                    </div>
                                    {order.address.phone && (
                                        <div className="text-sm text-muted-foreground">
                                            📞 {order.address.phone}
                                        </div>
                                    )}
                                    <div className="text-sm">
                                        📍 {order.address.address}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {order.address.city} {order.address.postal_code}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}