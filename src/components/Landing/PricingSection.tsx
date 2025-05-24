import { Check, ArrowRight } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "99",
      description: "Perfect for small bars getting started with data-driven programming",
      features: [
        "Basic game rankings",
        "Weekly trending games",
        "Email support",
        "Basic analytics dashboard"
      ]
    },
    {
      name: "Pro",
      price: "199",
      description: "Advanced features for growing venues",
      features: [
        "Everything in Starter",
        "Real-time rankings updates",
        "Customer behavior analytics",
        "Priority support",
        "Revenue forecasting",
        "Custom recommendations"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "399",
      description: "Full suite of features for large venues and chains",
      features: [
        "Everything in Pro",
        "Multi-location support",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced reporting"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that best fits your venue's needs
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl ${plan.popular
                ? 'bg-blue-600 text-white'
                : 'bg-white'
                } shadow-xl`}
            >
              <div className="h-full p-8 flex flex-col justify-between">
                <div className="flex flex-col items-start gap-4">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="w-full text-sm opacity-90 h-10 flex items-center">{plan.description}</p>
                  <div>
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-lg ml-2">/month</span>
                  </div>
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className={`h-5 w-5 ${plan.popular ? 'text-white' : 'text-blue-600'
                          } mr-3`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  className={`mt-6 w-full py-3 px-6 rounded-lg flex items-center justify-center ${plan.popular
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    } transition-colors duration-200`}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;