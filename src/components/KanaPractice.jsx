import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, LayoutGrid, Brain, Eye, Trophy, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { hiraganaData, katakanaData } from '../data/kana';

const KanaPractice = ({ isOpen, onClose }) => {
  const [type, setType] = useState('hiragana'); // 'hiragana' | 'katakana'
  const [view, setView] = useState('matrix'); // 'matrix' | 'practice'
  const [quizItem, setQuizItem] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const [isRevealed, setIsRevealed] = useState(false);
  const [stats, setStats] = useState({ correct: 0, attempts: 0, totalInPool: 0 });
  const [missedKanas, setMissedKanas] = useState([]);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReviewDropdown, setShowReviewDropdown] = useState(false);
  const poolRef = useRef([]);
  const inputRef = useRef(null);

  const data = type === 'hiragana' ? hiraganaData : katakanaData;
  const vowels = ['a', 'i', 'u', 'e', 'o'];

  const getRomaji = (char, consonant, vowel) => {
    if (char === 'ん' || char === 'ン') return 'n';
    const base = consonant === '-' ? vowel : consonant + vowel;
    return base
      .replace('si', 'shi')
      .replace('ti', 'chi')
      .replace('tu', 'tsu')
      .replace('hu', 'fu')
      .replace('zi', 'ji')
      .replace('di', 'ji')
      .replace('du', 'zu');
  };

  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateNewQuizItem = React.useCallback(() => {
    if (poolRef.current.length === 0) {
      const fullPool = [];
      
      // Add basic
      data.basic.forEach(row => {
        Object.entries(row.vowels).forEach(([v, char]) => {
          if (char) {
            fullPool.push({ kana: char, romaji: getRomaji(char, row.consonant, v) });
          }
        });
      });

      // Add dakuon
      data.dakuon.forEach(row => {
        Object.entries(row.vowels).forEach(([v, char]) => {
          if (char) {
            fullPool.push({ kana: char, romaji: getRomaji(char, row.consonant, v) });
          }
        });
      });

      // Add yoon
      data.yoon.forEach(item => {
        fullPool.push({ kana: item.kana, romaji: item.romaji });
      });

      // Add extended
      if (data.extended && data.extended.length > 0) {
        data.extended.forEach(item => {
          fullPool.push({ kana: item.kana, romaji: item.romaji });
        });
      }

      const shuffled = shuffle(fullPool);
      poolRef.current = shuffled;
      setStats({ correct: 0, attempts: 0, totalInPool: fullPool.length });
      setMissedKanas([]);
      setShowSummary(false);
      setShowReviewDropdown(false);
    }

    const nextItem = poolRef.current.shift();
    setQuizItem(nextItem);
    setUserInput('');
    setFeedback(null);
    setIsRevealed(false);
    setHasFailedCurrent(false);
    if (inputRef.current) inputRef.current.focus();
  }, [data]);

  useEffect(() => {
    poolRef.current = [];
  }, [type]);

  useEffect(() => {
    if (view === 'practice' && !showSummary) {
      const timer = setTimeout(() => {
        generateNewQuizItem();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [view, type, generateNewQuizItem, showSummary]);

  useEffect(() => {
    if (feedback === 'correct') {
      const timer = setTimeout(() => {
        if (stats.attempts === stats.totalInPool) {
          setShowSummary(true);
        } else {
          generateNewQuizItem();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback, generateNewQuizItem, stats.attempts, stats.totalInPool]);

  const handleCheck = (e) => {
    if (e) e.preventDefault();
    if (!quizItem || feedback === 'correct') return;

    if (userInput.toLowerCase().trim() === quizItem.romaji) {
      setFeedback('correct');
      setStats(prev => ({
        ...prev,
        correct: hasFailedCurrent ? prev.correct : prev.correct + 1,
        attempts: prev.attempts + 1
      }));
    } else {
      setFeedback('incorrect');
      setUserInput('');
      if (!hasFailedCurrent) {
        setMissedKanas(prev => [...prev, quizItem]);
        setHasFailedCurrent(true);
      }
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const currentAccuracy = stats.attempts > 0 
    ? Math.round((stats.correct / stats.attempts) * 100) 
    : 0;

  const resetSession = () => {
    poolRef.current = [];
    generateNewQuizItem();
    setShowSummary(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[var(--color-sumi-black)]/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-light)] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-[var(--color-sumi-black)] font-instrument leading-none">Kana Master</h3>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              {type}
            </p>
          </div>

          {view === 'practice' && !showSummary && (
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setShowReviewDropdown(!showReviewDropdown)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all active:scale-95 ${showReviewDropdown 
                  ? 'bg-[var(--color-accent-pink)] text-white border-[var(--color-accent-pink)]' 
                  : 'bg-white text-neutral-500 border-[var(--color-border-light)] hover:border-[var(--color-accent-pink)]/30 shadow-sm'}`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                  <span>{stats.attempts}/{stats.totalInPool}</span>
                  <span className="w-1 h-1 rounded-full bg-current/30"></span>
                  <span className={currentAccuracy < 70 && stats.attempts > 5 ? 'text-red-400' : ''}>
                    {currentAccuracy}%
                  </span>
                </div>
                {showReviewDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'matrix' ? 'practice' : 'matrix')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border-light)] text-[var(--color-sumi-black)] hover:bg-neutral-50 transition-colors active:scale-95 shadow-sm"
              title={view === 'matrix' ? 'Switch to Practice' : 'Switch to Matrix'}
            >
              {view === 'matrix' ? <Brain size={20} className="text-[var(--color-accent-pink)]" /> : <LayoutGrid size={20} className="text-[var(--color-accent-pink)]" />}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border-light)] text-[var(--color-sumi-black)] hover:bg-neutral-50 transition-colors active:scale-95 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Review Dropdown */}
        {view === 'practice' && showReviewDropdown && !showSummary && (
          <div className="px-6 py-4 bg-neutral-50 border-b border-[var(--color-border-light)] animate-in slide-in-from-top duration-300">
            <h4 className="text-[8px] font-bold uppercase text-neutral-400 tracking-widest mb-3">Missed Characters</h4>
            {missedKanas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missedKanas.map((item, idx) => (
                  <div key={idx} className="bg-white px-3 py-2 rounded-xl border border-red-100 flex items-center gap-2 shadow-sm animate-in zoom-in-90">
                    <span className="text-sm font-bold text-[var(--color-sumi-black)]">{item.kana}</span>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">{item.romaji}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-400 italic text-center">No missed characters yet. Great progress!</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2">
          {['hiragana', 'katakana'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${type === t 
                ? 'bg-[var(--color-accent-pink)] text-white shadow-md' 
                : 'bg-white text-neutral-400 border border-[var(--color-border-light)] hover:bg-neutral-50'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative">
          {view === 'matrix' ? (
            <div className="space-y-8">
              {/* Basic Matrix */}
              <div className="overflow-x-auto pb-4">
                <table className="w-full border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      {vowels.map(v => (
                        <th key={v} className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] p-2">
                          {v}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.basic.map((row, idx) => (
                      <tr key={idx}>
                        <td className="text-[10px] font-bold uppercase text-neutral-400 text-center">
                          {row.consonant}
                        </td>
                        {vowels.map(v => (
                          <td key={v} className="p-0">
                            {row.vowels[v] ? (
                              <div className="bg-white p-3 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center min-w-[50px] shadow-sm group">
                                <span className="text-xl font-bold text-[var(--color-sumi-black)] leading-none">{row.vowels[v]}</span>
                                <span className="text-[8px] font-medium text-neutral-400 mt-1 uppercase">
                                  {getRomaji(row.vowels[v], row.consonant, v)}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full w-full min-h-[50px] rounded-2xl bg-neutral-50/50 border border-neutral-100 border-dashed"></div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dakuon */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] tracking-[0.2em] flex items-center gap-2">
                  <span className="w-8 h-px bg-[var(--color-accent-pink)]/30"></span>
                  Dakuon & Handakuon
                </h4>
                <div className="overflow-x-auto pb-4">
                  <table className="w-full border-separate border-spacing-2">
                    <tbody>
                      {data.dakuon.map((row, idx) => (
                        <tr key={idx}>
                          <td className="text-[10px] font-bold uppercase text-neutral-400 text-center w-10">
                            {row.consonant}
                          </td>
                          {vowels.map(v => (
                            <td key={v} className="p-0">
                              {row.vowels[v] ? (
                                <div className="bg-white p-3 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center min-w-[50px] shadow-sm">
                                  <span className="text-xl font-bold text-[var(--color-sumi-black)] leading-none">{row.vowels[v]}</span>
                                  <span className="text-[8px] font-medium text-neutral-400 mt-1 uppercase">
                                    {getRomaji(row.vowels[v], row.consonant, v)}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-full w-full min-h-[50px] rounded-2xl bg-neutral-50/50"></div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Yoon */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] tracking-[0.2em] flex items-center gap-2">
                  <span className="w-8 h-px bg-[var(--color-accent-pink)]/30"></span>
                  Yōon (Combinations)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {data.yoon.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-[var(--color-sumi-black)] leading-none">{item.kana}</span>
                      <span className="text-[8px] font-medium text-neutral-400 mt-1 uppercase">{item.romaji}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extended Section */}
              {data.extended && data.extended.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] tracking-[0.2em] flex items-center gap-2">
                    <span className="w-8 h-px bg-[var(--color-accent-pink)]/30"></span>
                    Extended {type === 'hiragana' ? 'Hiragana' : 'Katakana'} (Foreign Sounds)
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {data.extended.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 sm:p-3 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center shadow-sm">
                        <span className="text-base sm:text-lg font-bold text-[var(--color-sumi-black)] leading-none">{item.kana}</span>
                        <span className="text-[8px] font-bold text-neutral-400 mt-1 uppercase">{item.romaji}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Practice UI */
            <div className="h-full flex flex-col items-center justify-center py-10 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <div className={`text-8xl font-bold text-[var(--color-sumi-black)] transition-all duration-300 ${feedback === 'correct' ? 'scale-110 text-green-500' : feedback === 'incorrect' ? 'animate-shake text-red-500' : ''}`}>
                  {quizItem?.kana}
                </div>
                {feedback === 'correct' && (
                  <div className="absolute -top-6 -right-6 text-green-500 bg-white rounded-full p-1 shadow-lg border border-green-100 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                )}
                {feedback === 'incorrect' && (
                  <div className="absolute -top-6 -right-6 text-red-500 bg-white rounded-full p-1 shadow-lg border border-red-100 animate-in zoom-in">
                    <AlertCircle size={32} />
                  </div>
                )}
              </div>

              <form onSubmit={handleCheck} className="w-full max-w-xs space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type romaji..."
                    autoFocus
                    className={`w-full bg-white border-2 rounded-2xl py-4 px-6 text-center text-xl font-bold focus:outline-none transition-all ${
                      feedback === 'correct' ? 'border-green-500 ring-4 ring-green-100' : 
                      feedback === 'incorrect' ? 'border-red-500 ring-4 ring-red-100' : 
                      isRevealed ? 'border-[var(--color-accent-pink)] ring-4 ring-pink-50' :
                      'border-[var(--color-border-light)] focus:border-[var(--color-accent-pink)]'
                    }`}
                  />
                  {(feedback === 'incorrect' || isRevealed) && quizItem && (
                    <div className="absolute top-1/2 -right-16 -translate-y-1/2 font-bold text-[var(--color-accent-pink)] animate-in fade-in slide-in-from-left-2 text-xl drop-shadow-sm">
                      {quizItem.romaji}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={generateNewQuizItem}
                    className="p-4 bg-white border border-[var(--color-border-light)] text-neutral-400 rounded-2xl hover:bg-neutral-50 transition-colors active:scale-95 shadow-sm"
                  >
                    <RefreshCw size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasFailedCurrent) {
                        setMissedKanas(prev => [...prev, quizItem]);
                        setHasFailedCurrent(true);
                      }
                      setIsRevealed(true);
                    }}
                    className="p-4 bg-white border border-[var(--color-border-light)] text-neutral-400 rounded-2xl hover:bg-neutral-50 transition-colors active:scale-95 shadow-sm"
                    title="Reveal Answer"
                  >
                    <Eye size={24} className={isRevealed ? "text-[var(--color-accent-pink)]" : ""} />
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--color-sumi-black)] text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-black/10"
                  >
                    Check
                  </button>
                </div>
              </form>

              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Strategy</p>
                <p className="text-xs text-neutral-500 max-w-xs italic leading-relaxed">
                  Type the romaji for the symbol. For example: <span className="text-[var(--color-accent-pink)] font-bold">ka</span>, <span className="text-[var(--color-accent-pink)] font-bold">shi</span>, <span className="text-[var(--color-accent-pink)] font-bold">n</span>.
                </p>
              </div>
            </div>
          )}

          {/* Summary Modal */}
          {showSummary && (
            <div className="absolute inset-0 z-50 bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
              <div className="w-full max-w-sm space-y-10 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-accent-pink)]/10 text-[var(--color-accent-pink)]">
                  <Trophy size={48} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-4xl font-bold text-[var(--color-sumi-black)] font-instrument">Training Complete</h3>
                  <p className="text-neutral-500 font-medium">You reviewed all characters in this category!</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-[var(--color-border-light)] shadow-sm">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-[var(--color-accent-pink)]">{currentAccuracy}%</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[var(--color-border-light)] shadow-sm">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Characters</p>
                    <p className="text-3xl font-bold text-[var(--color-sumi-black)]">{stats.attempts}</p>
                  </div>
                </div>

                {missedKanas.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] tracking-[0.2em] flex items-center justify-center gap-2">
                      <span className="w-8 h-px bg-[var(--color-accent-pink)]/30"></span>
                      Review Characters
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto no-scrollbar py-2">
                      {missedKanas.map((item, idx) => (
                        <div key={idx} className="bg-white px-3 py-2 rounded-xl border border-red-100 flex items-center gap-2 shadow-sm">
                          <span className="text-lg font-bold text-[var(--color-sumi-black)]">{item.kana}</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">{item.romaji}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={resetSession}
                    className="flex-1 py-4 bg-[var(--color-sumi-black)] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
                  >
                    <RotateCcw size={18} />
                    Restart
                  </button>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex-1 py-4 bg-white border border-[var(--color-border-light)] text-[var(--color-sumi-black)] rounded-2xl font-bold hover:bg-neutral-50 transition-all active:scale-[0.98]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/50 backdrop-blur-md border-t border-[var(--color-border-light)] sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-[var(--color-sumi-black)] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98] shadow-md shadow-black/10"
          >
            Finish Training
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default KanaPractice;
