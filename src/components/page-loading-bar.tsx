"use client";

import { useEffect, useState } from "react";

interface PageLoadingBarProps {
  isLoading: boolean;
  duration?: number;
}

export default function PageLoadingBar({ isLoading, duration = 1000 }: PageLoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(0);

      // Simulate loading progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, duration / 20);

      return () => clearInterval(interval);
    } else {
      // Complete loading
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    }
  }, [isLoading, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-2 bg-gray-700 z-50 shadow-lg">
      <div
        className="h-full bg-gradient-to-r from-[#7d570e] via-[#8a5f0f] to-[#6b4a0c] transition-all duration-200 ease-out shadow-sm"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
} 