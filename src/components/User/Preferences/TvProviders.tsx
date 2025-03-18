import React from 'react';

interface TvProvidersProps {
    selectedProviders: string[];
    onToggle: (provider: string) => void;
    availableProviders: Record<string, any>;
    loading: boolean;
    hasValidZipcode: boolean;
}

const TvProviders: React.FC<TvProvidersProps> = ({ 
    selectedProviders, 
    onToggle, 
    availableProviders, 
    loading, 
    hasValidZipcode 
}) => {
    return (
        <div>
            <label className="block text-sm font-medium">TV Providers</label>
            <p className="text-sm text-gray-500 mb-2">
                {!hasValidZipcode 
                    ? "Enter a valid zipcode to see providers in your area" 
                    : "Select your TV providers"}
            </p>
            
            {loading ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            ) : hasValidZipcode && Object.keys(availableProviders).length > 0 ? (
                <div className="flex flex-col gap-2">
                    {Object.entries(availableProviders).map(([providerId, provider]) => (
                        <div key={providerId} className="flex items-center">
                            <input
                                id={`provider-${providerId}`}
                                name={`provider-${providerId}`}
                                type="checkbox"
                                checked={selectedProviders.includes(providerId)}
                                onChange={() => onToggle(providerId)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`provider-${providerId}`} className="ml-3 text-sm">
                                {provider.name}
                            </label>
                        </div>
                    ))}
                </div>
            ) : hasValidZipcode ? (
                <p className="text-sm text-gray-500 italic">No providers found for this zipcode</p>
            ) : null}
        </div>
    );
};

export default TvProviders;