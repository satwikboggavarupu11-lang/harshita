/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Trophy, Gamepad2, Volume2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
  color: string;
}

interface Point {
  x: number;
  y: number;
}

// --- Constants ---

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "SynthAI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400",
    color: "#00f2ff", // Cyan
  },
  {
    id: 2,
    title: "Cyber Drift",
    artist: "NeuralBeats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/400/400",
    color: "#ff00ff", // Magenta
  },
  {
    id: 3,
    title: "Midnight Grid",
    artist: "LogicFlow",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/400/400",
    color: "#39ff14", // Neon Green
  },
];

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 150;

// --- Components ---

export default function App() {
  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Music Logic ---

  const playNext = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  }, []);

  const playPrev = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    }
  }, [currentTrackIndex]);

  // --- Game Logic ---

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isPaused, isGameOver, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y !== 1) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y !== -1) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x !== 1) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x !== -1) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = currentTrack.color;
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? currentTrack.color : `${currentTrack.color}88`;
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });

    ctx.shadowBlur = 0;
  }, [snake, food, currentTrack.color]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Background Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentTrack.color} 0%, transparent 70%)`
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <Music className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">Neon Rhythm</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Music & Snake Fusion</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Score</p>
            <p className="text-2xl font-mono font-bold text-cyan-400">{score.toString().padStart(4, '0')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">High Score</p>
            <p className="text-2xl font-mono font-bold" style={{ color: '#ff00ff' }}>{highScore.toString().padStart(4, '0')}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 flex flex-col lg:flex-row p-6 gap-6 items-center justify-center max-w-7xl mx-auto w-full">
        
        {/* Left: Music Info (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6 w-64">
          <motion.div 
            key={currentTrack.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title}
              className="w-full aspect-square object-cover rounded-xl mb-4 shadow-2xl shadow-black/50"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-lg font-bold truncate">{currentTrack.title}</h2>
            <p className="text-sm text-white/50 truncate">{currentTrack.artist}</p>
          </motion.div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Up Next</h3>
            <div className="space-y-3">
              {TRACKS.map((t, i) => (
                <div 
                  key={t.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${i === currentTrackIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => setCurrentTrackIndex(i)}
                >
                  <img src={t.cover} className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                    <p className="text-[10px] text-white/40 truncate">{t.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Game Window */}
        <div className="relative group">
          <div 
            className="absolute -inset-1 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
            style={{ backgroundColor: currentTrack.color }}
          />
          <div className="relative bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <canvas 
              ref={canvasRef}
              width={500}
              height={500}
              className="max-w-full aspect-square cursor-none"
            />

            {/* Game Over Overlay */}
            <AnimatePresence>
              {(isGameOver || isPaused) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center text-center p-6"
                >
                  <div className="flex flex-col items-center">
                    {isGameOver ? (
                      <>
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Game Over</h2>
                        <p className="text-white/60 mb-8">Final Score: {score}</p>
                        <button 
                          onClick={resetGame}
                          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" /> Try Again
                        </button>
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-16 h-16 text-cyan-400 mb-4 opacity-50" />
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Paused</h2>
                        <p className="text-white/40 mb-8">Press SPACE to resume</p>
                        <button 
                          onClick={() => setIsPaused(false)}
                          className="px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-colors"
                        >
                          Resume Game
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Controls Hint */}
          <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-4 text-[10px] text-white/30 uppercase tracking-widest">
            <span>Arrows to Move</span>
            <span>•</span>
            <span>Space to Pause</span>
          </div>
        </div>

        {/* Right: Stats/Info (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6 w-64">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Volume2 className="w-5 h-5 text-white/40 mb-4" />
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-6">
              <motion.div 
                className="h-full bg-cyan-400"
                animate={{ width: isPlaying ? '100%' : '0%' }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
              The snake's color syncs with the current track's mood. Keep moving to stay alive.
            </p>
          </div>
        </div>
      </main>

      {/* Footer: Music Controls */}
      <footer className="relative z-10 p-6 border-t border-white/10 backdrop-blur-xl bg-black/60">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          {/* Mobile Track Info */}
          <div className="flex lg:hidden items-center gap-4 w-full sm:w-auto">
            <img src={currentTrack.cover} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <h3 className="font-bold truncate">{currentTrack.title}</h3>
              <p className="text-xs text-white/50 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex-1 flex items-center justify-center gap-8">
            <button onClick={playPrev} className="p-2 text-white/60 hover:text-white transition-colors">
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/10"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button onClick={playNext} className="p-2 text-white/60 hover:text-white transition-colors">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Progress (Dummy) */}
          <div className="hidden sm:block w-48">
            <div className="flex justify-between text-[10px] text-white/40 mb-2 uppercase tracking-widest">
              <span>0:45</span>
              <span>3:20</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/40 w-1/3" />
            </div>
          </div>
        </div>
      </footer>

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={playNext}
        className="hidden"
      />
    </div>
  );
}
