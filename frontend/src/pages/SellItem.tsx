import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createProduct, getAllCategories } from "@/services/api";
import { useCart } from "@/hooks/use-cart";
import { LoginDialog } from "@/components/LoginDialog";
import type { Category } from "@/types/Category";
const SellItem = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isLoggedIn } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [processingImages, setProcessingImages] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: ''
    });

    // Load categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getAllCategories();
                setCategories(response.data || []);
            } catch (error) {
                console.error('Failed to load categories:', error);
                toast({
                    title: "Error",
                    description: "Failed to load categories. Please refresh the page.",
                    variant: "destructive",
                });
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [toast]);



    // Handle successful login
    const handleLoginSuccess = () => {
        setIsLoginOpen(false);
        toast({
            title: "Login Successful",
            description: "You can now create your product listing.",
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isLoggedIn) {
            setIsLoginOpen(true);
            return;
        }

        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Validate file types
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const invalidFiles = files.filter(file => !validTypes.includes(file.type));

            if (invalidFiles.length > 0) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload only JPG, PNG, GIF, or WebP images.",
                    variant: "destructive",
                });
                return;
            }

            // Validate file sizes (5MB max each for base64 storage)
            const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast({
                    title: "File too large",
                    description: "Each image must be less than 5MB for database storage.",
                    variant: "destructive",
                });
                return;
            }

            if (imageFiles.length + files.length > 5) {
                toast({
                    title: "Too many images",
                    description: "You can upload a maximum of 5 images.",
                    variant: "destructive",
                });
                return;
            }

            setProcessingImages(true);

            try {
                // Create preview URLs for immediate display
                const newPreviews = files.map(file => URL.createObjectURL(file));
                
                setImageFiles([...imageFiles, ...files]);
                setImagePreviews([...imagePreviews, ...newPreviews]);

                toast({
                    title: "Images added",
                    description: `${files.length} image(s) added successfully.`,
                });
            } catch (error) {
                console.error('Error processing images:', error);
                toast({
                    title: "Error",
                    description: "Failed to process images. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setProcessingImages(false);
            }
        }
    };

    const removeImage = (index: number) => {
        // Revoke the preview URL to free memory
        URL.revokeObjectURL(imagePreviews[index]);
        
        setImageFiles(imageFiles.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    // Convert all images to base64 for database storage
    const convertImagesToBase64 = async (): Promise<Array<{url: string, alt: string}>> => {
        const base64Images: Array<{url: string, alt: string}> = [];
        
        for (let i = 0; i < imageFiles.length; i++) {
            try {
                const base64String = await fileToBase64(imageFiles[i]);
                base64Images.push({
                    url: base64String,
                    alt: `${formData.name} - Image ${i + 1}`
                });
            } catch (error) {
                console.error(`Error converting image ${i + 1} to base64:`, error);
                throw new Error(`Failed to process image ${i + 1}`);
            }
        }
        
        return base64Images;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            setIsLoginOpen(true);
            return;
        }

        // Validate form
        if (!formData.name || !formData.description || !formData.price || !formData.category_id) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        if (imageFiles.length === 0) {
            toast({
                title: "No Images",
                description: "Please upload at least one image of your item.",
                variant: "destructive",
            });
            return;
        }

        if (parseFloat(formData.price) <= 0) {
            toast({
                title: "Invalid Price",
                description: "Price must be greater than 0.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert images to base64
            toast({
                title: "Processing images...",
                description: "Converting images for database storage.",
            });

            const base64Images = await convertImagesToBase64();

            // Create product data
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category_id: parseInt(formData.category_id),
                images: base64Images
            };

            console.log('Sending product data with base64 images:', {
                ...productData,
                images: productData.images.map((img, i) => ({
                    ...img,
                    url: `base64 string (${Math.round(img.url.length / 1024)}KB) - Image ${i + 1}`
                }))
            });

            toast({
                title: "Creating product...",
                description: "Saving your product to the database.",
            });

            interface CreateProductResponse {
                product: {
                    ID: number;
                };
            }

            const response = await createProduct(productData) as { data: CreateProductResponse };

            toast({
                title: "Product Listed Successfully!",
                description: "Your item is now available for sale.",
            });

            // Clean up preview URLs
            imagePreviews.forEach(url => URL.revokeObjectURL(url));

            // Clear form
            setFormData({
                name: '',
                description: '',
                price: '',
                category_id: ''
            });
            setImageFiles([]);
            setImagePreviews([]);

            // Navigate to the product detail page if we have the product ID
            if (response.data && response.data.product && response.data.product.ID) {
                setTimeout(() => {
                    navigate(`/product/${response.data.product.ID}`);
                }, 1500);
            } else {
                // Fallback to products page
                setTimeout(() => {
                    navigate('/products');
                }, 1500);
            }

        } catch (error: any) {
            console.error('Product creation error:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to list your item. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Clean up preview URLs on component unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="mr-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                        <h1 className="text-2xl font-bold text-green-600">Sell Your Item</h1>
                        
                        {/* Show login status */}
                        <div className="ml-auto">
                            {isLoggedIn ? (
                                <span className="text-sm text-green-600">✓ Logged in</span>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsLoginOpen(true)}
                                    className="border-green-600 text-green-600"
                                >
                                    Login to Sell
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!isLoggedIn ? (
                    // Show login prompt if not logged in
                    <Card className="w-full max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle className="text-center">Login Required</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-600 mb-4">
                                You need to be logged in to sell items on JuPiShop.
                            </p>
                            <div className="space-y-2">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => setIsLoginOpen(true)}
                                >
                                    Login to Continue
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate('/')}
                                >
                                    Back to Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    // Show the form if logged in
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Product Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter a clear, descriptive name for your item"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe your item in detail. Include condition, features, and any important information buyers should know."
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="price">Price (฿) *</Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="category">Category *</Label>
                                        <Select
                                            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                            disabled={loadingCategories}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={loadingCategories ? "Loading categories..." : "Select a category"}
                                                />
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
                            </CardContent>
                        </Card>

                        {/* Product Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Images *</CardTitle>
                                <p className="text-sm text-gray-600">
                                    Upload up to 5 high-quality images of your item (JPG, PNG, GIF, WebP - max 5MB each)
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Image Upload */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="mt-4">
                                            <label htmlFor="images" className="cursor-pointer">
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Click to upload images
                                                </span>
                                                <span className="mt-1 block text-sm text-gray-600">
                                                    JPG, PNG, GIF, WebP up to 5MB each (stored as base64)
                                                </span>
                                            </label>
                                            <input
                                                id="images"
                                                name="images"
                                                type="file"
                                                multiple
                                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={processingImages || isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Image Preview */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                    title="Remove image"
                                                    disabled={processingImages || isSubmitting}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                                    {Math.round(imageFiles[index]?.size / 1024)}KB
                                                </div>
                                            </div>
                                        ))}

                                        {imagePreviews.length < 5 && (
                                            <label htmlFor="images" className="cursor-pointer">
                                                <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400">
                                                    <Plus className="w-8 h-8 text-gray-400" />
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                )}

                                {processingImages && (
                                    <div className="text-center py-4">
                                        <div className="inline-flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                            <span className="text-sm text-gray-600">Processing images...</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/')}
                                disabled={isSubmitting || processingImages}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={isSubmitting || processingImages || loadingCategories}
                            >
                                {isSubmitting ? "Creating Product..." :
                                    processingImages ? "Processing Images..." :
                                        "List Item for Sale"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Login Dialog */}
            <LoginDialog 
                open={isLoginOpen} 
                onOpenChange={setIsLoginOpen}
            />
        </div>
    );
};

export default SellItem;