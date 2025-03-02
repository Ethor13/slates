import React from 'react';
import { BarChart3, TrendingUp, Users, Map } from 'lucide-react';

const TechnologySection = () => {
  const features = [
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      title: "Game Excitement Prediction",
      description: "Our AI analyzes historical data, team statistics, and player performance to predict game excitement levels."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      title: "Performance Analytics",
      description: "Track team performance trends and historical matchup data to identify high-value broadcasting opportunities."
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Fan Engagement Metrics",
      description: "Monitor social media buzz, ticket sales, and viewer statistics to gauge potential audience interest."
    },
    {
      icon: <Map className="h-6 w-6 text-blue-600" />,
      title: "Local Market Analysis",
      description: "Factor in regional preferences and local team popularity to optimize programming for your specific location."
    }
  ];

  return (
    <section id="technology" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Powered by Advanced Analytics
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Our algorithm combines multiple data points to provide accurate game rankings
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-3xl transform -rotate-3" />
              <div className="relative bg-white p-8 rounded-3xl shadow-xl">
                <div className="space-y-4">
                  <div className="h-2 bg-blue-600 rounded-full w-3/4" />
                  <div className="h-2 bg-blue-400 rounded-full w-1/2" />
                  <div className="h-2 bg-blue-300 rounded-full w-5/6" />
                  <div className="h-2 bg-blue-200 rounded-full w-2/3" />
                </div>
                <div className="mt-8 space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full" />
                        <div className="mt-2 h-2 bg-gray-100 rounded-full w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;