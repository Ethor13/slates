import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';

interface NotificationEmailsProps {
    notificationEmails: string[];
    onChange: (emails: string[]) => void;
}

const NotificationEmails: React.FC<NotificationEmailsProps> = ({ 
    notificationEmails, 
    onChange 
}) => {
    const [newEmail, setNewEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleAddEmail = () => {
        if (!newEmail.trim()) {
            setEmailError('Please enter an email address');
            return;
        }

        if (!isValidEmail(newEmail.trim())) {
            setEmailError('Please enter a valid email address');
            return;
        }

        const email = newEmail.trim().toLowerCase();
        
        if (notificationEmails.includes(email)) {
            setEmailError('This email is already added');
            return;
        }

        onChange([...notificationEmails, email]);
        setNewEmail('');
        setEmailError(null);
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        onChange(notificationEmails.filter(email => email !== emailToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddEmail();
        }
    };

    const handleInputChange = (value: string) => {
        setNewEmail(value);
        if (emailError) setEmailError(null);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                    Add email addresses to receive a daily notification with a link to your personalized Slates dashboard
                </div>
                
                {/* Add email input */}
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Enter email address"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                                    emailError 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                            />
                        </div>
                        <button
                            onClick={handleAddEmail}
                            disabled={!newEmail.trim()}
                            className="w-full sm:w-auto px-4 py-2 slate-gradient font-medium text-sm text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Add Email</span>
                        </button>
                    </div>
                    
                    {emailError && (
                        <p className="text-sm text-red-600">{emailError}</p>
                    )}
                </div>
            </div>

            {/* Email list */}
            {notificationEmails.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-md font-medium text-black">
                        Notification Recipients:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {notificationEmails.map((email, index) => (
                            <div
                                key={index}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border gap-2 sm:gap-0"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-900 break-all sm:truncate">
                                        {email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRemoveEmail(email)}
                                    className="self-end sm:self-auto ml-auto sm:ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                    title="Remove email"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {notificationEmails.length === 0 && (
                <div className="text-center pt-2 text-gray-500">
                    <Mail size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No emails added yet</p>
                </div>
            )}
        </div>
    );
};

export default NotificationEmails;
