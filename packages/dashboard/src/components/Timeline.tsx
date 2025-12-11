
import React, { useRef, useEffect } from "react";
import { DOMEvent } from "../types";
import { MousePointer2, Type, Activity, Eye } from "lucide-react";

interface Props {
  events: DOMEvent[];
  playerRef: React.RefObject<any>;
  sessionStartTime: number;
  currentTime: number;
}

export const Timeline: React.FC<Props> = ({ events, playerRef, sessionStartTime, currentTime }) => {
  const activeEventRef = useRef<HTMLDivElement>(null);

  const seek = (time: number) => {
    const player = playerRef.current;
    if (!player) return;

    const replayer = player.getReplayer?.() || player.replayer;
    if (!replayer) return;

    replayer.play(time);
    replayer.pause();
  };

  const isEventActive = (evtTimestamp: string | number) => {
    if (!sessionStartTime) return false;
    const evtTime = typeof evtTimestamp === "string"
      ? new Date(evtTimestamp).getTime()
      : evtTimestamp;

    const relativeTime = evtTime - sessionStartTime;
    // Highlight events happening within a 1 second window of current playback time
    const diff = Math.abs(relativeTime - currentTime);
    return diff < 800; // 800ms window
  };

  const groupedEvents = events.reduce((acc, evt) => {
    const timeLabel = new Date(evt.timestamp).toLocaleTimeString();
    if (!acc[timeLabel]) acc[timeLabel] = [];
    acc[timeLabel].push(evt);
    return acc;
  }, {} as Record<string, DOMEvent[]>);

  const getEventIcon = (type: string) => {
    if (type.includes("click") || type.includes("mouse"))
      return <MousePointer2 className="w-3 h-3 text-cyan-400" />;
    if (type.includes("key") || type.includes("input"))
      return <Type className="w-3 h-3 text-emerald-400" />;
    if (type.includes("scroll"))
      return <Activity className="w-3 h-3 text-amber-400" />;
    return <Eye className="w-3 h-3 text-slate-400" />;
  };

  useEffect(() => {
    if (activeEventRef.current) {
      activeEventRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime]); // Scroll when time updates and changes active ref

  return (
    <div className="w-full h-full border-r border-slate-800 overflow-y-auto bg-slate-900/40 shrink-0 custom-scrollbar backdrop-blur-sm">
      <div className="relative min-h-full p-4 space-y-6">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800" />

        {Object.entries(groupedEvents).map(([time, evts]: [string, DOMEvent[]]) => (
          <div key={time} className="relative pl-8">
            <div className="absolute left-6 top-2 w-2 h-px bg-slate-600 -ml-1" />
            <div className="text-[10px] text-slate-500 mb-2 font-mono bg-[#020617] inline-block px-1 relative z-10 rounded border border-slate-800">
              {time}
            </div>
            <div className="space-y-2">
              {evts.map((evt) => {
                const active = isEventActive(evt.timestamp);
                return (
                  <div
                    key={evt.id}
                    ref={active ? activeEventRef : null}
                    onClick={() => {
                      if (sessionStartTime) {
                        const t = (typeof evt.timestamp === "string"
                          ? new Date(evt.timestamp).getTime()
                          : evt.timestamp) - sessionStartTime;
                        seek(Math.max(0, t));
                      }
                    }}
                    className={`
                      p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all duration-300 relative overflow-hidden
                      ${active
                        ? "bg-blue-900/30 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] translate-x-1"
                        : "bg-[#0f172a]/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800"
                      }
                    `}
                  >
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                    )}

                    <div className={`p-1.5 rounded-md transition-colors ${active ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "bg-slate-900 text-slate-400"}`}>
                      {getEventIcon(evt.type)}
                    </div>

                    <div className="flex flex-col overflow-hidden flex-1">
                      <span className={`font-bold text-[10px] uppercase tracking-wide transition-colors ${active ? "text-blue-300" : "text-slate-300"}`}>
                        {evt.type}
                      </span>
                      <span className={`text-[10px] truncate font-mono transition-colors ${active ? "text-blue-200/70" : "text-slate-500"}`} title={evt.target}>
                        {evt.target}
                      </span>
                    </div>

                    {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center text-slate-600 mt-20 text-xs italic">
            No DOM events logged
          </div>
        )}
      </div>
    </div>
  );
};
