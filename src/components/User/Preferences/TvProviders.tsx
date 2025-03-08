import React from 'react';

interface TvProvidersProps {
    selectedProviders: string[];
    onToggle: (provider: string) => void;
}

// TV providers list - could be expanded or fetched from an API
const availableTvProviders = [
    'DirecTV', 'Dish Network', 'Xfinity', 'Spectrum', 'AT&T TV', 
    'YouTube TV', 'Hulu + Live TV', 'Sling TV', 'FuboTV'
];

const TvProviders: React.FC<TvProvidersProps> = ({ selectedProviders, onToggle }) => {
    return (
        <div>
            <label className="block text-sm font-medium">TV Providers</label>
            <p className="text-sm text-gray-500 mb-2">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableTvProviders.map(provider => (
                    <div key={provider} className="flex items-center">
                        <input
                            id={`provider-${provider}`}
                            name={`provider-${provider}`}
                            type="checkbox"
                            checked={selectedProviders.includes(provider)}
                            onChange={() => onToggle(provider)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`provider-${provider}`} className="ml-3 text-sm">
                            {provider}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TvProviders;