import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Building, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      icon: Zap,
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Perfect for trying out our AI video generation",
      features: [
        "3 videos per month",
        "Limited styles available",
        "720p video quality",
        "VideoAI watermark",
        "Basic templates",
        "Community support"
      ],
      cta: "Start Free",
      popular: false,
      className: "glass"
    },
    {
      name: "Pro",
      icon: Crown,
      monthlyPrice: 29,
      yearlyPrice: 24,
      description: "Everything you need for professional video creation",
      features: [
        "Unlimited videos",
        "All styles & templates",
        "4K video quality",
        "No watermark",
        "Custom avatars",
        "Advanced editing tools",
        "Priority support",
        "API access"
      ],
      cta: "Start Pro Trial",
      popular: true,
      className: "glass border-primary/50 animate-glow relative"
    },
    {
      name: "Enterprise",
      icon: Building,
      monthlyPrice: 199,
      yearlyPrice: 159,
      description: "Advanced features for teams and businesses",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Brand customization",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced analytics",
        "SLA guarantee",
        "On-premise deployment"
      ],
      cta: "Contact Sales",
      popular: false,
      className: "glass"
    }
  ];

  const handleSubscribe = (planName: string) => {
    // Navigate to signup with plan selection
    navigate('/signup', { state: { selectedPlan: planName } });
  };

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-20">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 pt-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
                <Crown className="w-4 h-4 text-feature-accent mr-2" />
                <span className="text-sm font-medium">Pricing Plans</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Choose Your Creative
                <span className="block">Journey</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Start free and scale as you grow. All plans include our core AI video generation
                technology with no hidden fees.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4 mb-12">
                <span className={`text-sm ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className="relative glass rounded-full p-1 w-16 h-8"
                >
                  <div className={`absolute top-1 w-6 h-6 bg-primary rounded-full transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                </button>
                <span className={`text-sm ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Yearly <span className="text-feature-accent">(Save 20%)</span>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div key={index} className={`${plan.className} rounded-2xl p-8 ${plan.popular ? 'transform scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-primary to-accent px-6 py-2 rounded-full text-sm font-semibold text-white">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-accent mb-4 mx-auto">
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {isYearly && plan.monthlyPrice > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          ${plan.monthlyPrice}/month
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={plan.popular ? "cta-primary w-full" : "cta-secondary w-full"}
                    onClick={() => handleSubscribe(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="text-center mt-20">
              <h3 className="text-2xl font-bold mb-8">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                <div>
                  <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
                  <p className="text-muted-foreground text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Is there a free trial?</h4>
                  <p className="text-muted-foreground text-sm">Yes! All paid plans come with a 7-day free trial. No credit card required.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                  <p className="text-muted-foreground text-sm">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
                  <p className="text-muted-foreground text-sm">Absolutely! Cancel anytime with no questions asked. No cancellation fees.</p>
                </div>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="text-center mt-12">
              <p className="text-muted-foreground text-sm">
                All plans include SSL security, 99.9% uptime guarantee, and can be cancelled anytime.
              </p>
            </div>
          </div>
        </section>
      </main>


    </div>
  );
};

export default Pricing;