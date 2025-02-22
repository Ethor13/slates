import React from 'react';
import { DollarSign, Users, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    {
      icon: <DollarSign className="h-6 w-6 text-blue-600" />,
      title: "Increased Revenue",
      description: "Optimize your game selection to maximize customer spending and duration of stay."
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Higher Customer Satisfaction",
      description: "Show the games your customers want to see, keeping them engaged and coming back."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      title: "Data-Driven Decisions",
      description: "Make informed choices about programming based on real-time analytics and predictions."
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-blue-600" />,
      title: "Competitive Advantage",
      description: "Stay ahead of other venues by showing the most exciting and relevant games."
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Benefits for Bar Owners
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 lg:mx-auto">
            Transform your sports programming strategy and boost your bottom line
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="relative group flex flex-col"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <div className="relative px-6 py-8 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex flex-col items-center flex-grow">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 text-center">
                    {benefit.title}
                  </h3>
                  <p className="mt-4 text-gray-600 text-center">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-blue-600 rounded-2xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to optimize your sports programming?
              </h3>
              <p className="mt-4 text-lg text-blue-100">
                Join hundreds of successful venues using our platform
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:flex-shrink-0">
              <button className="flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;