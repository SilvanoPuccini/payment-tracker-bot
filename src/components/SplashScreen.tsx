import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export default function SplashScreen({ onComplete, minDuration = 1500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade animation to complete before calling onComplete
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1a] transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Glow effect behind logo */}
      <div className="absolute w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]" />

      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center">
        <img
          src="/loading.png"
          alt="PayTrack"
          className="w-72 md:w-80 h-auto animate-fade-in"
        />
      </div>
    </div>
  );
}
