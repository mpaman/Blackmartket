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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/Product";
import type { Category } from "@/types/Category";
import { GetUserProducts, updateProduct, deleteProduct, getAllCategories, isLoggedIn as checkIsLoggedIn } from "@/services/api";

const SellerManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isLoggedIn } = useCart();

    // Form data for editing
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: ''
    });

    // Debug authentication status
    useEffect(() => {
        console.log("=== Authentication Debug ===");
        console.log("useCart isLoggedIn:", isLoggedIn);
        console.log("API isLoggedIn:", checkIsLoggedIn());
        console.log("Token:", localStorage.getItem("token"));
        console.log("User ID:", localStorage.getItem("user_id"));
        console.log("User Name:", localStorage.getItem("user_name"));
        console.log("===========================");
    }, [isLoggedIn]);

    // ใช้การตรวจสอบ login แบบใช้เฉพาะ token (เพราะ user_id อาจจะไม่ได้เก็บไว้)
    const isUserLoggedIn = () => {
        const token = localStorage.getItem("token");
        return !!token; // ใช้เฉพาะ token ในการตรวจสอบ
    };

    // ดึงข้อมูลผลิตภัณฑ์และหมวดหมู่จาก backend
    useEffect(() => {
        const fetchData = async () => {
            const userIsLoggedIn = isUserLoggedIn();
            console.log("User is logged in (token only):", userIsLoggedIn);

            if (!userIsLoggedIn) {
                console.log("User not logged in (no token), redirecting...");
                toast({
                    title: "กรุณาเข้าสู่ระบบ",
                    description: "คุณต้องเข้าสู่ระบบเพื่อเข้าถึงการจัดการผู้ขาย",
                    variant: "destructive",
                });
                navigate('/');
                return;
            }

            try {
                setLoading(true);
                console.log("กำลังดึงข้อมูลผลิตภัณฑ์ของผู้ใช้...");

                // ดึงข้อมูลผลิตภัณฑ์และหมวดหมู่พร้อมกัน
                const [productsResponse, categoriesResponse] = await Promise.all([
                    GetUserProducts(),
                    getAllCategories()
                ]);

                console.log("ผลิตภัณฑ์ที่ได้รับ:", productsResponse.data);
                console.log("หมวดหมู่ที่ได้รับ:", categoriesResponse.data);

                setProducts(productsResponse.data || []);
                setCategories(categoriesResponse.data || []);

                if (productsResponse.data.length === 0) {
                    console.log("ไม่พบผลิตภัณฑ์ของผู้ใช้คนนี้");
                }

            } catch (error: any) {
                console.error('ล้มเหลวในการดึงข้อมูล:', error);
                
                // ถ้าเป็น 401 แสดงว่า token หมดอายุหรือไม่ valid
                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("token_type");
                    localStorage.removeItem("user_id");
                    localStorage.removeItem("user_name");
                    localStorage.removeItem("user_email");
                    localStorage.removeItem("user_profile_image");
                    
                    toast({
                        title: "หมดเวลาเข้าสู่ระบบ",
                        description: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
                        variant: "destructive",
                    });
                    navigate('/');
                    return;
                }

                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: error.response?.data?.error || "ล้มเหลวในการโหลดผลิตภัณฑ์ของคุณ กรุณาลองใหม่อีกครั้ง",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, toast]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ฟังก์ชันแก้ไขผลิตภัณฑ์
    const handleEdit = (product: Product) => {
        console.log('แก้ไขผลิตภัณฑ์:', product);
        setEditingProduct(product);

        setEditFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category_id: (product.category_id || '').toString()
        });
        setIsEditDialogOpen(true);
    };

    // ฟังก์ชันอัปเดตผลิตภัณฑ์
    const handleUpdateProduct = async () => {
        if (!editingProduct) return;

        // ตรวจสอบข้อมูลฟอร์ม
        if (!editFormData.name || !editFormData.description || !editFormData.price || !editFormData.category_id) {
            toast({
                title: "ข้อมูลไม่ครบถ้วน",
                description: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
                variant: "destructive",
            });
            return;
        }

        if (parseFloat(editFormData.price) <= 0) {
            toast({
                title: "ราคาไม่ถูกต้อง",
                description: "ราคาต้องมากกว่า 0",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const updateData = {
                name: editFormData.name,
                description: editFormData.description,
                price: parseFloat(editFormData.price),
                category_id: parseInt(editFormData.category_id),
                images: editingProduct.images || []
            };

            console.log('อัปเดตผลิตภัณฑ์ด้วยข้อมูล:', updateData);

            const response = await updateProduct(editingProduct.ID, updateData);
            console.log('ผลลัพธ์การอัปเดต:', response);

            // อัปเดตผลิตภัณฑ์ใน state
            setProducts(prev => prev.map(p =>
                p.ID === editingProduct.ID
                    ? {
                        ...p,
                        name: updateData.name,
                        description: updateData.description,
                        price: updateData.price,
                        category_id: updateData.category_id,
                        CategoryID: updateData.category_id,
                        category: categories.find(c => c.ID === updateData.category_id)
                    }
                    : p
            ));

            toast({
                title: "อัปเดตผลิตภัณฑ์สำเร็จ",
                description: "ผลิตภัณฑ์ของคุณได้รับการอัปเดตเรียบร้อยแล้ว",
            });

            setIsEditDialogOpen(false);
            setEditingProduct(null);

        } catch (error: any) {
            console.error('ล้มเหลวในการอัปเดตผลิตภัณฑ์:', error);
            toast({
                title: "เกิดข้อผิดพลาด",
                description: error.response?.data?.error || "ล้มเหลวในการอัปเดตผลิตภัณฑ์ กรุณาลองใหม่อีกครั้ง",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ฟังก์ชันลบผลิตภัณฑ์
    const handleDelete = async (productId: number) => {
        if (!isUserLoggedIn()) {
            toast({
                title: "กรุณาเข้าสู่ระบบ",
                description: "คุณต้องเข้าสู่ระบบเพื่อลบผลิตภัณฑ์",
                variant: "destructive",
            });
            return;
        }

        try {
            setDeleting(productId);
            console.log("กำลังลบผลิตภัณฑ์:", productId);

            await deleteProduct(productId);

            // ลบผลิตภัณฑ์จาก state
            setProducts(prev => prev.filter(p => p.ID !== productId));

            toast({
                title: "ลบผลิตภัณฑ์สำเร็จ",
                description: "ผลิตภัณฑ์ของคุณได้รับการลบเรียบร้อยแล้ว"
            });
        } catch (error: any) {
            console.error('ล้มเหลวในการลบผลิตภัณฑ์:', error);
            toast({
                title: "ลบไม่สำเร็จ",
                description: error.response?.data?.error || "ล้มเหลวในการลบผลิตภัณฑ์ กรุณาลองใหม่อีกครั้ง",
                variant: "destructive",
            });
        } finally {
            setDeleting(null);
        }
    };

    const getStatusBadge = (product: Product) => {
        return (
            <Badge variant="default" className="bg-green-100 text-green-800">
                ใช้งานอยู่
            </Badge>
        );
    };

    // คำนวณสถิติ
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    const activeListings = products.length;
    const soldItems = 0; // สามารถใช้งานได้เมื่อมีระบบติดตามคำสั่งซื้อ

    // แสดงข้อความต้องเข้าสู่ระบบ - ใช้ฟังก์ชันตรวจสอบแบบ token เท่านั้น
    if (!isUserLoggedIn()) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">กรุณาเข้าสู่ระบบ</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">
                            คุณต้องเข้าสู่ระบบเพื่อเข้าถึงการจัดการผู้ขาย
                        </p>
                        {/* Debug information */}
                        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
                            <p>Debug: Token: {localStorage.getItem("token") ? "มี" : "ไม่มี"}</p>
                            <p>Debug: User ID: {localStorage.getItem("user_id") || "ไม่มี"}</p>
                            <p>Debug: Token Check: {checkIsLoggedIn() ? "ผ่าน" : "ไม่ผ่าน"}</p>
                        </div>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => navigate('/')}
                        >
                            กลับสู่หน้าแรก
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                                ← กลับสู่หน้าแรก
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">การจัดการผู้ขาย</h1>
                        <div className="flex items-center space-x-4">
                            {/* Debug information in header */}
                            {/* <div className="text-xs text-gray-500 hidden sm:block">
                                ผู้ใช้: {localStorage.getItem("user_name") || "Unknown"} | Token: ✓
                            </div> */}
                            <Button
                                onClick={() => navigate('/sell')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                เพิ่มผลิตภัณฑ์ใหม่
                            </Button>
                        </div>
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
                                    <p className="text-sm font-medium text-gray-600">ผลิตภัณฑ์ทั้งหมด</p>
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
                                    <p className="text-sm font-medium text-gray-600">รายการที่ใช้งานอยู่</p>
                                    <p className="text-2xl font-bold text-gray-900">{activeListings}</p>
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
                                    <p className="text-sm font-medium text-gray-600">มูลค่ารวม</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ฿{totalValue.toLocaleString()}
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
                                    <p className="text-sm font-medium text-gray-600">สินค้าที่ขายแล้ว</p>
                                    <p className="text-2xl font-bold text-gray-900">{soldItems}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>ผลิตภัณฑ์ของฉัน ({products.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="ค้นหาผลิตภัณฑ์ของคุณ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">กำลังโหลดผลิตภัณฑ์ของคุณ...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">
                                    {products.length === 0 ? "คุณยังไม่มีผลิตภัณฑ์ที่ลงประกาศ" : "ไม่พบผลิตภัณฑ์ที่ตรงกับการค้นหา"}
                                </p>
                                <Button
                                    onClick={() => navigate('/sell')}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    ลงประกาศผลิตภัณฑ์แรกของคุณ
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ผลิตภัณฑ์</TableHead>
                                            <TableHead>หมวดหมู่</TableHead>
                                            <TableHead>ราคา</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead>การจัดการ</TableHead>
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
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "/placeholder.svg";
                                                            }}
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
                                                        {product.category?.name || "ไม่มีหมวดหมู่"}
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
                                                            onClick={() => handleEdit(product)}
                                                            title="แก้ไขผลิตภัณฑ์"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    disabled={deleting === product.ID}
                                                                    title="ลบผลิตภัณฑ์"
                                                                >
                                                                    {deleting === product.ID ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>ลบผลิตภัณฑ์</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        คุณแน่ใจหรือไม่ที่จะลบ "{product.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(product.ID)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        ลบ
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

            {/* Edit Product Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>แก้ไขผลิตภัณฑ์</DialogTitle>
                        <DialogDescription>
                            อัปเดตข้อมูลผลิตภัณฑ์ของคุณ หมายเหตุ: ไม่สามารถเปลี่ยนภาพได้ที่นี่
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">ชื่อผลิตภัณฑ์ *</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                placeholder="กรอกชื่อผลิตภัณฑ์"
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-description">คำอธิบาย *</Label>
                            <Textarea
                                id="edit-description"
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                placeholder="กรอกคำอธิบายผลิตภัณฑ์"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-price">ราคา (฿) *</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editFormData.price}
                                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-category">หมวดหมู่ *</Label>
                                <Select
                                    value={editFormData.category_id}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, category_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกหมวดหมู่" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.ID} value={category.ID.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleUpdateProduct}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? "กำลังอัปเดต..." : "อัปเดตผลิตภัณฑ์"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SellerManagement;