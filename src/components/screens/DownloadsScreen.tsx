import React, { useState, useEffect } from 'react';
import { Download, FileCode, Smartphone, Terminal, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Archive, Loader2 } from 'lucide-react';
import { DownloadItem, SystemSettings } from '../../types';
import { getAppConfig, subscribeAppConfig } from '../../services/api';
import { createAndroidProjectZip } from '../../services/androidProjectGenerator';

export const DownloadsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Android' | 'Panel' | 'Tools'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [config, setConfig] = useState<SystemSettings>(getAppConfig());
  const [notice, setNotice] = useState<string | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAppConfig((newCfg) => {
      setConfig(newCfg);
    });
    return () => unsubscribe();
  }, []);

  // Dynamic download items populated exclusively from backend/owner configuration
  const downloads: DownloadItem[] = [
    {
      id: 'dsc-android-source-zip',
      title: 'DSCWeb Android Studio Project Source (.zip)',
      category: 'Android',
      version: 'v1.0.0 (Source Archive)',
      size: '2.4 MB',
      date: '2026-09-11',
      downloadUrl: 'source-zip',
      changelog: [
        'Complete native Kotlin and Jetpack Compose Android Studio project',
        'Pre-configured Gradle 8.7 & AGP 8.8 buildable setup',
        'Hardware Keystore encryption token store + Retrofit 2 client',
        'Ready to extract and build via ./gradlew assembleDebug',
      ],
    },
    {
      id: 'dsc-android-client',
      title: 'DSCWeb Android Native Client',
      category: 'Android',
      version: 'v1.0.0 (Release Build)',
      size: '28.4 MB',
      date: '2026-09-10',
      downloadUrl: config.downloadLink || config.apkUrl || '',
      changelog: [
        'Initial official Android native Jetpack Compose release',
        'Direct DSCAuth integration with hardware Keystore token store',
        'User, Admin, and Owner centers with real-time sync',
        'Dark-first high-contrast Material 3 interface',
      ],
    },
    {
      id: 'dsc-free-panel-apk',
      title: 'DSC Free Panel Companion (Android)',
      category: 'Android',
      version: 'v2.4.1',
      size: '14.2 MB',
      date: '2026-09-08',
      downloadUrl: config.freeLink || '',
      changelog: [
        'Live slot availability detector',
        'Automatic credentials autofill',
        'Low battery consumption background sync',
      ],
    },
    {
      id: 'dsc-panel-desktop',
      title: 'DSC Security Suite Panel (Windows)',
      category: 'Panel',
      version: 'v4.1.0-Win64',
      size: '42.8 MB',
      date: '2026-08-25',
      downloadUrl: '',
      changelog: [
        'Kernel driver signature refresh',
        'Hardware ID dynamic generator',
        'Zero-latency proxy tunneling module',
      ],
    },
    {
      id: 'dsc-device-checker',
      title: 'DSC Device Diagnostic Utility',
      category: 'Tools',
      version: 'v1.1.2',
      size: '3.6 MB',
      date: '2026-07-30',
      downloadUrl: '',
      changelog: [
        'Extracts device diagnostic telemetry safely without root',
        'Exports diagnostic report directly to clipboard',
      ],
    },
  ];

  const filtered = activeCategory === 'All' ? downloads : downloads.filter((d) => d.category === activeCategory);

  const handleDownload = async (item: DownloadItem) => {
    if (item.downloadUrl === 'source-zip') {
      try {
        setIsGeneratingZip(true);
        const zipBlob = await createAndroidProjectZip();
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'DSCWeb-Android-Studio-Project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to generate project ZIP:', err);
        setNotice('Failed to generate Android project archive.');
      } finally {
        setIsGeneratingZip(false);
      }
      return;
    }

    if (!item.downloadUrl || item.downloadUrl.trim() === '') {
      setNotice(`Download for "${item.title}" is currently unavailable. No link has been configured by the owner.`);
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    const link = document.createElement('a');
    link.href = item.downloadUrl;
    link.download = `${item.id}.apk`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Notice notification */}
      {notice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121623] to-[#0c0f18] border border-[#232c45]">
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Download Center</h2>
        </div>
        <p className="text-xs text-slate-400">
          Official builds, signed Android packages (.apk), companion utilities, and panel software directly from Dark Skull Corporation.
        </p>

        {/* Filter Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(['All', 'Android', 'Panel', 'Tools'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-[#181d2c] border border-[#27324c] text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Downloads List */}
      <div className="flex flex-col gap-3">
        {filtered.map((item) => {
          const isExp = expandedId === item.id;
          const isAvailable = Boolean(item.downloadUrl && item.downloadUrl.trim() !== '');

          return (
            <div
              key={item.id}
              className="rounded-xl bg-[#121623] border border-[#21283d] overflow-hidden transition-all duration-200"
            >
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      {item.downloadUrl === 'source-zip' ? (
                        <Archive className="w-5 h-5" />
                      ) : (
                        <>
                          {item.category === 'Android' && <Smartphone className="w-5 h-5" />}
                          {item.category === 'Panel' && <FileCode className="w-5 h-5" />}
                          {item.category === 'Tools' && <Terminal className="w-5 h-5" />}
                        </>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-400">{item.version}</span>
                        <span>•</span>
                        <span>{item.size}</span>
                        <span>•</span>
                        {isAvailable ? (
                          <span className="text-emerald-400 font-semibold">Active</span>
                        ) : (
                          <span className="text-amber-400">Link Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                </div>

                {/* Changelog Accordion */}
                {isExp && (
                  <div className="mt-3 pt-3 border-t border-[#1e2538] flex flex-col gap-1.5 animate-fadeIn">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Release Changelog
                    </span>
                    {item.changelog.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Row */}
                <div className="mt-3 pt-2.5 border-t border-[#1e2538] flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(isExp ? null : item.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <span>{isExp ? 'Less' : 'Changelog'}</span>
                    {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isAvailable ? (
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={item.downloadUrl === 'source-zip' && isGeneratingZip}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {item.downloadUrl === 'source-zip' ? (
                        isGeneratingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {item.downloadUrl === 'source-zip'
                          ? (isGeneratingZip ? 'Generating ZIP...' : 'Download Project (.zip)')
                          : 'Download Package'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/60 font-medium text-xs hover:bg-slate-800 hover:text-slate-300 transition-all"
                      title="Download link has not been configured by owner"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400/80" />
                      <span>Download Unavailable</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
