import React from 'react';

interface FavoriteTeamsProps {
    selectedTeams: string[];
    onToggle: (team: string) => void;
}

// Sports teams list - simplified for demo purposes
const availableTeams = [
    'Los Angeles Lakers', 'Golden State Warriors', 'Miami Heat', 'Boston Celtics',
    'Kansas City Chiefs', 'Buffalo Bills', 'Green Bay Packers', 'Tampa Bay Buccaneers',
    'New York Yankees', 'Los Angeles Dodgers', 'Boston Red Sox', 'Chicago Cubs'
];

const FavoriteTeams: React.FC<FavoriteTeamsProps> = ({ selectedTeams, onToggle }) => {
    return (
        <div>
            <label className="block text-sm font-medium">Favorite Teams</label>
            <p className="text-sm text-gray-500 mb-2">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTeams.map(team => (
                    <div key={team} className="flex items-center">
                        <input
                            id={`team-${team}`}
                            name={`team-${team}`}
                            type="checkbox"
                            checked={selectedTeams.includes(team)}
                            onChange={() => onToggle(team)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`team-${team}`} className="ml-3 text-sm">
                            {team}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FavoriteTeams;