import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, LayoutGrid, Brain } from 'lucide-react';
import { hiraganaData, katakanaData } from '../data/kana';

const KanaPractice = ({ isOpen, onClose }) => {
  const [type, setType] = useState('hiragana'); // 'hiragana' | 'katakana'
  const [view, setView] = useState('matrix'); // 'matrix' | 'practice'
  const [quizItem, setQuizItem] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const inputRef = useRef(null);

  const data = type === 'hiragana' ? hiraganaData : katakanaData;
  const vowels = ['a', 'i', 'u', 'e', 'o'];

  const generateNewQuizItem = React.useCallback(() => {
    const pool = [];
    
    // Add basic
    data.basic.forEach(row => {
      Object.entries(row.vowels).forEach(([v, char]) => {
        if (char) {
          const romaji = row.consonant === '-' ? v : row.consonant + v;
          pool.push({ kana: char, romaji: romaji.replace('si', 'shi').replace('ti', 'chi').replace('tu', 'tsu').replace('hu', 'fu').replace('ni', 'n') });
        }
      });
    });

    // Add dakuon
    data.dakuon.forEach(row => {
      Object.entries(row.vowels).forEach(([v, char]) => {
        if (char) {
          const romaji = row.consonant + v;
          pool.push({ kana: char, romaji: romaji.replace('zi', 'ji').replace('di', 'ji').replace('du', 'zu') });
        }
      });
    });

    // Add yoon
    data.yoon.forEach(item => {
      pool.push({ kana: item.kana, romaji: item.romaji });
    });

    const item = pool[Math.floor(Math.random() * pool.length)];
    setQuizItem(item);
    setUserInput('');
    setFeedback(null);
    if (inputRef.current) inputRef.current.focus();
  }, [data]);

  useEffect(() => {
    if (view === 'practice') {
      const timer = setTimeout(() => {
        generateNewQuizItem();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [view, type, generateNewQuizItem]);

  useEffect(() => {
    if (feedback === 'correct') {
      const timer = setTimeout(() => {
        generateNewQuizItem();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback, generateNewQuizItem]);

  const handleCheck = (e) => {
    if (e) e.preventDefault();
    if (!quizItem) return;

    if (userInput.toLowerCase().trim() === quizItem.romaji) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[var(--color-sumi-black)]/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-light)] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-sumi-black)] font-instrument">Kana Master</h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Practice {type === 'hiragana' ? 'Hiragana' : 'Katakana'}
            </p>
          </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {view === 'matrix' ? (
            <div className="space-y-8">
              {/* Gojuon Matrix */}
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
                              <div className="bg-white p-3 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center min-w-[50px] shadow-sm hover:border-[var(--color-accent-pink)]/30 transition-all group">
                                <span className="text-xl font-bold text-[var(--color-sumi-black)] leading-none">{row.vowels[v]}</span>
                                <span className="text-[8px] font-medium text-neutral-400 mt-1 uppercase">
                                  {(row.consonant === '-' ? v : row.consonant + v)
                                    .replace('si', 'shi').replace('ti', 'chi').replace('tu', 'tsu').replace('hu', 'fu').replace('ni', 'n')}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full w-full rounded-2xl bg-neutral-50/50 border border-neutral-100 border-dashed"></div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dakuon Section */}
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
                                    {(row.consonant + v).replace('zi', 'ji').replace('di', 'ji').replace('du', 'zu')}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-full w-full rounded-2xl bg-neutral-50/50"></div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Yoon Section */}
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
            </div>
          ) : (
            /* Practice Mode */
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
                      'border-[var(--color-border-light)] focus:border-[var(--color-accent-pink)]'
                    }`}
                  />
                  {feedback === 'incorrect' && quizItem && (
                    <div className="absolute top-1/2 -right-16 -translate-y-1/2 font-bold text-neutral-300 animate-in fade-in slide-in-from-left-2">
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
                    type="submit"
                    className="flex-1 bg-[var(--color-sumi-black)] text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-black/10"
                  >
                    Check
                  </button>
                </div>
              </form>

              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Strategy</p>
                <p className="text-xs text-neutral-500 max-w-xs italic">
                  Type the romaji (latin characters) for the displayed Japanese symbol. For example: <span className="text-[var(--color-accent-pink)] font-bold">ka</span>, <span className="text-[var(--color-accent-pink)] font-bold">shi</span>, <span className="text-[var(--color-accent-pink)] font-bold">n</span>.
                </p>
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
