import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Folder, Download, Terminal } from 'lucide-react';
import { getAndroidProjectFiles } from '../services/androidProjectGenerator';

interface Props {
  onClose: () => void;
}

export const AndroidCodeModal: React.FC<Props> = ({ onClose }) => {
  const projectFiles = getAndroidProjectFiles();
  const fileMap: Record<string, string> = {};
  projectFiles.forEach((f) => {
    fileMap[f.path] = f.content;
  });
  const fileKeys = Object.keys(fileMap);
  const [selectedFile, setSelectedFile] = useState<string>(fileKeys[0] || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (fileMap[selectedFile]) {
      navigator.clipboard.writeText(fileMap[selectedFile]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAll = () => {
    const allCode = Object.entries(fileMap)
      .map(([path, content]) => `// ==========================================\n// FILE: ${path}\n// ==========================================\n\n${content}`)
      .join('\n\n\n');

    const blob = new Blob([allCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DSCWeb-Android-Native-Source.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl h-[88vh] rounded-2xl bg-[#0f121d] border border-[#262e45] shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-slideUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1f263b] flex items-center justify-between bg-[#131724]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Native Android (Kotlin/Compose) Source</h3>
                <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500 text-slate-950 font-bold rounded">
                  READY TO BUILD
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Complete buildable Android Studio project template with Keystore, Retrofit2, and Jetpack Compose.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Code</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Layout: File tree on left, viewer on right */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-[#1f263b] bg-[#111420] overflow-y-auto p-2 flex flex-col gap-1 max-h-40 sm:max-h-full shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3 h-3 text-cyan-400" />
              <span>Project Files</span>
            </div>
            {fileKeys.map((key) => {
              const isSelected = selectedFile === key;
              const fileName = key && typeof key === 'string' ? key.split('/').pop() || key : 'file';
              return (
                <button
                  key={key}
                  onClick={() => setSelectedFile(key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                  title={key}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate">{fileName}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-[#0b0e17] overflow-hidden">
            <div className="px-4 py-2 bg-[#121623] border-b border-[#1f263b] flex items-center justify-between text-xs">
              <span className="font-mono text-cyan-400 truncate">{selectedFile}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-cyan-400 px-2 py-1 rounded bg-slate-800"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-cyan-500/30">
                {fileMap[selectedFile] || '// Select a file from the explorer.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
