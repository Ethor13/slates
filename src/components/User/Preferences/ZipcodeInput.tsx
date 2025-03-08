import React from 'react';

interface ZipcodeInputProps {
    zipcode: string;
    onChange: (zipcode: string) => void;
    error: string | null;
}

const ZipcodeInput: React.FC<ZipcodeInputProps> = ({ zipcode, onChange, error }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numericValue = e.target.value.replace(/[^0-9]/g, '');
        onChange(numericValue);
    };

    return (
        <div>
            <label htmlFor="zipcode" className="block text-sm font-medium">Zipcode</label>
            <div className="mt-1">
                <input
                    type="text"
                    name="zipcode"
                    id="zipcode"
                    required
                    value={zipcode}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="Enter your zipcode"
                    maxLength={5}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? "zipcode-error" : undefined}
                />
                {error && (
                    <p className="mt-2 text-sm text-red-600" id="zipcode-error">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ZipcodeInput;