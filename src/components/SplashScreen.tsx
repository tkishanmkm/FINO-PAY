'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface SplashScreenProps {
  splashImage?: string;
  appLogo?: string;
  wordmarkImage?: string;
  onFinished: () => void;
}

export default function SplashScreen({
  splashImage,
  appLogo,
  wordmarkImage,
  onFinished,
}: SplashScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onFinished, 4000);
    return () => window.clearTimeout(timer);
  }, [onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
      aria-label="FinoPay splash screen"
    >
      <div className="fino-superlogout-frame relative overflow-hidden bg-[#463b98]">
        <img
          src={splashImage || '/fino-assets/super-logout/splash-background.webp'}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-fill"
        />
        <img
          src={appLogo || '/fino-assets/appLogo.png'}
          alt="FinoPay"
          draggable={false}
          className="fino-universal-splash-star absolute select-none object-contain"
        />
        <img
          src={wordmarkImage || '/fino-assets/super-logout/fino-pay-wordmark.webp'}
          alt="FinoPay"
          draggable={false}
          className="fino-universal-splash-wordmark absolute select-none object-contain"
        />
        <p className="fino-universal-splash-tagline absolute m-0 w-full text-center font-semibold tracking-wide text-white">
          #HarDinFino
        </p>
      </div>
    </motion.div>
  );
}
