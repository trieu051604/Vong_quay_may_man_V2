
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { gasService } from './services/gasService';
import { Participant, Result, AppStatus } from './types';
import { SPIN_DURATION_BASE, STAGGER_STOP_MS, DIGIT_COUNT, PRIZE_NAME, PRIZE_ID } from './constants';
import SlotDigit from './components/SlotDigit';
import { audioManager } from './utils/audio';
import { launchConfetti } from './utils/confetti';

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Participant | null>(null);
  const [winnerDigits, setWinnerDigits] = useState<string[]>(new Array(DIGIT_COUNT).fill('0'));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stoppedCount, setStoppedCount] = useState(0);

  const fetchAllData = useCallback(async () => {
    setStatus(AppStatus.LOADING);
    setErrorMessage(null);
    try {
      const [pData, rData] = await Promise.all([
        gasService.getParticipants(),
        gasService.getResults()
      ]);
      setParticipants(pData);
      setResults(rData);
      setStatus(AppStatus.IDLE);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Không thể kết nối với Google Sheets.");
      setStatus(AppStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    audioManager.setVolume(0.5);
  }, [fetchAllData]);

  const eligiblePool = useMemo(() => {
    const winnerIds = new Set(results.map(r => String(r.participantId)));
    return participants.filter(p => {
      const isEligible = String(p.eligible).toUpperCase() === 'TRUE' || p.eligible === true;
      return isEligible && !winnerIds.has(String(p.id));
    });
  }, [participants, results]);

  const handleSpin = async () => {
    if (eligiblePool.length === 0 || status === AppStatus.SPINNING) return;

    const winner = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    setSelectedWinner(winner);
    
    const idStr = String(winner.id).padStart(DIGIT_COUNT, '0').slice(-DIGIT_COUNT);
    setWinnerDigits(idStr.split(''));
    
    setStoppedCount(0);
    setStatus(AppStatus.SPINNING);
    audioManager.play('spin');
  };

  const onDigitStop = useCallback(() => {
    setStoppedCount(prev => {
      const next = prev + 1;
      if (next === DIGIT_COUNT) {
        audioManager.stop('spin');
        audioManager.play('win');
        audioManager.play('cheer'); 
        setStatus(AppStatus.CELEBRATING);
        if (canvasRef.current) launchConfetti(canvasRef.current);
        
        if (selectedWinner) {
          const newResult: Result = {
            time: new Date().toISOString(),
            prizeId: PRIZE_ID,
            prizeName: PRIZE_NAME,
            participantId: String(selectedWinner.id),
            name: selectedWinner.name,
            team: selectedWinner.team
          };
          gasService.saveResult(newResult).then(success => {
            if (success) {
               setResults(prev => [newResult, ...prev]);
            }
          });
        }
      }
      return next;
    });
  }, [selectedWinner]);

  const handleCloseCelebration = () => {
    setStatus(AppStatus.IDLE);
    setSelectedWinner(null);
    audioManager.stop('cheer'); 
  };

  if (status === AppStatus.ERROR) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-6 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/30 max-w-md shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-tech font-bold text-white mb-4 uppercase">Lỗi kết nối</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">{errorMessage}</p>
          <button 
            onClick={fetchAllData}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-500 font-bold py-2 px-8 rounded-full border border-red-500/50 transition-all"
          >
            THỬ LẠI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 grid-bg overflow-hidden">
      <div className="scanline"></div>
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-cyan-500 rounded-full blur-[100px] sm:blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500 rounded-full blur-[100px] sm:blur-[150px]"></div>
      </div>

      <header className="mb-8 sm:mb-12 text-center relative z-10 w-full">
        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-tech font-bold neon-glow text-cyan-400 mb-2 uppercase tracking-widest">
          TECHXPERIENCE DRAW
        </h1>
        {/* <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-cyan-400/60 font-tech text-xs sm:text-sm uppercase tracking-widest">
                Pool: {eligiblePool.length} người
            </span>
        </div> */}
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center justify-center gap-8 sm:gap-12 relative z-10">
        {/* Slot Machine Area */}
        <div className="w-full flex flex-wrap justify-center gap-1.5 xs:gap-2 sm:gap-4 p-4 sm:p-8 glass rounded-3xl sm:rounded-[2.5rem] border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] relative">
          {winnerDigits.map((digit, i) => (
            <SlotDigit 
              key={i} 
              targetDigit={digit} 
              spinning={status === AppStatus.SPINNING} 
              delay={SPIN_DURATION_BASE + (i * STAGGER_STOP_MS)} 
              onStop={onDigitStop}
            />
          ))}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl sm:rounded-t-[2.5rem] pointer-events-none"></div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSpin}
          disabled={status !== AppStatus.IDLE || eligiblePool.length === 0}
          className={`
            group relative w-full max-w-xs sm:max-w-md px-8 sm:px-16 py-4 sm:py-6 rounded-full font-tech font-bold text-xl sm:text-3xl tracking-[0.2em] transition-all duration-300
            ${status !== AppStatus.IDLE || eligiblePool.length === 0 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700' 
              : 'bg-transparent text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-slate-900 hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]'}
          `}
        >
          {status === AppStatus.SPINNING ? 'SPINNING...' : 'QUAY SỐ'}
          <div className="absolute -inset-1 rounded-full border border-cyan-400/20 group-hover:animate-ping opacity-0 group-hover:opacity-100"></div>
        </button>
      </main>

      {/* Celebration Overlay */}
      {status === AppStatus.CELEBRATING && selectedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" width={window.innerWidth} height={window.innerHeight} />
          <div className="relative glass p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-2 border-cyan-400 max-w-lg w-full text-center scale-up shadow-[0_0_100px_rgba(34,211,238,0.4)] max-h-[95vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-cyan-400 font-tech text-2xl sm:text-3xl mb-2 mt-2 uppercase">Winner Detected!</h2>
            <div className="text-5xl xs:text-6xl sm:text-7xl font-tech text-white neon-glow mb-4 sm:mb-6">#{String(selectedWinner.id).padStart(6, '0')}</div>
            <div className="space-y-1 sm:space-y-2 mb-6 sm:mb-8">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-100">{selectedWinner.name}</div>
              <div className="text-cyan-400/70 uppercase tracking-widest text-sm sm:text-lg">{selectedWinner.team}</div>
            </div>
            <button 
              onClick={handleCloseCelebration} 
              className="w-full sm:w-auto bg-cyan-400 text-slate-900 font-bold py-3 sm:py-4 px-12 sm:px-16 rounded-full hover:bg-white transition-all text-lg sm:text-xl active:scale-95 mb-2"
            >
              CHẤP NHẬN
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {status === AppStatus.LOADING && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-3 glass py-2 px-4 rounded-full border border-cyan-400/20 z-20">
          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] sm:text-xs text-cyan-400/60 uppercase font-bold tracking-widest">Loading...</span>
        </div>
      )}

      <style>{`
        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-up { animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 10px; }
        @media (max-width: 360px) {
           .font-tech { font-size: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
