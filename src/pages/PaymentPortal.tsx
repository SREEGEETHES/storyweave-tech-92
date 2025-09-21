import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LocationState {
  selectedPlan?: string;
  planType?: 'free' | 'pro';
}

const PaymentPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: CreditCard,
      description: "Visa, Mastercard, American Express"
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: Building2,
      description: "Secure payment processing"
    },
    {
      id: "gpay",
      name: "Google Pay",
      icon: Smartphone,
      description: "Quick payment with Google Pay"
    },
    {
      id: "phonepe",
      name: "PhonePe",
      icon: Smartphone,
      description: "UPI payments via PhonePe"
    },
    {
      id: "paytm",
      name: "Paytm",
      icon: Wallet,
      description: "Digital wallet payments"
    }
  ];

  const handlePayment = (methodId: string) => {
    setSelectedMethod(methodId);
    // Here you would integrate with actual payment processing
    setTimeout(() => {
      alert(`Payment processed via ${paymentMethods.find(m => m.id === methodId)?.name}!`);
      navigate('/dashboard');
    }, 1500);
  };

  const planName = state?.selectedPlan || (state?.planType === 'pro' ? 'Pro' : 'Free');
  const isFreePlan = state?.planType === 'free' || planName === 'Free';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card className="glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isFreePlan ? 'Start Free Account' : `Subscribe to ${planName} Plan`}
              </CardTitle>
              <p className="text-muted-foreground">
                {isFreePlan 
                  ? 'Create your free account to start using VideoAI'
                  : 'Choose your preferred payment method to continue'
                }
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Plan Summary */}
              <div className="glass rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{planName} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {isFreePlan 
                        ? 'Free forever • 3 videos per month'
                        : 'Pro features • Unlimited videos • No watermark'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {isFreePlan ? '$0' : '$29'}
                    </div>
                    <div className="text-sm text-muted-foreground">/month</div>
                  </div>
                </div>
              </div>

              {/* Free Plan Button */}
              {isFreePlan ? (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full cta-primary"
                >
                  Create Free Account
                </Button>
              ) : (
                <>
                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Select Payment Method</h3>
                    
                    {paymentMethods.map((method) => (
                      <Card 
                        key={method.id} 
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedMethod === method.id 
                            ? 'ring-2 ring-primary border-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handlePayment(method.id)}
                      >
                        <CardContent className="flex items-center space-x-4 p-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                            <method.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{method.name}</h4>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          {selectedMethod === method.id && (
                            <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Security Note */}
                  <div className="text-center text-sm text-muted-foreground">
                    🔒 Your payment information is secure and encrypted
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features Reminder */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              What you'll get with your {planName} plan:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {isFreePlan ? (
                <>
                  <span className="glass px-3 py-1 rounded-full">3 videos/month</span>
                  <span className="glass px-3 py-1 rounded-full">Basic templates</span>
                  <span className="glass px-3 py-1 rounded-full">720p quality</span>
                </>
              ) : (
                <>
                  <span className="glass px-3 py-1 rounded-full">Unlimited videos</span>
                  <span className="glass px-3 py-1 rounded-full">4K quality</span>
                  <span className="glass px-3 py-1 rounded-full">No watermark</span>
                  <span className="glass px-3 py-1 rounded-full">Custom avatars</span>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPortal;