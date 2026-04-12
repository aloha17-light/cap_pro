'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Editor, { useMonaco } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, SkipBack, ChevronLeft, ChevronRight, SkipForward, Loader2, Code2, Cpu } from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api';

// The default code matching the mock trace
const DEFAULT_CODE = `def factorial(n):
    result = 1
    
    for i in range(1, n + 1):
        result *= i
        
    return result

factorial(5)
`;

interface TraceStep {
  step: number;
  line: number;
  locals: Record<string, any>;
}

export default function VisualizePage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [traceData, setTraceData] = useState<TraceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<any>(null);
  const monaco = useMonaco();
  const decorationIdsRef = useRef<string[]>([]);

  // =========================================================================
  // Monaco Highlight Effect
  // =========================================================================
  useEffect(() => {
    if (!monaco || !editorRef.current || traceData.length === 0) return;

    const currentLine = traceData[currentStepIndex]?.line;
    if (!currentLine) return;

    // Remove previous decorations
    decorationIdsRef.current = editorRef.current.deltaDecorations(
      decorationIdsRef.current,
      [
        {
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-purple-500/20 border-l-[3px] border-purple-500', // Highlight style
          },
        },
      ]
    );
  }, [currentStepIndex, traceData, monaco]);

  // =========================================================================
  // API Call to Generate Trace
  // =========================================================================
  const handleVisualize = async () => {
    setIsGenerating(true);
    setError(null);
    setTraceData([]);
    setCurrentStepIndex(0);

    // Clear existing decorations
    if (editorRef.current && decorationIdsRef.current.length > 0) {
      decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, []);
    }

    try {
      const res = await api.post('/submissions/trace', { sourceCode: code });
      
      if (res.data.success && res.data.data) {
        setTraceData(res.data.data);
      } else {
        setError("Failed to generate execution trace. Invalid response format.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to generate execution trace.");
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================================================================
  // Playback Controls
  // =========================================================================
  const goFirst = () => setCurrentStepIndex(0);
  const goPrev = () => setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setCurrentStepIndex((prev) => Math.min(traceData.length - 1, prev + 1));
  const goLast = () => setCurrentStepIndex(traceData.length - 1);

  // Derive locals for the current step
  const currentLocals = traceData.length > 0 ? traceData[currentStepIndex].locals : {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-300">
      
      {/* Top Navbar */}
      <nav className="h-16 border-b border-gray-800 bg-[#0a0a0a] flex items-center px-6 shrink-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="font-semibold">Back to Dashboard</span>
        </Link>
        
        <div className="mx-auto flex items-center gap-3">
          <Cpu className="text-purple-500" size={24} />
          <h1 className="text-xl font-bold text-white tracking-wide">Memory & Execution Visualizer</h1>
        </div>

        <div className="w-32" /> {/* Spacer to center the title */}
      </nav>

      {/* Main Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Monaco Editor (40%) */}
        <div className="w-full lg:w-[40%] flex flex-col border-r border-gray-800 bg-[#1e1e1e]">
          
          <div className="flex-1 relative">
            <Editor
              height="100%"
              width="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={(e) => { editorRef.current = e; }}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                lineHeight: 26,
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                renderLineHighlight: "none", // We will use our custom line highlight
              }}
            />
          </div>

          <div className="p-4 bg-gray-900 border-t border-gray-800 shrink-0">
            {error && (
              <div className="mb-4 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
            
            <button
              onClick={handleVisualize}
              disabled={isGenerating || !code.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Generating Trace...
                </>
              ) : (
                <>
                  <Play size={18} /> Visualize Execution
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Memory & Execution Trace (60%) */}
        <div className="w-full lg:w-[60%] flex flex-col bg-[#0f0f13]">
          
          {/* Header Controls */}
          <div className="h-20 border-b border-gray-800 bg-[#121217] flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-2">
              <Code2 size={20} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-200">Execution Scope</h2>
            </div>

            {traceData.length > 0 && (
              <div className="flex items-center gap-6">
                
                {/* Playback Buttons */}
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl p-1 shadow-inner">
                  <button onClick={goFirst} disabled={currentStepIndex === 0} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="First Step">
                    <SkipBack size={18} />
                  </button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                  <button onClick={goPrev} disabled={currentStepIndex === 0} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Previous Step">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                  <button onClick={goNext} disabled={currentStepIndex === traceData.length - 1} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Next Step">
                    <ChevronRight size={18} />
                  </button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                  <button onClick={goLast} disabled={currentStepIndex === traceData.length - 1} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Last Step">
                    <SkipForward size={18} />
                  </button>
                </div>

                {/* Step Counter */}
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Step</span>
                  <span className="text-sm font-bold text-purple-400 font-mono">
                    {currentStepIndex + 1} <span className="text-gray-600">/ {traceData.length}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Variables Canvas */}
          <div className="flex-1 overflow-y-auto p-8 relative">
            {traceData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
                <Cpu size={64} className="text-gray-600 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Awaiting Execution Trace</h3>
                <p className="max-w-xs text-sm text-gray-400">
                  Write your Python algorithm on the left and click "Visualize Execution" to watch the memory change.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {Object.entries(currentLocals).map(([key, value]) => (
                    <motion.div
                      key={key}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="bg-[#18181f] border border-gray-700 rounded-2xl p-5 shadow-lg relative overflow-hidden group"
                    >
                      {/* Subtle pulse effect when value updates (handled by React rendering new value) */}
                      <motion.div 
                        key={String(value)}
                        initial={{ opacity: 0.5, backgroundColor: '#a855f7' }}
                        animate={{ opacity: 0, backgroundColor: 'transparent' }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      />
                      
                      <div className="relative z-10 flex flex-col">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Variable</span>
                        <div className="flex items-center justify-between mb-4">
                          <code className="text-lg font-bold text-purple-300 font-mono">{key}</code>
                          <span className="text-xs text-gray-500 bg-black/50 px-2 py-0.5 rounded border border-gray-800">
                            {typeof value}
                          </span>
                        </div>
                        
                        <div className="bg-black/60 rounded-xl p-4 border border-gray-800 shadow-inner">
                          <motion.code 
                            key={String(value)}
                            initial={{ scale: 1.1, color: '#eab308' }}
                            animate={{ scale: 1, color: '#10b981' }}
                            transition={{ duration: 0.3 }}
                            className="text-2xl font-black font-mono block break-words"
                          >
                            {String(value)}
                          </motion.code>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {Object.keys(currentLocals).length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="col-span-full h-32 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl"
                  >
                    <p className="text-gray-500 font-medium">No local variables in current scope.</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
