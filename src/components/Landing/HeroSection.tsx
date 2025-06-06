import { ArrowRight, Star } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative pt-20">
      <div className="absolute inset-0 z-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Smart Sports Programming for Maximum Revenue
            </h1>
            <p className="mt-6 text-xl text-gray-300">
              Use data-driven insights to show the right games at the right time.
              Increase customer engagement and boost your revenue with our
              advanced sports game ranking algorithm.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg bg-white hover:ring-2 hover:ring-slate-deep transition-all duration-200 md:py-4 md:text-lg md:px-10">
                Watch Demo
              </button>
              <button className="flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-slate-light slate-gradient-hover md:py-4 md:text-lg md:px-10">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex items-center gap-8">
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=100&h=100&q=80"
                  alt="Happy customers"
                  className="h-12 w-12 rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">500+</p>
                  <p className="text-sm text-white">Venues Trust Us</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-slate-medium flex items-center justify-center border-2 border-yellow-300">
                      <Star className="h-4 w-4 text-yellow-300" />
                    </div>
                  ))}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">4.9/5</p>
                  <p className="text-sm text-white">Customer Rating</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-slate-light/20 rounded-3xl transform rotate-3" />
            <div className="relative bg-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <img src="/assets/logos/slates.svg" alt="Slates Logo" className="h-6 w-6 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Tonight's Top Games</h3>
                </div>
                <span className="text-sm text-slate-medium">Live Rankings</span>
              </div>
              {[
                {
                  teams: "Lakers vs Warriors",
                  time: "8:00 PM",
                  score: 98,
                  factors: ["Rivalry Match", "Playoff Implications"]
                },
                {
                  teams: "Chiefs vs Bills",
                  time: "7:30 PM",
                  score: 95,
                  factors: ["High Stakes", "Local Favorite"]
                },
                {
                  teams: "Yankees vs Red Sox",
                  time: "6:00 PM",
                  score: 42,
                  factors: ["Historic Rivalry"]
                }
              ].map((game, index) => (
                <div key={index} className="mb-4 p-4 bg-slate-light/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{game.teams}</h4>
                      <p className="text-sm text-gray-500">{game.time}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-deep flex items-center justify-center">
                      <span className="text-white font-semibold">{game.score}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {game.factors.map((factor, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-slate-medium/20 text-slate-deep rounded-full">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;