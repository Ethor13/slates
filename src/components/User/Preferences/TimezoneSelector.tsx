import React, { useEffect } from 'react';

interface TimezoneSelectorProps {
    timezone: string;
    onChange: (timezone: string) => void;
}

// Common US timezones
const TIMEZONE_OPTIONS = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ timezone, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };

    // Auto-detect user's timezone if none is selected
    useEffect(() => {
        if (!timezone) {
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Only auto-set if the detected timezone is one of our supported options
            const isSupported = TIMEZONE_OPTIONS.some(option => option.value === detectedTimezone);
            if (isSupported) {
                onChange(detectedTimezone);
            }
        }
    }, [timezone, onChange]);

    return (
        <div>
            <label htmlFor="timezone" className="block text-sm font-medium">Timezone</label>
            <div className="mt-1">
                <select
                    name="timezone"
                    id="timezone"
                    value={timezone}
                    onChange={handleChange}
                    className="px-3 py-1.5 text-sm bg-white shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100 min-w-[200px]"
                >
                    <option value="">Select timezone...</option>
                    {TIMEZONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default TimezoneSelector;
