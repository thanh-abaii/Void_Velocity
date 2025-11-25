
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, ShipShape, HighScoreEntry, GameAssets, AsteroidType } from './types';
import { generateMissionBriefing, generateCrashReport, generateShipDesign, generateAsteroidAsset } from './services/geminiService';
import { 
  COLOR_PALETTE, SHIP_COLORS, PLAYER_MAX_SHIELD, 
  STORAGE_KEY_HIGH_SCORES, MAX_HIGH_SCORES, 
  LEVEL_THRESHOLDS, LEVEL_NAMES 
} from './constants';
import { initAudio, playLevelUp } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(PLAYER_MAX_SHIELD);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [aiMessage, setAiMessage] = useState<string>("Initializing system...");
  const [isLoading, setIsLoading] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUpScreen, setShowLevelUpScreen] = useState(false);
  
  // Customization State
  const [shipColor, setShipColor] = useState<string>(SHIP_COLORS[0]);
  const [shipShape, setShipShape] = useState<ShipShape>('X-VANGUARD');
  
  // Asset Generation State
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0); // 0-100
  const [gameAssets, setGameAssets] = useState<GameAssets>({
    ship: null,
    asteroids: {
      CARBON: null,
      METALLIC: null,
      MAGMA: null,
      ICE: null
    }
  });

  // High Scores State
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
  const [showHighScores, setShowHighScores] = useState(false);

  useEffect(() => {
    // Initial Mission Briefing
    const fetchBriefing = async () => {
      setIsLoading(true);
      const msg = await generateMissionBriefing();
      setAiMessage(msg);
      setIsLoading(false);
    };
    fetchBriefing();

    // Load High Scores
    const savedScores = localStorage.getItem(STORAGE_KEY_HIGH_SCORES);
    if (savedScores) {
      try {
        const parsed = JSON.parse(savedScores);
        setHighScores(parsed);
        if (parsed.length > 0) {
          setHighScore(parsed[0].score);
        }
      } catch (e) {
        console.error("Failed to parse high scores");
      }
    }
  }, []);

  // Level Up Logic
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;
    const nextLevel = level + 1;
    if (nextLevel <= LEVEL_THRESHOLDS.length && score >= LEVEL_THRESHOLDS[nextLevel - 1]) {
      setLevel(nextLevel);
      setShowLevelUpScreen(true);
      playLevelUp();
      setTimeout(() => setShowLevelUpScreen(false), 2500);
    }
  }, [score, gameState, level]);

  const startGame = () => {
    initAudio(); // Initialize audio context on user interaction
    setGameState(GameState.PLAYING);
    setScore(0);
    setLevel(1);
  };

  const updateHighScores = useCallback((finalScore: number) => {
    const newEntry: HighScoreEntry = { score: finalScore, date: new Date().toISOString() };
    const updatedScores = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HIGH_SCORES);
    setHighScores(updatedScores);
    localStorage.setItem(STORAGE_KEY_HIGH_SCORES, JSON.stringify(updatedScores));
    if (updatedScores.length > 0) setHighScore(updatedScores[0].score);
  }, [highScores]);

  const handleGameOver = useCallback(async (finalScore: number, timeSurvived: number) => {
    setGameState(GameState.GAME_OVER);
    setScore(finalScore);
    setFinalTime(timeSurvived);
    updateHighScores(finalScore);

    setIsLoading(true);
    setAiMessage("Analyzing black box data...");
    const report = await generateCrashReport(finalScore, timeSurvived);
    setAiMessage(report);
    setIsLoading(false);
  }, [updateHighScores]);

  // Generate All Assets (Ship + Asteroids)
  const handleGenerateWorld = async () => {
    setIsGeneratingAssets(true);
    setGenerationProgress(0);
    setAiMessage("Initializing Gemini Nano Banana Protocol...");

    try {
      // 1. Generate Ship
      setAiMessage("Fabricating starfighter hull...");
      const shipSprite = await generateShipDesign(shipColor, shipShape);
      setGenerationProgress(20);

      // 2. Generate Asteroids
      const asteroidTypes: {type: AsteroidType, desc: string}[] = [
        { type: 'CARBON', desc: 'grey rocky asteroid, cratered' },
        { type: 'METALLIC', desc: 'shiny silver metallic asteroid, geometric' },
        { type: 'MAGMA', desc: 'volcanic glowing red magma rock' },
        { type: 'ICE', desc: 'translucent blue ice crystal asteroid' }
      ];

      const newAsteroidAssets = { ...gameAssets.asteroids };

      for (let i = 0; i < asteroidTypes.length; i++) {
        setAiMessage(`Simulating ${asteroidTypes[i].type} matter...`);
        const asset = await generateAsteroidAsset(asteroidTypes[i].type, asteroidTypes[i].desc);
        if (asset) newAsteroidAssets[asteroidTypes[i].type] = asset;
        setGenerationProgress(20 + ((i + 1) * 20));
      }

      setGameAssets({
        ship: shipSprite || gameAssets.ship,
        asteroids: newAsteroidAssets
      });

      setAiMessage("World generation complete.");
    } catch (e) {
      setAiMessage("Generation failed. Systems critical.");
    } finally {
      setIsGeneratingAssets(false);
      setGenerationProgress(100);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-mono text-white select-none">
      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        setScore={setScore}
        setShield={setShield}
        setWeaponLevel={setWeaponLevel}
        shipColor={shipColor}
        shipShape={shipShape}
        level={level}
        assets={gameAssets}
      />

      {/* Level Up Overlay */}
      {showLevelUpScreen && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-cyan-500/10 backdrop-blur-sm animate-[pulse_0.5s_ease-in-out]">
           <div className="text-center transform scale-150 transition-transform duration-500">
              <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300 animate-[gradient_1s_infinite]">HYPERSPACE JUMP</h2>
              <p className="text-xl text-cyan-200 mt-2 tracking-[1em] uppercase">Entering {LEVEL_NAMES[level - 1] || `Level ${level}`}</p>
           </div>
        </div>
      )}

      {/* UI Overlay - Play Mode */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-10 flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="flex flex-col w-64">
                <span className="text-xs text-cyan-400 uppercase tracking-widest mb-1 flex justify-between">
                  <span>Shield Integrity</span>
                  <span>{Math.floor((shield / PLAYER_MAX_SHIELD) * 100)}%</span>
                </span>
                <div className="w-full h-3 bg-gray-800/80 border border-gray-600 rounded-sm overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 ease-out"
                    style={{ width: `${(shield / PLAYER_MAX_SHIELD) * 100}%` }}
                  />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDFWMGgxVjF6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMikiLz48L3N2Zz4=')] opacity-50"></div>
                </div>
                {shield < 200 && <span className="text-[10px] text-red-500 mt-1 animate-pulse font-bold">WARNING: SHIELD CRITICAL</span>}
             </div>

             <div className="flex flex-col items-center opacity-80">
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Current Sector</span>
                <span className="text-lg font-bold text-cyan-100">{LEVEL_NAMES[level - 1] || `LEVEL ${level}`}</span>
             </div>

            <div className="flex flex-col text-right">
              <span className="text-xs text-cyan-400 uppercase tracking-widest">Data Fragments</span>
              <span className="text-4xl font-bold font-mono tabular-nums" style={{ textShadow: `0 0 10px ${COLOR_PALETTE.primary}` }}>
                {score.toString().padStart(6, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <span className="text-xs text-red-400 uppercase tracking-widest">Weapons</span>
             <div className="flex gap-1">
                {[1, 2, 3].map(lvl => (
                  <div key={lvl} className={`w-8 h-1.5 rounded-sm transition-all ${weaponLevel >= lvl ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,85,0.8)]' : 'bg-gray-800'}`}/>
                ))}
             </div>
             <span className="text-xs text-red-300 ml-2">{weaponLevel === 3 ? 'MAX' : `LVL ${weaponLevel}`}</span>
          </div>
          
          <div className="absolute top-16 right-4 flex flex-col items-end opacity-50">
            <span className="text-[10px] text-purple-400 uppercase tracking-widest">All-Time Best</span>
            <span className="text-sm font-bold text-purple-300">{highScore.toString().padStart(6, '0')}</span>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full p-8 bg-black/80 border border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.2)] rounded-lg text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>

            <h1 className="text-5xl font-black italic mb-2 tracking-tighter" style={{ color: COLOR_PALETTE.primary }}>VOID<span className="text-white">VELOCITY</span></h1>
            <p className="text-sm text-gray-400 mb-4 uppercase tracking-[0.2em]">Hyper-Speed Survival Protocol</p>

            {!showHighScores ? (
              <>
                <div className="mb-6 p-4 bg-cyan-900/20 border border-cyan-800/50 rounded text-left">
                  <h3 className="text-xs text-cyan-400 mb-1 uppercase font-bold">Mission Briefing // VOID-AI</h3>
                  <p className={`text-sm leading-relaxed ${isLoading || isGeneratingAssets ? 'animate-pulse' : ''} text-cyan-100`}>
                    {isLoading || isGeneratingAssets ? (isGeneratingAssets ? aiMessage : "Decrypting...") : `"${aiMessage}"`}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-bold">Hangar Configuration</h3>
                  
                  <div className="flex justify-center gap-3 mb-4">
                    {SHIP_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => { setShipColor(color); setGameAssets(prev => ({...prev, ship: null})); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${shipColor === color ? 'border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-center gap-2 mb-4">
                    {(['X-VANGUARD', 'A-VELOCITY', 'Y-FORTRESS'] as ShipShape[]).map((shape) => (
                      <button
                        key={shape}
                        onClick={() => { setShipShape(shape); setGameAssets(prev => ({...prev, ship: null})); }}
                        className={`px-3 py-1 text-xs uppercase tracking-wider border transition-all duration-200 rounded-sm ${shipShape === shape ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>

                   <button 
                     onClick={handleGenerateWorld}
                     disabled={isGeneratingAssets || isLoading}
                     className="w-full py-2 mb-4 text-xs uppercase tracking-wider border border-purple-500 text-purple-400 hover:bg-purple-900/30 transition-all rounded disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
                   >
                     {isGeneratingAssets ? (
                        <>
                          <div className="absolute left-0 top-0 bottom-0 bg-purple-900/50 transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
                          <span className="relative z-10 animate-pulse">Generating Assets {generationProgress}%</span>
                        </>
                     ) : (
                       <><span>◆ Generate World Assets (Nano Banana)</span></>
                     )}
                   </button>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={startGame}
                    disabled={isLoading || isGeneratingAssets}
                    className="group relative w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-500 transition-all duration-200 rounded overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative font-bold tracking-widest uppercase text-white">Initiate Launch</span>
                  </button>

                  <button onClick={() => setShowHighScores(true)} className="w-full py-2 px-4 border border-cyan-900 text-cyan-500 hover:bg-cyan-900/30 hover:border-cyan-500 transition-all duration-200 rounded text-xs uppercase tracking-widest">
                    View High Scores
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-fadeIn">
                <div className="mb-6 p-4 bg-black/40 border border-gray-800 rounded max-h-[300px] overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs text-purple-400 mb-4 uppercase font-bold border-b border-purple-900 pb-2">Top 5 Pilots</h3>
                  {highScores.length === 0 ? <p className="text-sm text-gray-500 py-4">No data found. Be the first.</p> : (
                    <table className="w-full text-sm text-left">
                      <thead><tr className="text-gray-600 text-xs uppercase"><th className="pb-2">Rank</th><th className="pb-2 text-right">Score</th><th className="pb-2 text-right">Date</th></tr></thead>
                      <tbody>
                        {highScores.map((entry, index) => (
                          <tr key={index} className="border-b border-gray-800 last:border-0 hover:bg-white/5 transition-colors">
                            <td className="py-2 text-cyan-500 font-bold">#{index + 1}</td>
                            <td className="py-2 text-right font-mono text-white">{entry.score}</td>
                            <td className="py-2 text-right text-gray-500 text-xs">{new Date(entry.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <button onClick={() => setShowHighScores(false)} className="w-full py-3 px-6 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded text-xs uppercase tracking-widest text-gray-300">Back to Hangar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-red-900/20 backdrop-blur-md">
          <div className="max-w-md w-full p-8 bg-black/90 border border-red-500/50 shadow-[0_0_50px_rgba(255,0,85,0.3)] rounded-lg text-center relative">
             <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
             <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

            <h2 className="text-4xl font-bold text-red-500 mb-2 tracking-tight">SIGNAL LOST</h2>
            <div className="flex justify-center space-x-8 mb-6 text-gray-300">
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Data Fragments</span><span className="text-2xl font-mono">{score}</span></div>
              <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase">Time</span><span className="text-2xl font-mono">{finalTime.toFixed(1)}s</span></div>
            </div>

            <div className="mb-8 p-4 bg-red-900/20 border border-red-800/50 rounded text-left">
              <h3 className="text-xs text-red-400 mb-1 uppercase font-bold">Crash Analysis // VOID-AI</h3>
               <p className={`text-sm leading-relaxed ${isLoading ? 'animate-pulse' : ''} text-red-100`}>
                {isLoading ? "Retrieving black box data..." : `"${aiMessage}"`}
              </p>
            </div>

            <button onClick={startGame} disabled={isLoading} className="w-full py-3 px-6 border border-white/20 hover:bg-white/10 hover:border-white/50 transition-all duration-200 rounded text-sm uppercase tracking-widest">Retry Mission</button>
            <button onClick={() => setGameState(GameState.MENU)} className="mt-3 text-xs text-gray-500 hover:text-gray-300 uppercase tracking-widest">Return to Base</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
