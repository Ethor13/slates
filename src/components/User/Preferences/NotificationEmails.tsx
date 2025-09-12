import React, { useState } from 'react';
import { X, Mail, User as UserIcon, Briefcase } from 'lucide-react';
import type { NotificationRecipient } from '../../../contexts/AuthContext';

interface NotificationEmailsProps {
    notificationEmails: NotificationRecipient[];
    onChange: (emails: NotificationRecipient[]) => void;
}

const NotificationEmails: React.FC<NotificationEmailsProps> = ({
    notificationEmails,
    onChange
}) => {
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPosition, setNewPosition] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [positionError, setPositionError] = useState<string | null>(null);
    const MAX_EMAILS = 5;

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleAddEmail = () => {
        if (notificationEmails.length >= MAX_EMAILS) {
            setEmailError(`You can add up to ${MAX_EMAILS} emails`);
            return;
        }
        if (!newEmail.trim()) {
            setEmailError('Please enter an email address');
            return;
        }

        if (!isValidEmail(newEmail.trim())) {
            setEmailError('Please enter a valid email address');
            return;
        }

        const email = newEmail.trim().toLowerCase();

        if (notificationEmails.some(r => r.email.toLowerCase() === email)) {
            setEmailError('This email is already added');
            return;
        }

        // Validate required name & position
        const name = newName.trim();
        const position = newPosition.trim();
        let hasError = false;
        if (!name) {
            setNameError('Please enter a name');
            hasError = true;
        }
        if (!position) {
            setPositionError('Please enter a position');
            hasError = true;
        }
        if (hasError) return;

        const recipient: NotificationRecipient = { email, name, position };
        onChange([...notificationEmails, recipient]);
        setNewEmail('');
        setNewName('');
        setNewPosition('');
        setEmailError(null);
        setNameError(null);
        setPositionError(null);
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        onChange(notificationEmails.filter(r => r.email !== emailToRemove));
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

    const handleNameChange = (value: string) => {
        setNewName(value);
        if (nameError) setNameError(null);
    };

    const handlePositionChange = (value: string) => {
        setNewPosition(value);
        if (positionError) setPositionError(null);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                    Add email addresses to receive a daily notification with a link to your personalized Slates dashboard
                </div>

                {/* Add recipient inputs */}
                <div className="w-full flex flex-row gap-2">
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Full name"
                                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${nameError
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    disabled={notificationEmails.length >= MAX_EMAILS}
                                />
                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newPosition}
                                    onChange={(e) => handlePositionChange(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Role"
                                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${positionError
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    disabled={notificationEmails.length >= MAX_EMAILS}
                                />
                                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            {positionError && <p className="text-xs text-red-600 mt-1">{positionError}</p>}
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Email address"
                                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${emailError
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    disabled={notificationEmails.length >= MAX_EMAILS}
                                />
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                        </div>
                        <div className="h-full min-w-max flex flex-col justify-center items-center">
                            <button
                                onClick={handleAddEmail}
                                disabled={!newEmail.trim() || !newName.trim() || !newPosition.trim() || !isValidEmail(newEmail.trim()) || notificationEmails.length >= MAX_EMAILS}
                                className="w-full h-[42px] px-4 py-2 slate-gradient font-medium text-sm text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <span>{notificationEmails.length >= MAX_EMAILS ? 'Limit Reached' : 'Add Recipient'}</span>
                            </button>
                            {notificationEmails.length < MAX_EMAILS && (
                                <p className="text-xs text-gray-500">{MAX_EMAILS - notificationEmails.length} remaining</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Email list */}
            {notificationEmails.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-md font-medium text-black">
                        Notification Recipients:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {notificationEmails.map((recipient, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border gap-3"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex flex-col min-w-0">
                                        {(recipient.name || recipient.position) ? (
                                            <div className="flex items-center gap-2 min-w-0">
                                                <UserIcon size={16} className="text-gray-500 flex-shrink-0" />
                                                {recipient.name && (
                                                    <span className="text-sm text-gray-500 truncate">
                                                        {recipient.name}
                                                    </span>
                                                )}
                                                {recipient.position && (
                                                    <>
                                                        <span className="text-xs text-gray-500 truncate">•</span>
                                                        <span className="text-xs text-gray-500 truncate">{recipient.position}</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Mail size={16} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-sm text-gray-500 truncate">{recipient.email}</span>
                                            </div>
                                        )}
                                        {(recipient.name || recipient.position) && (
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Mail size={16} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-xs text-gray-500 truncate">{recipient.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveEmail(recipient.email)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
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
                    <p className="text-sm">No recipients added yet</p>
                </div>
            )}
        </div>
    );
};

export default NotificationEmails;
