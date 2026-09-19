"use client";

import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  deadline: string;
  onExpireChange?: (isExpired: boolean) => void;
}

interface TimeRemaining {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isExpired: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  onExpireChange,
}) => {
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    isExpired: false,
  });

  useEffect(() => {
    setMounted(true);

    const calculateTime = () => {
      const targetTime = new Date(deadline).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0 || isNaN(targetTime)) {
        const expiredState = {
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
          isExpired: true,
        };
        setTimeRemaining(expiredState);
        onExpireChange?.(true);
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / (1000 * 60)) % 60);
      const s = Math.floor((difference / 1000) % 60);

      const updated = {
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
        isExpired: false,
      };

      setTimeRemaining(updated);
      onExpireChange?.(false);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpireChange]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="size-2 rounded-full bg-[#68705A] animate-pulse" />
        <p className="text-[0.68rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#6F6B61]">
          {timeRemaining.isExpired ? "REGISTRATION STATUS" : "REGISTRATION CLOSES IN"}
        </p>
      </div>

      {timeRemaining.isExpired ? (
        <div className="rounded-lg bg-[#FAF8F2] px-3.5 py-2.5 border border-[#A24B4B]/30 text-center shadow-xs max-w-sm">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#A24B4B]">
            Registration Closed for this Live Batch
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 no-gsap gap-2 sm:gap-3 max-w-[280px] sm:max-w-[340px]">
          {/* Days */}
          <div className="paper-card flex flex-col items-center justify-center py-1.5 px-1.5 sm:py-2 sm:px-2.5 bg-[#FAF8F2] border border-[#464137]/15 rounded-md shadow-xs min-w-[54px] sm:min-w-[64px]">
            <span
              suppressHydrationWarning
              className="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#292923] leading-none"
            >
              {mounted ? timeRemaining.days : "00"}
            </span>
            <span className="text-[0.58rem] sm:text-[0.64rem] font-semibold uppercase tracking-wider text-[#68705A] mt-1 leading-none">
              DAYS
            </span>
          </div>

          {/* Hours */}
          <div className="paper-card flex flex-col items-center justify-center py-1.5 px-1.5 sm:py-2 sm:px-2.5 bg-[#FAF8F2] border border-[#464137]/15 rounded-md shadow-xs min-w-[54px] sm:min-w-[64px]">
            <span
              suppressHydrationWarning
              className="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#292923] leading-none"
            >
              {mounted ? timeRemaining.hours : "00"}
            </span>
            <span className="text-[0.58rem] sm:text-[0.64rem] font-semibold uppercase tracking-wider text-[#68705A] mt-1 leading-none">
              HRS
            </span>
          </div>

          {/* Minutes */}
          <div className="paper-card flex flex-col items-center justify-center py-1.5 px-1.5 sm:py-2 sm:px-2.5 bg-[#FAF8F2] border border-[#464137]/15 rounded-md shadow-xs min-w-[54px] sm:min-w-[64px]">
            <span
              suppressHydrationWarning
              className="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#292923] leading-none"
            >
              {mounted ? timeRemaining.minutes : "00"}
            </span>
            <span className="text-[0.58rem] sm:text-[0.64rem] font-semibold uppercase tracking-wider text-[#68705A] mt-1 leading-none">
              MIN
            </span>
          </div>

          {/* Seconds */}
          <div className="paper-card flex flex-col items-center justify-center py-1.5 px-1.5 sm:py-2 sm:px-2.5 bg-[#FAF8F2] border border-[#464137]/15 rounded-md shadow-xs min-w-[54px] sm:min-w-[64px]">
            <span
              suppressHydrationWarning
              className="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#292923] leading-none"
            >
              {mounted ? timeRemaining.seconds : "00"}
            </span>
            <span className="text-[0.58rem] sm:text-[0.64rem] font-semibold uppercase tracking-wider text-[#68705A] mt-1 leading-none">
              SEC
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
