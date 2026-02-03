import { useState, useEffect } from 'react';
import ShiftShift from './components/ShiftShift';
import IntroScreen from './components/IntroScreen';
import { GAME_THEME } from './theme';

interface HighScore {
  name: string;
  score: number;
  moves: number;
  time: number;
}

function App() {
  const [playerName, setPlayerName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [forceTutorial, setForceTutorial] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(!!localStorage.getItem('shift_shift_has_played'));

  const loadHighScores = () => {
    const savedScores = localStorage.getItem('shift_shift_highscores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  };

  useEffect(() => {
    loadHighScores();
  }, [isPlaying]); // Reload scores when returning to lobby

  const startGame = () => {
    if (!playerName.trim()) return;
    setIsPlaying(true);
    setForceTutorial(false); // Reset default unless explicit tutorial requested? 
    // Actually, if we want to "Redo Tutorial", we initiate play with tutorial flag.
  };

  const startTutorial = () => {
    setPlayerName('TUT'); // Default name for tutorial? Or keep empty?
    setForceTutorial(true);
    setIsPlaying(true);
  };

  if (isPlaying) {
    return (
      <div className={`min-h-screen ${GAME_THEME.colors.appBg} flex items-center justify-center p-8 ${GAME_THEME.colors.textMain} relative overflow-hidden transition-colors duration-500`}>
        <ShiftShift
          playerName={playerName || 'TUT'}
          onExit={() => {
            setIsPlaying(false);
            setForceTutorial(false);
          }}
          isTutorial={forceTutorial || !hasPlayed}
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
    <div className={`min-h-screen ${GAME_THEME.colors.appBg} flex items-center justify-center p-8 ${GAME_THEME.colors.textMain} font-sans transition-colors duration-500`}>
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
          <button
            onClick={startGame}
            disabled={!playerName.trim()}
            className={`w-full ${GAME_THEME.colors.btnPrimary} font-bold text-xl py-4 ${GAME_THEME.layout.radius} transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            START
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
            <h2 className={`text-sm font-bold ${GAME_THEME.colors.textAccent} uppercase tracking-wider text-center font-display`}>Top Managers</h2>
            <div className={`${GAME_THEME.colors.panelBg} ${GAME_THEME.layout.radius} border ${GAME_THEME.colors.panelBorder} overflow-hidden`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${GAME_THEME.colors.panelBorder} text-xs ${GAME_THEME.colors.textDim} font-bold uppercase tracking-wider`}>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Manager</th>
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
