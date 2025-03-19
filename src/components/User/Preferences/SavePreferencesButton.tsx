import React from 'react';

interface SavePreferencesButtonProps {
    onSave: () => Promise<void>;
    saveStatus: 'idle' | 'saving' | 'success' | 'error';
}

const SavePreferencesButton: React.FC<SavePreferencesButtonProps> = ({ 
    onSave, 
    saveStatus 
}) => {
    return (
        <div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saveStatus === 'saving'}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-deep hover:bg-slate-deep/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {saveStatus === 'saving' ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : 'Save Preferences'}
                </button>
            </div>

            {saveStatus === 'success' && (
                <div className="mt-2 text-sm text-green-600 text-right">
                    Preferences saved successfully!
                </div>
            )}
            
            {saveStatus === 'error' && (
                <div className="mt-2 text-sm text-red-600 text-right">
                    Error saving preferences. Please try again.
                </div>
            )}
        </div>
    );
};

export default SavePreferencesButton;