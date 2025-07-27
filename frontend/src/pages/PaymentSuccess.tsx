
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: You could add analytics tracking here
    console.log("Payment successful");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              Thank you for your purchase! Your order has been confirmed and will be processed shortly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Package className="w-5 h-5" />
                <span className="font-medium">Order #JP{Date.now().toString().slice(-6)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>• You will receive an order confirmation email shortly</p>
            <p>• Estimated delivery: 3-5 business days</p>
            <p>• Track your order in your account dashboard</p>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
              // onClick={() => navigate('/orders')}
              onClick={() => navigate('/')}
            >
              View My Orders
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Need help? Contact our support team at support@jupishop.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
