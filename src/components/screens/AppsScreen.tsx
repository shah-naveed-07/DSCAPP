import React, { useState } from 'react';
import { Star, Download, ExternalLink, QrCode, Brain, ShieldCheck, CheckCircle2, Share2 } from 'lucide-react';
import { AppItem } from '../../types';

export const AppsScreen: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const apps: AppItem[] = [
    {
      id: 'qr-scanner',
      name: 'QR Scanner Pro by DSC',
      category: 'Tools & Utilities',
      rating: 4.8,
      downloads: '50,000+',
      version: 'v3.2.0',
      description:
        'Instantaneous QR and barcode recognition engine with privacy-first zero tracking, flashlight toggle, batch scanning, and history export to CSV/JSON.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.dsc.qrscanner',
      icon: 'qr',
      features: [
        'Sub-100ms camera decode latency',
        'Automatic URL safety & phishing verification',
        'Offline batch scan storage',
        'Dark mode native Jetpack Compose UI',
        'No invasive tracking or background battery drain',
      ],
    },
    {
      id: 'mind-matrix',
      name: 'MindMatrix: Cyber Neural Trainer',
      category: 'Puzzles & Brain Training',
      rating: 4.9,
      downloads: '100,000+',
      version: 'v2.1.4',
      description:
        'Immersive cognitive training suite combining procedural cyber challenges, working memory stimulation, reaction time optimization, and global leaderboards.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.dsc.mindmatrix',
      icon: 'brain',
      features: [
        'Adaptive neuro-puzzle algorithmic engine',
        'Atmospheric cyber synth soundtrack',
        'Daily memory & pattern challenges',
        'Global competitive leaderboards',
        'Full offline playable capability',
      ],
    },
    {
      id: 'dsc-authenticator',
      name: 'DSC Secure Authenticator',
      category: 'Security & 2FA',
      rating: 4.9,
      downloads: '25,000+',
      version: 'v1.4.1',
      description:
        'Encrypted Time-based One-Time Password (TOTP) generator backed by Android Keystore hardware security module with biometric unlock and encrypted offline backup.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.dsc.authenticator',
      icon: 'shield',
      features: [
        'Hardware-backed AES-GCM 256 encryption',
        'Biometric fingerprint & facial recognition lock',
        'Zero cloud sync required - completely offline',
        'Wear OS companion sync support',
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131929] to-[#0c0f18] border border-[#232c45]">
        <h2 className="text-base font-bold text-white">Dark Skull Corporation Apps</h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore our certified native applications on Google Play Store, designed with security, speed, and clean Material 3 architecture.
        </p>
      </div>

      {/* Apps List */}
      <div className="flex flex-col gap-3">
        {apps.map((app) => {
          const isExpanded = selectedApp === app.id;

          return (
            <div
              key={app.id}
              className="rounded-xl bg-[#121623] border border-[#21283d] overflow-hidden transition-all duration-200"
            >
              <div className="p-3.5">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    {app.icon === 'qr' && <QrCode className="w-6 h-6 text-cyan-400" />}
                    {app.icon === 'brain' && <Brain className="w-6 h-6 text-purple-400" />}
                    {app.icon === 'shield' && <ShieldCheck className="w-6 h-6 text-emerald-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white truncate">{app.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">{app.version}</span>
                    </div>
                    <p className="text-[11px] text-cyan-400/90 font-medium mt-0.5">{app.category}</p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{app.rating}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>{app.downloads}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{app.description}</p>

                {/* Features Accordion */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5 animate-fadeIn">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Core Highlights
                    </span>
                    {app.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3.5 pt-2.5 border-t border-[#1f2538] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedApp(isExpanded ? null : app.id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors"
                  >
                    {isExpanded ? 'Hide Specs' : 'View Specs'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: app.name, url: app.playStoreUrl }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(app.playStoreUrl);
                          alert('Play Store link copied to clipboard!');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <a
                      href={app.playStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-cyan-500/20"
                    >
                      <span>Google Play</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
