import React from 'react';

interface ZipcodeInputProps {
    zipcode: string;
    onChange: (zipcode: string) => void;
}

const ZipcodeInput: React.FC<ZipcodeInputProps> = ({ zipcode, onChange }) => {
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
                    className={`px-3 py-1.5 w-[5rem] text-sm text-center bg-transparent shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100`}
                    placeholder="00000"
                    maxLength={5}
                    pattern="[0-9]*"
                    inputMode="numeric"
                />
            </div>
        </div>
    );
};

export default ZipcodeInput;