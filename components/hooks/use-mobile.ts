// components/hooks/use-mobile.ts
"use client";

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // İlk kontrol
    checkIsMobile();

    // Resize event listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}