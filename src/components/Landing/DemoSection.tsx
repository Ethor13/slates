import { useState } from 'react';

const DemoSection = () => {
  const [selectedGame, setSelectedGame] = useState<any>(null);

  const games = [
    {
      id: 1,
      teams: "Lakers vs Warriors",
      time: "8:00 PM",
      score: 98,
      metrics: {
        excitement: 95,
        rivalry: 90,
        localInterest: 85,
        marketImpact: 88
      },
      factors: ["Playoff Implications", "Star Players", "Historic Rivalry"]
    },
    {
      id: 2,
      teams: "Chiefs vs Bills",
      time: "7:30 PM",
      score: 95,
      metrics: {
        excitement: 92,
        rivalry: 85,
        localInterest: 90,
        marketImpact: 87
      },
      factors: ["Division Leaders", "QB Matchup", "Prime Time"]
    },
    {
      id: 3,
      teams: "Yankees vs Red Sox",
      time: "6:00 PM",
      score: 92,
      metrics: {
        excitement: 88,
        rivalry: 95,
        localInterest: 82,
        marketImpact: 85
      },
      factors: ["Classic Rivalry", "Playoff Race", "Sellout Expected"]
    }
  ];

  return (
    <section id="demo" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            See Our Rankings in Action
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Experience how our algorithm ranks tonight's top games
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-gray-900">
                  Live Rankings
                </h3>
                <span className="text-sm text-blue-600">
                  Updated in real-time
                </span>
              </div>
              
              <div className="space-y-4">
                {games.map((game) => (
                  <button
                    key={game.id}
                    className={`w-full p-4 rounded-lg transition-colors duration-200 ${
                      selectedGame?.id === game.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedGame(game)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">
                          {game.teams}
                        </h4>
                        <p className="text-sm text-gray-500">{game.time}</p>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-12 w-12 rounded-full ${
                          game.score >= 95
                            ? 'bg-green-600'
                            : game.score >= 90
                            ? 'bg-blue-600'
                            : 'bg-gray-600'
                        } flex items-center justify-center`}>
                          <span className="text-white font-semibold">
                            {game.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            {selectedGame ? (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Ranking Breakdown
                </h3>
                <div className="space-y-6">
                  {Object.entries(selectedGame.metrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {value as number}/100
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Key Factors
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGame.factors.map((factor: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-2xl p-8 h-full flex items-center justify-center text-gray-500">
                Select a game to see detailed metrics
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;