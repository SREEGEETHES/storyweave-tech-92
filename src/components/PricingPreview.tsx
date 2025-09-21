import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Building } from "lucide-react";

const PricingPreview = () => {
  const plans = [
    {
      name: "Free",
      icon: Zap,
      price: "$0",
      period: "forever",
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
      price: "$29",
      period: "month",
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
      price: "$199",
      period: "month",
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

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
            <Crown className="w-4 h-4 text-feature-accent mr-2" />
            <span className="text-sm font-medium">Simple Pricing</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose Your Creative
            <span className="block">Journey</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start free and scale as you grow. All plans include our core AI video generation 
            technology with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className="text-muted-foreground">Monthly</span>
            <div className="glass rounded-full p-1">
              <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                Monthly
              </button>
              <button className="px-6 py-2 rounded-full text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
                Yearly (Save 20%)
              </button>
            </div>
            <span className="text-muted-foreground">Yearly</span>
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
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
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
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            All plans include SSL security, 99.9% uptime guarantee, and can be cancelled anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;