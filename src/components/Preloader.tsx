"use client";

import React, { useEffect, useState } from "react";

const GREETINGS = [
  { text: "नमस्ते", lang: "Hindi" },
  { text: "வணக்கம்", lang: "Tamil" },
  { text: "नमस्कार", lang: "Marathi" },
  { text: "नमस्कार", lang: "Bengali" },
  { text: "നമസ്കാരം", lang: "Malayalam" },
  { text: "నమస్కారం", lang: "Telugu" },
  { text: "ನಮಸ್ಕಾರ", lang: "Kannada" },
  { text: "કેમ છો", lang: "Gujarati" },
  { text: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", lang: "Punjabi" },
  { text: "Adaab", lang: "Urdu" },
  { text: "Hello", lang: "English" },
  { text: "POCKET DICTIONARY", lang: "Brand" }
];

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [scaleStyle, setScaleStyle] = useState<React.CSSProperties>({});
  const [isBrandText, setIsBrandText] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    function showNextGreeting(index: number) {
      if (index < GREETINGS.length) {
        setGreetingIndex(index);
        const isLast = index === GREETINGS.length - 1;
        if (isLast) {
          setIsBrandText(true);
        }
        const duration = isLast ? 850 : 180;

        timeoutId = setTimeout(() => {
          showNextGreeting(index + 1);
        }, duration);
      } else {
        // Trigger logo transition
        triggerLogoTransition();
      }
    }

    function triggerLogoTransition() {
      const brand = document.querySelector(".brand") as HTMLElement;
      const header = document.querySelector(".main-header") as HTMLElement;
      const preloaderText = document.getElementById("preloader-text");
      const preloader = document.getElementById("preloader");
      
      if (!brand || !preloaderText || !preloader || !header) {
        onComplete();
        return;
      }

      header.style.opacity = "1";

      const brandRect = brand.getBoundingClientRect();
      const textRect = preloaderText.getBoundingClientRect();

      const scaleX = brandRect.width / (textRect.width || 1);
      const scaleY = brandRect.height / (textRect.height || 1);
      const scale = Math.min(scaleX, scaleY) || 0.3;

      const deltaX = brandRect.left + brandRect.width / 2 - window.innerWidth / 2;
      const deltaY = brandRect.top + brandRect.height / 2 - window.innerHeight / 2;

      preloader.style.pointerEvents = "none";
      preloader.style.backgroundColor = "transparent";
      preloader.style.opacity = "0";

      setScaleStyle({
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale})`,
        color: "#ffffff",
        opacity: 0,
        transition: "transform 0.85s cubic-bezier(0.77, 0, 0.175, 1), color 0.85s ease, opacity 0.6s ease 0.25s"
      });

      setTimeout(() => {
        brand.style.opacity = "1";
        onComplete();
      }, 850);
    }

    // Start regional greetings cycle
    showNextGreeting(0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [onComplete]);

  return (
    <div id="preloader">
      <div
        id="preloader-text"
        className={isBrandText ? "brand-active" : ""}
        style={scaleStyle}
      >
        {GREETINGS[greetingIndex]?.text || "Pocket Dictionary"}
      </div>
    </div>
  );
}
