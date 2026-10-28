'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useEffect } from 'react';

interface SplashScreenProps {
  appLogo?: string;
  onFinished: () => void;
}

export default function SplashScreen({ appLogo, onFinished }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 4000); // Splash screen duration

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-purple-700 to-indigo-900 text-primary-foreground"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-4">
          {appLogo ? (
            <Image src={appLogo} alt="App Logo" width={80} height={80} className="h-20 w-auto" />
          ) : (
            <Star className="h-20 w-20 text-red-500 fill-red-500" />
          )}
          <div>
            <div className="text-4xl font-light leading-none">Fino</div>
            <div className="text-5xl font-bold leading-none relative pb-1 -mt-2">
              pay
              <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white" />
            </div>
          </div>
        </div>
        <p className="text-lg font-medium tracking-wide">
          #HarDinFino
        </p>
      </motion.div>
    </motion.div>
  );
}
