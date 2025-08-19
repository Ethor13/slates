import { useState } from 'react';
import { Mail } from 'lucide-react';

interface FormState {
    name: string;
    email: string;
    company: string;
    message: string;
    honeypot: string; // hidden field
}

const initialState: FormState = {
    name: '',
    email: '',
    company: '',
    message: '',
    honeypot: ''
};

const Contact = () => {
    const [form, setForm] = useState<FormState>(initialState);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string>('');

    const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === 'submitting') return;
        setStatus('submitting');
        setError('');

        if (!form.name || !form.email || !form.company || !form.message) {
            setError('Please fill out all fields');
            setStatus('idle');
            return;
        }
        try {
            const res = await fetch("/contactUs", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error(await res.text());
            setStatus('success');
            setForm(initialState);
        } catch (err: any) {
            setError('Failed to send. Please try again later.');
            setStatus('error');
        }
    };

    return (
        <section id="contact" className="relative pt-12 sm:pt-24 pb-12 w-full bg-gradient-to-b from-slate-medium to-slate-light">
            <div className='flex flex-col mx-5 sm:mx-10 lg:mx-auto sm:flex-row max-w-6xl'>
                <div className='flex-1 sm:mr-5 lg:mr-20 text-center sm:text-left'>
                    <h2 className="text-3xl sm:text-5xl font-bold text-white">
                        Get in Touch
                    </h2>
                    <p className="sm:mt-4 text-md sm:text-lg text-slate-200">
                        Ready to optimize your sports programming? Contact us for a personalized demo and consultation.
                    </p>

                    <div className="mt-8 space-y-6 w-full hidden sm:block">
                        <div className="flex items-center text-xl w-full">
                            <Mail className="h-6 w-6 text-slate-light" />
                            <span className="ml-4 text-white">info@slates.co</span>
                        </div>
                    </div>

                    <div className="mt-12 hidden sm:block">
                        <h3 className="text-3xl font-bold text-white">
                            What happens next?
                        </h3>
                        <div className="mt-4 space-y-4">
                            {[
                                "We'll schedule a call to understand your needs",
                                "Our team will provide a personalized demo",
                                "We'll walk you through setting up your dashboard",
                                "Ongoing support"
                            ].map((step, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-slate-deep flex items-center justify-center font-semibold">
                                        {index + 1}
                                    </div>
                                    <span className="ml-4 text-slate-200">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='flex-1 mt-6 sm:mt-0'>
                    <form onSubmit={submit} className="grid gap-4 bg-slate-800/60 backdrop-blur rounded-xl p-8 border border-slate-700">
                        {/* Honeypot */}
                        <input type="text" name="honeypot" value={form.honeypot} onChange={update} className="hidden" tabIndex={-1} autoComplete="off" />
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-slate-300 mb-1" htmlFor="name">Name *</label>
                            <input id="name" name="name" value={form.name} onChange={update} required className="rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-400 focus:ring-indigo-400 px-3 py-2 text-white outline-none" placeholder="John Doe" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email *</label>
                            <input id="email" name="email" type="email" value={form.email} onChange={update} required className="rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-400 focus:ring-indigo-400 px-3 py-2 text-white outline-none" placeholder="you@example.com" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-slate-300 mb-1" htmlFor="company">Company / Venue</label>
                            <input id="company" name="company" value={form.company} onChange={update} required className="rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-400 focus:ring-indigo-400 px-3 py-2 text-white outline-none" placeholder="The Sports Bar" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-slate-300 mb-1" htmlFor="message">Message *</label>
                            <textarea id="message" name="message" value={form.message} onChange={update} required rows={5} className="rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-400 focus:ring-indigo-400 px-3 py-2 text-white outline-none resize-y" placeholder="Tell us what you're looking for..." />
                        </div>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        {status === 'success' && <p className="text-sm text-emerald-400">Message sent! We'll be in touch soon.</p>}
                        <div className="flex justify-end">
                            <button type="submit" disabled={status === 'submitting'} className="inline-flex items-center justify-center rounded-md slate-gradient slate-gradient-hover disabled:opacity-50 px-6 py-2.5 font-semibold text-white transition">
                                {status === 'submitting' ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
