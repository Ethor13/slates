import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface FavoriteTeamsProps {
    selectedTeams: Record<string, string>[];
    onToggle: (team: Record<string, string>) => void;
}

const FavoriteTeams: React.FC<FavoriteTeamsProps> = ({ selectedTeams, onToggle }) => {
    const [teams, setTeams] = useState<Record<string, string>[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch teams from Firestore
    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const sportsRef = collection(db, "sports");
                const sportsSnapshot = await getDocs(sportsRef);
                
                const allTeams: Record<string, string>[] = [];
                
                sportsSnapshot.forEach((doc) => {
                    const sport = doc.id;
                    const sportData = doc.data();
                    
                    if (sportData.teams) {
                        Object.entries(sportData.teams).forEach(([teamId, teamData]: [string, any]) => {
                            if (teamData.info && teamData.info.name) {
                                allTeams.push({
                                    id: teamId,
                                    name: teamData.info.name,
                                    logo: teamData.info.logo,
                                    sport
                                });
                            }
                        });
                    }
                });
                
                setTeams(allTeams.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (err) {
                console.error("Error fetching teams:", err);
                setError("Failed to load teams");
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // Filter teams based on search query
    const filteredTeams = teams.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Remove a team from selection
    const removeTeam = (team: Record<string, string>) => {
        onToggle(team);
    };

    return (
        <div>
            <label className="block text-sm font-medium">Favorite Teams</label>
            <p className="text-sm text-gray-500 mb-2">Search and select your favorite teams</p>
            
            {/* Selected teams pills */}
            {selectedTeams.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTeams.map(team => {
                        return (
                            <div key={`${team.sport}-${team.id}`} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                                {team.logo && (
                                    <img 
                                        src={team.logo} 
                                        alt={`${team.name} logo`} 
                                        className="w-4 h-4 mr-1.5 object-contain"
                                    />
                                )}
                                {team.name}
                                <button 
                                    type="button" 
                                    onClick={() => removeTeam(team)}
                                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Search input */}
            <div className="relative mb-4">
                <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for a team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setSearchQuery('')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            
            {loading ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <p className="text-red-500 text-sm">{error}</p>
            ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    {filteredTeams.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No teams found matching your search</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {filteredTeams.map(team => (
                                <li key={`${team.sport}-${team.id}`} className="p-3 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            id={`${team.sport}-${team.id}`}
                                            type="checkbox"
                                            checked={selectedTeams.map(selectedTeam => selectedTeam.id).includes(team.id)}
                                            onChange={() => onToggle(team)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`${team.sport}-${team.id}`} className="ml-3 text-sm cursor-pointer flex-1 flex items-center">
                                            {team.logo && (
                                                <img 
                                                    src={team.logo} 
                                                    alt={`${team.name} logo`} 
                                                    className="w-5 h-5 mr-2 object-contain"
                                                    loading="lazy"
                                                />
                                            )}
                                            {team.name}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default FavoriteTeams;