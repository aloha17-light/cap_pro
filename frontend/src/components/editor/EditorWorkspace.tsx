'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Settings, UploadCloud, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, Bookmark, Trophy } from 'lucide-react';
import api from '@/lib/api';

interface EditorWorkspaceProps {
  problemId: string;
}

const LANGUAGES = [
  { id: 'PYTHON', name: 'Python 3', defaultCode: 'def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()' },
  { id: 'CPP', name: 'C++', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}' },
  { id: 'JAVA', name: 'Java', defaultCode: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}' },
  { id: 'C', name: 'C', defaultCode: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}' },
];

export default function EditorWorkspace({ problemId }: EditorWorkspaceProps) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(language.defaultCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Phase 5 AI Evaluator State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);

  // Phase 6 Spaced Repetition State
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Sync editor when language changes
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = LANGUAGES.find(l => l.id === e.target.value) || LANGUAGES[0];
    setLanguage(selected);
    setCode(selected.defaultCode);
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;
    
    setIsExecuting(true);
    setExecutionResult(null);
    setAiFeedback(null); // Clear previous AI feedback on new run
    setError(null);

    try {
      const res = await api.post(`/submissions/${problemId}`, {
        sourceCode: code,
        language: language.id,
      });
      setExecutionResult(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Execution failed. Execution engine might be offline.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAskAI = async () => {
    if (!executionResult?.submissionId) return;

    setIsEvaluating(true);
    setError(null);

    try {
      const res = await api.post(`/submissions/${executionResult.submissionId}/evaluate`);
      setAiFeedback(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'AI Evaluator failed to respond.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handlePinForReview = async () => {
    if (isBookmarked) return; // Prevent spamming
    setIsBookmarking(true);
    setError(null);

    try {
      await api.post('/reviews', {
        problemId: problemId,
        interval: 'TWO_WEEKS' // Default to 2 weeks for MVP
      });
      setIsBookmarked(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule review.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const monacoLanguageId = language.id === 'CPP' || language.id === 'C' ? 'cpp' : language.name.toLowerCase().replace(' 3', '');

  // Helper for rendering verdict colors
  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'ACCEPTED': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'WRONG_ANSWER': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'TIME_LIMIT_EXCEEDED': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'COMPILATION_ERROR': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'ACCEPTED': return <CheckCircle2 size={14} />;
      case 'WRONG_ANSWER': return <XCircle size={14} />;
      case 'TIME_LIMIT_EXCEEDED': return <Clock size={14} />;
      case 'COMPILATION_ERROR': return <AlertTriangle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 border-l border-gray-800">
      
      {/* Top Toolbar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        
        {/* Left Side: Language & Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1">
            <span className="text-xs text-gray-500 font-medium ml-1">LANG:</span>
            <select 
              value={language.id} 
              onChange={handleLanguageChange}
              className="bg-transparent text-sm text-gray-300 font-semibold focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-gray-900 text-gray-300">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Phase 6: Spaced Repetition Bookmark */}
          <button 
            onClick={handlePinForReview}
            disabled={isBookmarking || isBookmarked}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              isBookmarked 
                ? 'text-yellow-500 bg-yellow-500/10 cursor-default' 
                : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-800'
            }`}
            title="Schedule problem for future review"
          >
            {isBookmarking ? (
              <Loader2 size={18} className="animate-spin text-yellow-500" />
            ) : (
              <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
            )}
          </button>

          <button className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors" title="Settings">
            <Settings size={18} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors" title="Reset Code to Default" onClick={() => setCode(language.defaultCode)}>
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          
          {executionResult && (
            <button 
              onClick={handleAskAI}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
            >
              {isEvaluating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-400" />}
              {isEvaluating ? 'Analyzing...' : 'Ask AI Tutor'}
            </button>
          )}

          <button 
            onClick={handleRunCode}
            disabled={isExecuting || isEvaluating}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors border ${
              isExecuting 
                ? 'bg-gray-800 text-gray-500 border-gray-800' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
          >
            {isExecuting ? <Loader2 size={16} className="animate-spin text-green-500" /> : <Play size={16} className="text-green-400" />}
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
            <UploadCloud size={16} />
            Submit
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 w-full bg-[#1e1e1e] relative">
        <Editor
          height="100%"
          width="100%"
          language={monacoLanguageId}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            lineHeight: 24,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 16 },
            roundedSelection: true,
            formatOnPaste: true,
          }}
          loading={
            <div className="flex h-full items-center justify-center text-gray-500 gap-3">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              Loading Editor Workspace...
            </div>
          }
        />
      </div>

      {/* Console Drawer */}
      <div className="h-64 bg-gray-900 border-t border-gray-800 shrink-0 flex flex-col">
        <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs font-semibold tracking-wider text-gray-500 uppercase">
          <span className="flex items-center gap-2">
            Execution Console
            {executionResult && (
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${getVerdictStyle(executionResult.verdict)}`}>
                {getVerdictIcon(executionResult.verdict)}
                {executionResult.verdict.replace(/_/g, ' ')}
              </span>
            )}
          </span>
          {executionResult && executionResult.runtime !== undefined && (
            <span className="text-gray-400 font-mono tracking-normal normal-case opacity-70">
              {executionResult.runtime}s, {executionResult.memory}KB
            </span>
          )}
        </div>
        <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-y-auto bg-black/40 custom-scrollbar flex flex-col gap-4">
          
          {isExecuting && (
            <div className="text-gray-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-indigo-500" />
              Compiling and evaluating against AI Test Cases...
            </div>
          )}

          {error && (
            <div className="text-red-400 whitespace-pre-wrap">{error}</div>
          )}

          {/* AI Evaluator Feedback Injection */}
          {aiFeedback && !isEvaluating && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 font-sans text-sm animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider mb-3 text-xs border-b border-indigo-500/20 pb-2">
                <Sparkles size={14} className="text-yellow-400" /> AI Code Review
                <span className="ml-auto bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-300">
                  Score: {aiFeedback.score}/100
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/40 rounded border border-gray-800 p-2">
                  <span className="text-xs text-gray-500 uppercase block mb-1 font-bold">Time Complexity</span>
                  <code className="text-indigo-300 font-mono">{aiFeedback.timeComplexity}</code>
                </div>
                <div className="bg-black/40 rounded border border-gray-800 p-2">
                  <span className="text-xs text-gray-500 uppercase block mb-1 font-bold">Space Complexity</span>
                  <code className="text-indigo-300 font-mono">{aiFeedback.spaceComplexity}</code>
                </div>
              </div>

              {aiFeedback.suggestions?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Suggestions</span>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                    {aiFeedback.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {aiFeedback.hints?.length > 0 && (
                <div>
                  <span className="text-xs text-yellow-500 uppercase font-bold block mb-1">Hints</span>
                  <ul className="list-disc pl-5 space-y-1 text-yellow-200/90 italic text-sm">
                    {aiFeedback.hints.map((h: string, i: number) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Judge0 Standard Output & Gamification */}
          {executionResult && !isExecuting && (
            <div className="space-y-4">
              
              {/* GAMIFICATION ELO REWARDS */}
              {executionResult.verdict === 'ACCEPTED' && executionResult.gamification?.status === 'FIRST_BLOOD' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center justify-between mb-4 mt-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" />
                    <span className="text-green-400 font-sans font-bold text-sm tracking-wide">FIRST BLOOD! Perfect Execution.</span>
                  </div>
                  <div className="flex items-center gap-3 font-sans font-bold">
                    <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-500/20 shadow-sm">+ {executionResult.gamification.pointsAwarded} Rating</span>
                    <span className="text-orange-400 text-xs bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20 shadow-sm">🔥 {executionResult.gamification.newStreak} Day Streak</span>
                  </div>
                </div>
              )}

              {/* If it's a compilation error, show standard error output */}
              {executionResult.verdict === 'COMPILATION_ERROR' && (
                <div className="text-red-400 whitespace-pre-wrap">
                  {executionResult.details[0]?.compile_output || 'Unknown compilation error'}
                </div>
              )}

              {/* Otherwise, show standard output for all hidden test cases */}
              {executionResult.verdict !== 'COMPILATION_ERROR' && executionResult.details.map((res: any, idx: number) => (
                <div key={idx} className="pb-3 border-b border-gray-800/50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 uppercase font-bold">Test Case {idx + 1}:</span>
                    <span className={`text-xs font-bold uppercase ${res.status?.id === 3 ? 'text-green-500' : 'text-red-500'}`}>
                      {res.status?.description}
                    </span>
                  </div>
                  {(res.stdout || res.stderr || res.compile_output) && (
                    <div className="bg-[#0a0a0a] p-2 rounded border border-gray-800 mt-1 whitespace-pre-wrap shadow-inner">
                      {res.stdout && <div className="text-gray-400"><span className="text-gray-600 text-[10px] uppercase font-bold block mb-1">Stdout</span>{res.stdout}</div>}
                      {res.stderr && <div className="text-red-400 mt-2"><span className="text-red-900 text-[10px] uppercase font-bold block mb-1">Stderr</span>{res.stderr}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isExecuting && !executionResult && !error && (
            <div className="opacity-50 flex items-center gap-2 text-gray-500">
              <span className="text-indigo-400">~</span>
              <span>$ No output yet. Run your code to test against AI edge cases.</span>
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}
