import React from 'react';

interface TvProvidersProps {
    selectedProviders: Record<string, string>; // Changed from string[] to Record<string, string>
    onToggle: (providerId: string, providerName: string) => void; // Updated to include provider name
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
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
                    {Object.entries(availableProviders).sort(([, a], [, b]) => {
                        if (a.name < b.name) return -1;
                        if (a.name > b.name) return 1;
                        return 0;
                    }).map(([providerId, provider]) => (
                        <div key={providerId} className="flex items-center">
                            <input
                                id={`provider-${providerId}`}
                                name={`provider-${providerId}`}
                                type="checkbox"
                                checked={Object.keys(selectedProviders).includes(providerId)}
                                onChange={() => onToggle(providerId, provider.name)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`provider-${providerId}`} className="ml-3 text-sm">
                                {provider.name}
                            </label>
                        </div>
                    ))}
                </div>
            ) : hasValidZipcode ? (
                <p className="text-sm text-gray-500 italic">No providers found for the specified zipcode</p>
            ) : null}
        </div>
    );
};

export default TvProviders;