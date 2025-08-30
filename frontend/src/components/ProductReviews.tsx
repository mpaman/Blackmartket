import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: number;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      userName: "สมชาย ใจดี",
      rating: 5,
      comment: "สินค้าดีมาก คุณภาพเกินราคา จัดส่งเร็ว แพ็คของดี แนะนำเลยครับ",
      date: "2024-01-15",
      helpful: 12,
      verified: true
    },
    {
      id: 2,
      userName: "มาลี สวยงาม",
      rating: 4,
      comment: "สินค้าตรงตามรูป คุณภาพดี แต่จัดส่งช้าไปนิดหน่อย โดยรวมโอเค",
      date: "2024-01-10",
      helpful: 8,
      verified: true
    },
    {
      id: 3,
      userName: "ปิติ มีความสุข",
      rating: 5,
      comment: "ของแท้ 100% ขอบคุณร้านค้าครับ ประทับใจมาก จะกลับมาซื้ออีกแน่นอน",
      date: "2024-01-05",
      helpful: 15,
      verified: false
    }
  ]);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });

  const [showReviewForm, setShowReviewForm] = useState(false);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );

  const handleSubmitReview = () => {
    if (!newReview.comment.trim()) {
      toast({
        title: "กรุณาเขียนรีวิว",
        description: "กรุณาเขียนความคิดเห็นเกี่ยวกับสินค้า",
        variant: "destructive"
      });
      return;
    }

    const review: Review = {
      id: reviews.length + 1,
      userName: "คุณ", // In real app, this would come from user context
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0],
      helpful: 0,
      verified: false
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: "" });
    setShowReviewForm(false);

    toast({
      title: "รีวิวสำเร็จ",
      description: "ขอบคุณสำหรับรีวิวของคุณ",
    });
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClass = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4";
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">รีวิวสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                {renderStars(Math.round(averageRating), "lg")}
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-gray-600">จากทั้งหมด {reviews.length} รีวิว</p>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating, index) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span>{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ 
                        width: `${reviews.length > 0 ? (ratingCounts[index] / reviews.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-gray-600 w-8">{ratingCounts[index]}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Write Review Button */}
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              เขียนรีวิว
            </Button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="border-green-200">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">คะแนน</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="hover:scale-110 transition-transform"
                        title={`ให้คะแนน ${star} ดาว`}
                        aria-label={`ให้คะแนน ${star} ดาว`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReview.rating 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">ความคิดเห็น</label>
                  <Textarea
                    placeholder="แบ่งปันประสบการณ์การใช้งานสินค้านี้..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button 
                    onClick={handleSubmitReview}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    ส่งรีวิว
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">รีวิวจากลูกค้า</h3>
            
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ยังไม่มีรีวิว</p>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium text-sm">
                            {review.userName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.userName}</span>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                ซื้อแล้ว
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating, "sm")}
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <button className="flex items-center gap-1 hover:text-green-600">
                        <ThumbsUp className="w-3 h-3" />
                        <span>มีประโยชน์ ({review.helpful})</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-gray-700">
                        <ThumbsDown className="w-3 h-3" />
                        <span>ไม่มีประโยชน์</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;