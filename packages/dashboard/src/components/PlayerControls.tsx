
import React, { useState, useEffect } from "react";
import { Play, Pause, FastForward } from "lucide-react";

interface Props {
  playerRef: React.RefObject<any>;
  isConsoleOpen: boolean;
}

export const PlayerControls: React.FC<Props> = ({ playerRef, isConsoleOpen }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync with rrweb player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const replayer = player.getReplayer?.() || player.replayer;
    if (!replayer) return;

    // Get metadata
    const meta = replayer.getMetaData();
    setTotalTime(meta.totalTime);

    // Time sync interval
    const interval = setInterval(() => {
      if (!isSeeking && replayer) {
        const current = replayer.getCurrentTime();
        setCurrentTime(current);

        // Check if video ended
        if (current >= meta.totalTime && isPlaying) {
          setIsPlaying(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playerRef.current, isSeeking, isPlaying]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    const replayer = player.getReplayer?.() || player.replayer;
    if (!replayer) return;

    if (isPlaying) {
      replayer.pause();
      setIsPlaying(false);
    } else {
      // Video bittiğinde baştan başlat
      if (currentTime >= totalTime) {
        setCurrentTime(0);
        replayer.play(0);
      } else if (currentTime > 0) {
        replayer.play(currentTime);
      } else {
        replayer.play();
      }
      setIsPlaying(true);
    }
  };

  const seek = (time: number) => {
    const player = playerRef.current;
    if (!player) return;

    const replayer = player.getReplayer?.() || player.replayer;
    if (!replayer) return;

    replayer.play(time);
    if (!isPlaying) {
      replayer.pause();
    }
  };

  const onSeekStart = () => setIsSeeking(true);
  const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };
  const onSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    seek(Number(e.currentTarget.value));
    setIsSeeking(false);
  };

  const toggleSpeed = () => {
    const speeds = [1, 2, 4, 8];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    const player = playerRef.current;
    if (player) {
      const replayer = player.getReplayer?.() || player.replayer;
      if (replayer) {
        replayer.setConfig({ speed: nextSpeed });
      }
    }
  };

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`absolute left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 flex items-center gap-4 shadow-2xl z-20 transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${isConsoleOpen ? 'bottom-[calc(40%+1.5rem)]' : 'bottom-12'
      }`}>
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-lg shadow-blue-900/20 shrink-0"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <input
          type="range"
          min={0}
          max={totalTime || 100}
          step={10}
          value={currentTime}
          onChange={onSeekChange}
          onMouseDown={onSeekStart}
          onMouseUp={onSeekEnd}
          onTouchStart={onSeekStart}
          onTouchEnd={onSeekEnd}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-700 mx-1" />

      <button
        onClick={toggleSpeed}
        className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-white/5 text-xs font-mono text-slate-300 transition-colors shrink-0"
        title="Playback Speed"
      >
        <FastForward className="w-3 h-3" />
        <span>{playbackSpeed}x</span>
      </button>
    </div>
  );
};
