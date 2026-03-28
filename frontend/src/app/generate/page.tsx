'use client';

// =============================================================================
// AI Problem Generator Page
// =============================================================================
// Form allowing users to input a topic and select difficulty.
// Submits to the backend, which proxies to the Python AI service.
// Shows a premium loading animation while LangChain generates the problem.
// =============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const TOPIC_SUGGESTIONS = [
  'Dynamic Programming',
  'Graph Traversal',
  'Binary Search',
  'Sliding Window',
  'Two Pointers',
  'Backtracking',
  'Greedy Algorithms',
];

export default function GeneratePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const { data } = await api.post('/problems/generate', {
        topic: topic.trim(),
        difficulty,
      });

      // Assuming the backend returns { success: true, data: { id: "..." } }
      const problemId = data.data.id;
      
      // Redirect to the newly created problem page
      router.push(`/problems/${problemId}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Failed to generate problem. Note: AI Service might require HUGGINGFACE_API_KEY to be set.'
      );
      setIsGenerating(false);
    }
  }

  // Define styling for difficulty buttons
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'EASY': return 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20';
      case 'MEDIUM': return 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20';
      case 'HARD': return 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col pt-20 px-4">
      
      {/* Background glow lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Problem Forge</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Generate unique algorithmic challenges tailored perfectly to your skills using Mistral-7B.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {isGenerating ? (
            // Loading State
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-4 border-b-2 border-blue-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl">🧠</span>
                </div>
              </div>
              <h3 className="text-xl font-medium text-white animate-pulse">Forging Your Challenge...</h3>
              <p className="text-gray-400 text-sm text-center max-w-sm">
                The AI is currently designing a novel algorithmic scenario, writing edge cases, and calculating constraints. This usually takes 5-10 seconds.
              </p>
            </div>
          ) : (
            // Input Form
            <form onSubmit={handleGenerate} className="space-y-8">
              
              {/* Topic Definition */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What do you want to practice?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Dynamic Programming on Trees"
                  className="w-full px-4 py-3 bg-gray-950/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-lg"
                  required
                />
                
                {/* Topic Chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {TOPIC_SUGGESTIONS.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTopic(suggestion)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`py-3 px-4 rounded-lg border font-semibold tracking-wide transition-all ${
                        difficulty === level 
                          ? getDifficultyColor(level) 
                          : 'bg-gray-950/50 border-gray-800 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 group"
              >
                Spark Generation
                <svg className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </form>
          )}

        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
          <span>Powered by Mistral-7B via Hugging Face</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}
