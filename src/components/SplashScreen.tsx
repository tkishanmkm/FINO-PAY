'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface SplashScreenProps {
  splashImage?: string;
  onFinished: () => void;
}

export default function SplashScreen({ splashImage, onFinished }: SplashScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onFinished, 4000);
    return () => window.clearTimeout(timer);
  }, [onFinished]);

  return (
    <motion.main
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] h-[100dvh] w-[100vw] overflow-hidden bg-[#463b98]"
      aria-label="FinoPay splash screen"
    >
      <img
        src={splashImage || '/fino-assets/super-logout/splash-background-iphone.webp'}
        alt="FinoPay"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
    </motion.main>
  );
}
