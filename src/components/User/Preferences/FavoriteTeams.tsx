import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Search, X } from 'lucide-react';
import { FirebaseImg } from '../../General/FirebaseImg';

interface FavoriteTeamsProps {
    selectedTeams: Record<string, string>[];
    onToggle: (team: Record<string, string>) => void;
}

interface SportTeams {
    sport: string;
    sportName: string;
    teams: Record<string, string>[];
}

const FavoriteTeams: React.FC<FavoriteTeamsProps> = ({ selectedTeams, onToggle }) => {
    const [teamsBySport, setTeamsBySport] = useState<SportTeams[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Group selected teams by sport
    const selectedTeamsBySport = selectedTeams.reduce<Record<string, Record<string, string>[]>>((acc, team) => {
        const sportName = team.sport.toUpperCase();
        if (!acc[sportName]) {
            acc[sportName] = [];
        }
        acc[sportName].push(team);
        return acc;
    }, {});

    // Fetch teams from Firestore
    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const sportsRef = collection(db, "sports");
                const sportsSnapshot = await getDocs(sportsRef);

                const sportTeamGroups: SportTeams[] = [];

                sportsSnapshot.forEach((doc) => {
                    const sport = doc.id;
                    // Skip the "all" document which contains aggregated data
                    if (sport === "all") return;

                    const sportData = doc.data();
                    const sportName = sport.toUpperCase();

                    if (sportData.teams) {
                        const teams = Object.entries(sportData.teams).map(([teamId, teamData]: [any, any]) => ({
                            id: teamId,
                            name: teamData.info.name,
                            logo: teamData.info.logo,
                            sport
                        })).sort((a, b) => a.name.localeCompare(b.name));

                        sportTeamGroups.push({
                            sport,
                            sportName,
                            teams
                        });
                    }
                });

                // Sort sports alphabetically
                sportTeamGroups.sort((a, b) => a.sportName.localeCompare(b.sportName));
                setTeamsBySport(sportTeamGroups);
            } catch (err) {
                console.error("Error fetching teams:", err);
                setError("Failed to load teams");
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // Filter teams based on search query across all sports
    const getFilteredTeams = () => {
        if (!searchQuery) return teamsBySport;

        return teamsBySport
            .map(sportGroup => {
                const filteredTeams = sportGroup.teams.filter(team =>
                    team.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return filteredTeams.length > 0
                    ? { ...sportGroup, teams: filteredTeams }
                    : null;
            })
            .filter((group): group is SportTeams => group !== null);
    };

    const filteredSportGroups = getFilteredTeams();

    // Remove a team from selection
    const removeTeam = (team: Record<string, string>) => {
        onToggle(team);
    };

    return (
        <div>
            <label className="block text-sm font-medium">Favorite Teams</label>
            <p className="text-sm text-gray-500 mb-2">Search and select your favorite teams</p>

            {/* Selected teams by sport */}
            {selectedTeams.length > 0 && (
                <div className="mb-3">
                    {Object.entries(selectedTeamsBySport).map(([sportName, teams]) => (
                        <div key={sportName} className="mb-2 flex flex-row items-center">
                            <div className="text-md font-medium text-gray-700 mr-2">{sportName}: </div>
                            <div className="flex flex-wrap gap-2">
                                {teams.map(team => (
                                    <div key={`${team.sport}-${team.id}`} className="border border-gray-700 text-gray-700 text-sm px-1.5 py-0.5 rounded-full flex items-center">
                                        {team.logo && (
                                            <FirebaseImg
                                                src={team.logo}
                                                alt={`${team.name} logo`}
                                                className="w-5 h-5 mr-1.5 object-contain"
                                            />
                                        )}
                                        {team.name}
                                        <X
                                            className="w-3 h-3 text-gray-700 hover:cursor-pointer ml-1.5 hover:text-red-500"
                                            onClick={() => removeTeam(team)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div className="relative mb-4">
                <Search className="absolute w-4 h-4 left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    className="block pl-9 w-full border border-gray-300 rounded-md px-4 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for a team"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <X
                        className="absolute w-4 h-4 right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setSearchQuery('')}
                    />
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
                    {filteredSportGroups.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No teams found matching your search</p>
                    ) : (
                        <div>
                            {filteredSportGroups.map(sportGroup => (
                                <div key={sportGroup.sport} className="sport-group">
                                    <div className="font-medium text-sm bg-gray-100 px-3 py-1.5 sticky top-0 z-10">
                                        {sportGroup.sportName}
                                    </div>
                                    <ul className="divide-y divide-gray-200">
                                        {sportGroup.teams.map(team => (
                                            <li key={`${team.sport}-${team.id}`} className="p-3 pl-6 hover:bg-gray-50">
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
                                                            <FirebaseImg
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FavoriteTeams;