"use client";

import { useEffect, useState } from "react";

const PROGRESS_SEGMENT_COUNT = 22;

export function LoadingPreview({ label = "진행중 (데이터 동기화)..." }: { label?: string }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPercent((current) => (current >= 100 ? 0 : current + 1));
    }, 60);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex flex-col h-dvh w-full overflow-hidden bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white">
      <div className="absolute inset-x-0 top-0 h-[404px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180" src="/minimi/bg-soft-light.png" alt="" />
      </div>

      <div className="absolute left-1/2 top-[280px] -translate-x-1/2 w-[140px] h-[140px] pointer-events-none">
        <div className="relative w-full h-full overflow-hidden animate-[catWobble_1.6s_steps(6,end)_infinite]">
          <img
            className="absolute left-[-26.19%] top-[-26.19%] w-[152.38%] h-[152.38%] max-w-none"
            src="/minimi/loading-cat.png"
            alt=""
          />
        </div>
      </div>

      <div className="absolute left-1/2 top-[444px] -translate-x-1/2 flex flex-col gap-1 items-center w-[300px]">
        <div className="flex items-center gap-2.5 w-full font-pixel text-xs tracking-[0.3px]">
          <p className="m-0 flex-1 text-[#191f28]">{label}</p>
          <p className="m-0 shrink-0 text-[#db2777]">{percent}%</p>
        </div>
        <div className="flex items-center w-full h-[28px] p-1.5 bg-white border-2 border-[#d1d6db]">
          <div className="h-full overflow-hidden bg-[#7cb6f6]" style={{ width: `${percent}%` }}>
            <div className="flex h-full gap-0.5">
              {Array.from({ length: PROGRESS_SEGMENT_COUNT }).map((_, index) => (
                <span key={index} className="h-full w-3 shrink-0 border-r border-white/40 bg-[#1d4ed8]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
