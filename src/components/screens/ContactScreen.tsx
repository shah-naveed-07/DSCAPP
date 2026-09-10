import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, Globe, AlertCircle, HelpCircle } from 'lucide-react';

export const ContactScreen: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSubject('');
      setMessage('');
      setEmail('');
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121623] to-[#0c0f18] border border-[#232c45]">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Contact & Support Desk</h2>
        </div>
        <p className="text-xs text-slate-400">
          Reach out to the Dark Skull Corporation engineering and administrative dispatch teams.
        </p>
      </div>

      {/* Direct Channels */}
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href="https://discord.gg/darkskull"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-xl bg-[#131724] border border-[#21283d] hover:border-indigo-500/40 flex flex-col gap-1 transition-all"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">Discord</span>
          </div>
          <span className="text-[11px] text-slate-400">Official Server Support</span>
        </a>

        <a
          href="mailto:support@darkskullcorp.com"
          className="p-3 rounded-xl bg-[#131724] border border-[#21283d] hover:border-cyan-500/40 flex flex-col gap-1 transition-all"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">Email</span>
          </div>
          <span className="text-[11px] text-slate-400">support@darkskullcorp.com</span>
        </a>
      </div>

      {/* Ticket Submission Form */}
      <div className="p-4 rounded-2xl bg-[#121623] border border-[#232c45]">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Dispatch Support Ticket
        </h3>

        {sent ? (
          <div className="p-6 text-center flex flex-col items-center gap-2 text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10" />
            <span className="text-xs font-bold text-white">Ticket Queued Successfully</span>
            <p className="text-[11px] text-slate-400">
              An administrator will review your inquiry within standard SLA timeframes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300">Your Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="License key, payment verification, bug report..."
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Detail your inquiry or device information..."
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Ticket</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
