import { useState, useEffect } from 'react';
import ShiftShift from './components/ShiftShift';
import IntroScreen from './components/IntroScreen';
import { GAME_THEME } from './theme';

interface HighScore {
  name: string;
  score: number;
  moves: number;
  time: number;
  maxLevel?: number;
}

function App() {
  const [playerName, setPlayerName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [forceTutorial, setForceTutorial] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(!!localStorage.getItem('shift_shift_has_played'));

  // maxUnlockedLevel state deleted
  // const [selectedLevel, setSelectedLevel] = useState(1); // Deleted

  const loadData = () => {
    const savedScores = localStorage.getItem('shift_shift_highscores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }

    // shift_shift_level ignored for Arcade Mode
  };

  useEffect(() => {
    loadData();
  }, [isPlaying]); // Reload data when returning to lobby

  const [sessionScore, setSessionScore] = useState(0);

  const handleLevelComplete = (levelPoints: number) => {
    setSessionScore(prev => prev + levelPoints);
  };

  const saveHighScore = (finalScore: number, maxLevel: number) => {
    if (finalScore === 0) return;

    const newEntry: HighScore = {
      name: playerName,
      score: finalScore,
      moves: 0,
      time: 0,
      maxLevel: maxLevel
    };

    const newScores = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setHighScores(newScores);
    localStorage.setItem('shift_shift_highscores', JSON.stringify(newScores));
  };

  const startGame = () => {
    if (!playerName.trim()) return;
    setIsPlaying(true);
    setForceTutorial(false);
    setSessionScore(0);
  };

  const startTutorial = () => {
    setPlayerName('TUT');
    setForceTutorial(true);
    setIsPlaying(true);
    setSessionScore(0);
  };

  if (isPlaying) {
    return (
      <div className={`h-screen md:min-h-screen ${GAME_THEME.colors.appBg} flex flex-col md:flex-row items-center justify-center p-0 md:p-8 ${GAME_THEME.colors.textMain} relative overflow-hidden transition-colors duration-500`}>
        <ShiftShift
          playerName={playerName || 'TUT'}
          onExit={(ml: number) => {
            saveHighScore(sessionScore, ml);
            setIsPlaying(false);
            setForceTutorial(false);
          }}
          isTutorial={forceTutorial || !hasPlayed}
          initialLevel={1}
          sessionScore={sessionScore}
          onLevelComplete={handleLevelComplete}
          personalBest={highScores.find(s => s.name === playerName)?.score}
          onTutorialComplete={() => {
            localStorage.setItem('shift_shift_has_played', 'true');
            setHasPlayed(true);
            setForceTutorial(false);
          }}
        />
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className={`min-h-screen ${GAME_THEME.colors.appBg} flex items-center justify-center ${GAME_THEME.colors.textMain} font-sans transition-colors duration-500`}>
        <IntroScreen onStart={() => setShowIntro(false)} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${GAME_THEME.colors.appBg} flex items-center justify-center p-4 md:p-8 ${GAME_THEME.colors.textMain} font-sans transition-colors duration-500`}>
      <div className="max-w-md w-full flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className={`text-6xl ${GAME_THEME.colors.textMain} tracking-tighter font-display`}>Shift / Shift</h1>
          <p className={GAME_THEME.colors.textDim}>Get your shift back together.</p>
        </div>

        <div className={`${GAME_THEME.colors.panelBg} p-6 ${GAME_THEME.layout.radiusLg || 'rounded-3xl'} ${GAME_THEME.layout.shadowLg} space-y-6 border ${GAME_THEME.colors.panelBorder}`}>
          <div className="space-y-2">
            <label className={`text-sm font-bold ${GAME_THEME.colors.textAccent} uppercase tracking-wider font-display w-full text-center block`}>Manager initials</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="ABC"
              className={`w-full ${GAME_THEME.colors.cellEmpty} ${GAME_THEME.colors.cellEmptyBorder} ${GAME_THEME.layout.radius} px-4 py-6 text-4xl outline-none transition-colors placeholder:${GAME_THEME.colors.textDim} font-black tracking-widest ${GAME_THEME.colors.textMain} text-center uppercase`}
              maxLength={3}
            />
          </div>

          {/* Level Select */}
          <button
            onClick={startGame}
            disabled={!playerName.trim()}
            className={`w-full ${GAME_THEME.colors.btnPrimary} font-bold text-xl py-4 ${GAME_THEME.layout.radius} transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            START SHIFT
          </button>

          <button
            onClick={startTutorial}
            className={`w-full ${GAME_THEME.colors.btnReset} font-bold text-sm py-3 ${GAME_THEME.layout.radius} transition-all active:scale-95 mt-2`}
          >
            REDO TUTORIAL
          </button>
        </div>

        {highScores.length > 0 && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold ${GAME_THEME.colors.textAccent} uppercase tracking-wider text-center font-display`}>Top Shift Managers</h2>
            <div className={`${GAME_THEME.colors.panelBg} ${GAME_THEME.layout.radius} border ${GAME_THEME.colors.panelBorder} overflow-hidden`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${GAME_THEME.colors.panelBorder} text-xs ${GAME_THEME.colors.textDim} font-bold uppercase tracking-wider`}>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Manager</th>
                    <th className="px-4 py-3 text-center">Max Level</th>
                    <th className="px-4 py-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {highScores.map((s, i) => (
                    <tr key={i} className={`border-b ${GAME_THEME.colors.panelBorder} last:border-0 hover:${GAME_THEME.colors.appBg} transition-colors`}>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={`${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-600' : 'text-zinc-300'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${GAME_THEME.colors.textMain}`}>{s.name}</td>
                      <td className={`px-4 py-3 font-mono ${GAME_THEME.colors.textAccent} font-bold text-center`}>{s.maxLevel || '-'}</td>
                      <td className={`px-4 py-3 font-mono ${GAME_THEME.colors.textAccent} font-bold text-right`}>{s.score.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
