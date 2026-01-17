
import React, { useState, useEffect } from 'react';
import { audioManager } from '../utils/audio';

interface SlotDigitProps {
  targetDigit: string;
  spinning: boolean;
  delay: number;
  onStop: () => void;
}

const SlotDigit: React.FC<SlotDigitProps> = ({ targetDigit, spinning, delay, onStop }) => {
  const [currentDigit, setCurrentDigit] = useState('0');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (spinning) {
      setIsDone(false);
      let intervalId = setInterval(() => {
        setCurrentDigit(Math.floor(Math.random() * 10).toString());
      }, 50);

      const stopTimeout = setTimeout(() => {
        clearInterval(intervalId);
        setCurrentDigit(targetDigit);
        setIsDone(true);
        audioManager.play('tick');
        onStop();
      }, delay);

      return () => {
        clearInterval(intervalId);
        clearTimeout(stopTimeout);
      };
    }
  }, [spinning, targetDigit, delay, onStop]);

  return (
    <div className={`
      relative 
      w-10 h-16 
      xs:w-14 xs:h-20 
      sm:w-16 sm:h-24 
      md:w-20 md:h-32 
      flex items-center justify-center 
      bg-cyan-900/20 border-2 border-cyan-500/40 rounded-lg overflow-hidden
      glass transition-all duration-300
      ${isDone ? 'border-cyan-400 neon-border scale-105' : 'scale-100'}
    `}>
      <div className={`
        text-3xl xs:text-4xl sm:text-5xl md:text-7xl 
        font-tech font-bold text-cyan-400 neon-glow
        ${spinning && !isDone ? 'blur-[1px] animate-pulse' : ''}
      `}>
        {currentDigit}
      </div>
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/20 shadow-[0_0_5px_rgba(34,211,238,0.5)]"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-400/20 shadow-[0_0_5px_rgba(34,211,238,0.5)]"></div>
    </div>
  );
};

export default SlotDigit;
