import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/Product";
import { getAllProducts ,getAllCategories } from "@/services/api";
const SellerManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { toast } = useToast();

    // Mock data for demonstration
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            const mockProducts: Product[] = [
                {
                    ID: 1,
                    name: "iPhone 13 Pro - Used",
                    description: "Excellent condition iPhone 13 Pro",
                    price: 35000,
                    images: [{ ID: 1, url: "/placeholder.svg", productId: 1 }],
                    category_id: 1,
                    user_id: 1,
                    category: { ID: 1, name: "Electronics" }
                },
                {
                    ID: 2,
                    name: "Designer Handbag",
                    description: "Authentic designer handbag in good condition",
                    price: 8500,
                    images: [{ ID: 2, url: "/placeholder.svg", productId: 2 }],
                    category_id: 2,
                    user_id: 1,
                    category: { ID: 2, name: "Fashion" }
                },
                {
                    ID: 3,
                    name: "Coffee Machine",
                    description: "Barely used espresso machine",
                    price: 4200,
                    images: [{ ID: 3, url: "/placeholder.svg", productId: 3 }],
                    category_id: 3,
                    user_id: 1,
                    category: { ID: 3, name: "Home & Garden" }
                }
            ];
            setProducts(mockProducts);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (productId: number) => {
        // Navigate to edit page or open edit modal
        toast({
            title: "Edit Product",
            description: "Edit functionality will be implemented with backend integration"
        });
    };

    const handleDelete = (productId: number) => {
        // Remove product from state (mock deletion)
        setProducts(prev => prev.filter(p => p.ID !== productId));
        toast({
            title: "Product Deleted",
            description: "Your product has been successfully deleted"
        });
    };

    const getStatusBadge = (product: Product) => {
        // Mock status based on product ID
        const statuses = ["Active", "Sold", "Pending"];
        const status = statuses[product.ID % 3];

        const variants = {
            "Active": "default",
            "Sold": "secondary",
            "Pending": "outline"
        } as const;

        return (
            <Badge variant={variants[status as keyof typeof variants]}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/')}
                                className="text-green-600 hover:text-green-700"
                            >
                                ← Back to Home
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
                        <Button
                            onClick={() => navigate('/sell')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Product
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 font-semibold">✓</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Active Listings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {products.filter((_, i) => i % 3 === 0).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">฿</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ฿{products.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <span className="text-yellow-600 font-semibold">$</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Sold Items</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {products.filter((_, i) => i % 3 === 1).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>My Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search your products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading your products...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">
                                    {products.length === 0 ? "You haven't listed any products yet" : "No products match your search"}
                                </p>
                                <Button
                                    onClick={() => navigate('/sell')}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    List Your First Product
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.ID}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={product.images?.[0]?.url || "/placeholder.svg"}
                                                            alt={product.name}
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{product.name}</p>
                                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                                {product.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {product.category?.name || "Uncategorized"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-green-600">
                                                        ฿{product.price.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(product)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(product.ID)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(product.ID)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerManagement;