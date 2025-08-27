import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TimezoneSelector from './Preferences/TimezoneSelector';
import StateSelector from './Preferences/StateSelector';

export default function Onboarding() {
    const { userPreferences, updateUserPreferences, preferencesLoading, userLoading, currentUser } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        venueName: '',
        venueAddress: '',
        venueState: '',
        zipcode: '',
        timezone: '',
        role: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill form if any existing values
    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            firstName: userPreferences.firstName || '',
            lastName: userPreferences.lastName || '',
            venueName: userPreferences.venueName || '',
            venueAddress: userPreferences.venueAddress || '',
            venueState: userPreferences.venueState || '',
            zipcode: userPreferences.zipcode || '',
            timezone: userPreferences.timezone || '',
            role: (userPreferences as any).role || ''
        }));
    }, [userPreferences.firstName, userPreferences.lastName, userPreferences.venueName, userPreferences.venueAddress, userPreferences.venueState, userPreferences.zipcode, userPreferences.timezone, (userPreferences as any).role]);

    // If already initialized, go to dashboard
    useEffect(() => {
        if (!userLoading && !preferencesLoading) {
            if (!currentUser) {
                navigate('/auth');
            } else if (userPreferences.initializedAccount) {
                navigate('/dashboard');
            }
        }
    }, [userLoading, preferencesLoading, userPreferences.initializedAccount, currentUser, navigate]);

    const allProvided = () => {
        return (
            form.firstName.trim() &&
            form.lastName.trim() &&
            form.venueName.trim() &&
            form.venueAddress.trim() &&
            form.venueState.trim() &&
            form.zipcode.trim() &&
            form.timezone.trim() &&
            form.role.trim()
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!allProvided()) {
            setError('This field is required');
            return;
        }
        try {
            setSaving(true);
            await updateUserPreferences({
                ...form,
                initializedAccount: true
            } as any);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to save your details. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (userLoading || preferencesLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-light/10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <img src="/assets/logos/slates.svg" alt="Slates Logo" className="h-24 w-24" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Tell us about you</h2>
                <p className="mt-2 text-center text-sm text-gray-600">We need a few details to personalize your dashboard.</p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-light/20">
                    {error && (
                        <div className="mb-4 text-sm text-red-600">{error}</div>
                    )}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium">First Name</label>
                            <input name="firstName" value={form.firstName} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Last Name</label>
                            <input name="lastName" value={form.lastName} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Venue</label>
                            <input name="venueName" value={form.venueName} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Role</label>
                            <input name="role" value={form.role} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Street Address</label>
                            <input name="venueAddress" value={form.venueAddress} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <StateSelector
                            value={form.venueState}
                            onChange={(v) => setForm((f) => ({ ...f, venueState: v }))}
                            selectClassName="mt-1 px-3 py-2 w-full text-sm bg-white shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100"
                        />
                        <div>
                            <label className="block text-sm font-medium">Zipcode</label>
                            <input name="zipcode" value={form.zipcode} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <TimezoneSelector
                                timezone={form.timezone}
                                onChange={(tz) => setForm((f) => ({ ...f, timezone: tz }))}
                            />
                        </div>
                        <button type="submit" disabled={saving} className="w-full rounded-full bg-slate-deep text-white py-2 disabled:opacity-50">
                            {saving ? 'Saving…' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div >
        </div >
    );
}
