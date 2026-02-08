import { useState, useEffect } from 'react';
import { useDragControls, motion, AnimatePresence } from 'framer-motion';
import { Eye, RefreshCw } from 'lucide-react';
import Row from './Row';
import Column from './Column';
import { GAME_THEME } from '../theme';
import type { TutorialStep } from './TutorialOverlay';
import TutorialOverlay from './TutorialOverlay';
import GhostHand from './GhostHand';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
// Level Configuration
const MAX_LEVEL_GRID = 10;
const START_GRID_SIZE = 3; // Start 3x3

const generateLevelConfig = (level: number) => {
    // Level 1-3: 3x3
    // Level 4-6: 4x4
    // etc.
    const sizeIncrease = Math.floor((level - 1) / 3);
    const size = Math.min(MAX_LEVEL_GRID, START_GRID_SIZE + sizeIncrease);

    // Scramble steps: 5 + (level-1)*2
    const scrambleSteps = 5 + (level - 1) * 2;

    // Density: 0.4 + (level * 0.02) -> Max 0.7
    // Level 1: 0.42
    // Level 10: 0.6
    const density = Math.min(0.7, 0.4 + (level * 0.02));

    return {
        rows: size,
        cols: size,
        scrambleSteps,
        density
    };
};


// Pure helper functions
const generateInitials = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
};

const generateGrid = (rows: number, cols: number, density: number) => {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() < density ? 1 : 0))
    );
};

const getShiftedRow = (row: number[], direction: 'left' | 'right') => {
    const newRow = [...row];
    if (direction === 'right') {
        const last = newRow.pop()!;
        newRow.unshift(last);
    } else {
        const first = newRow.shift()!;
        newRow.push(first);
    }
    return newRow;
};

const getShiftedColumn = (grid: number[][], colIndex: number, direction: 'up' | 'down') => {
    const rows = grid.length;
    const newGrid = grid.map((row) => [...row]);
    const column = newGrid.map((row) => row[colIndex]);

    if (direction === 'down') {
        const last = column.pop()!;
        column.unshift(last);
    } else {
        const first = column.shift()!;
        column.push(first);
    }

    for (let i = 0; i < rows; i++) {
        newGrid[i][colIndex] = column[i];
    }
    return newGrid;
};

const checkWin = (currentGrid: number[][], targetGrid: number[][]) => {
    if (targetGrid.length === 0) return false;
    return JSON.stringify(currentGrid) === JSON.stringify(targetGrid);
};

interface ShiftShiftProps {
    playerName: string;
    onExit: (maxLevel: number) => void;
    isTutorial?: boolean;
    initialLevel?: number;
    sessionScore: number;
    onLevelComplete?: (score: number) => void;
    onTutorialComplete?: () => void;
    personalBest?: number;
}

export default function ShiftShift({

    onExit,
    isTutorial = false,
    onTutorialComplete,
    initialLevel = 1,
    sessionScore,
    onLevelComplete,
    personalBest
}: ShiftShiftProps) {
    const [currentLevel, setCurrentLevel] = useState(initialLevel);
    const [grid, setGrid] = useState<number[][]>([]);
    const [targetGrid, setTargetGrid] = useState<number[][]>([]);
    const [employees, setEmployees] = useState<string[]>([]);
    const [gamePhase, setGamePhase] = useState<'memorize' | 'playing' | 'level_complete' | 'won' | 'shift_over'>('memorize');

    // Level Score (just for this level's victory screen)
    const [levelScore, setLevelScore] = useState(0);

    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isPeeking, setIsPeeking] = useState(false);
    const [startMessage, setStartMessage] = useState(false);

    // Tutorial State
    const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(isTutorial ? 'watch' : null);

    // Tutorial Animation State
    const [scramblingState, setScramblingState] = useState<{
        rowAnim?: 'left' | 'right' | null;
        colAnim?: 'up' | 'down' | null;
    }>({});

    // Column Drag State
    const [draggingCol, setDraggingCol] = useState<number | null>(null);

    // Key Remount State
    const [gridVersion, setGridVersion] = useState(0);

    // Score Animation State
    const [displayScore, setDisplayScore] = useState(sessionScore);

    // Animate Score
    useEffect(() => {
        if (displayScore < sessionScore) {
            const diff = sessionScore - displayScore;
            const step = Math.ceil(diff / 10);
            const t = setTimeout(() => setDisplayScore(s => Math.min(sessionScore, s + step)), 50);
            return () => clearTimeout(t);
        } else if (displayScore > sessionScore) {
            setDisplayScore(sessionScore);
        }
    }, [sessionScore, displayScore]);

    // ... drag controls ...
    const colControl0 = useDragControls();
    const colControl1 = useDragControls();
    const colControl2 = useDragControls();
    const colControl3 = useDragControls();
    const colControl4 = useDragControls();
    const colControl5 = useDragControls();
    const colControl6 = useDragControls();
    const colControl7 = useDragControls();
    const colControl8 = useDragControls();
    const colControl9 = useDragControls();
    const colControls = [colControl0, colControl1, colControl2, colControl3, colControl4, colControl5, colControl6, colControl7, colControl8, colControl9];

    // Initialize Game
    useEffect(() => {
        const config = generateLevelConfig(currentLevel);
        const effectiveConfig = isTutorial ? { rows: 4, cols: 5, density: 0.5, scrambleSteps: 0 } : config;

        const initialGrid = generateGrid(effectiveConfig.rows, effectiveConfig.cols, effectiveConfig.density);
        setGrid(initialGrid);
        setTargetGrid(initialGrid);

        setEmployees(Array.from({ length: effectiveConfig.rows }, generateInitials));
        setGamePhase('memorize');

        setMoves(0);
        setSeconds(0);
        setGridVersion(0);
        setStartMessage(false);
    }, [isTutorial, currentLevel]); // Run once on mount (and if tutorial changes?)

    // Clear start message after delay
    useEffect(() => {
        if (startMessage) {
            const t = setTimeout(() => setStartMessage(false), 3000);
            return () => clearTimeout(t);
        }
    }, [startMessage]);

    // Scramble Logic - Tutorial
    useEffect(() => {
        if (!isTutorial) return;

        // Sequence: 
        // 1. Watch (3s)
        // 2. Animate Row 1 Right (scrambling)
        // 3. Update Grid (Callback handles next step)

        // Step 1: Initial Delay for Watch
        const t1 = setTimeout(() => {
            setTutorialStep('scrambling');
            setGamePhase('playing');

            // Trigger Row Animation
            setScramblingState({ rowAnim: 'right' });
        }, 3000);

        return () => {
            clearTimeout(t1);
        };
    }, [isTutorial]);

    // Tutorial Animation Callbacks
    const onRowScrambleComplete = () => {
        // Row Animation Done.
        // 1. Update Grid
        setGrid(g => {
            const newG = [...g.map(r => [...r])];
            newG[1] = getShiftedRow(newG[1], 'right');
            return newG;
        });
        setGridVersion(v => v + 1);

        // 2. Clear Anim State
        setScramblingState({});

        // 3. Wait 500ms then Trigger Col Animation
        setTimeout(() => {
            setDraggingCol(3); // Hide cells during animation
            setScramblingState({ colAnim: 'down' });
        }, 500);
    };

    const onColScrambleComplete = () => {
        // Col Animation Done
        setGrid(g => {
            const newG = getShiftedColumn(g, 3, 'down');
            return newG;
        });
        setGridVersion(v => v + 1);

        setScramblingState({});
        setDraggingCol(null); // Reset visibility

        // Wait 1s then Show Fix Overlay
        setTimeout(() => {
            setTutorialStep('fix_col_info');
        }, 1000);
    };

    // Scramble Logic - Standard Game
    useEffect(() => {
        if (isTutorial || gamePhase !== 'memorize' || targetGrid.length === 0) return;

        // Use level config for steps
        const config = generateLevelConfig(currentLevel);
        const steps = config.scrambleSteps;

        const scrambleTimer = setTimeout(() => {
            let currentScrambledGrid = [...targetGrid.map(row => [...row])];
            const rows = currentScrambledGrid.length;
            const cols = currentScrambledGrid[0].length;

            // Perform random moves
            for (let k = 0; k < steps; k++) {
                const isRow = Math.random() > 0.5;
                if (isRow) {
                    const rowIndex = Math.floor(Math.random() * rows);
                    const direction = Math.random() > 0.5 ? 'left' : 'right';
                    const row = currentScrambledGrid[rowIndex];
                    currentScrambledGrid[rowIndex] = getShiftedRow(row, direction);
                } else {
                    const colIndex = Math.floor(Math.random() * cols);
                    const direction = Math.random() > 0.5 ? 'up' : 'down';
                    currentScrambledGrid = getShiftedColumn(currentScrambledGrid, colIndex, direction);
                }
            }

            setGrid(currentScrambledGrid);
            setGamePhase('playing');
            setMoves(0);
            setGridVersion(v => v + 1); // Ensure fresh rows on game start
            setStartMessage(true); // Trigger "Oh Shift!" message
        }, 3000);

        return () => clearTimeout(scrambleTimer);
    }, [targetGrid, gamePhase, isTutorial, currentLevel]);

    // Timer Logic
    useEffect(() => {
        let timer: number;
        // Don't count time if we are in tutorial modes that aren't "finish" or null?
        if (gamePhase === 'playing' && !tutorialStep) {
            timer = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gamePhase, tutorialStep]);

    // Keyboard Peek Interaction
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && gamePhase === 'playing') {
                e.preventDefault(); // Prevent scrolling
                setIsPeeking(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsPeeking(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gamePhase]);

    // Tutorial Helper
    const advanceTutorial = () => {
        // 'watch' is auto-advanced by timer now
        if (tutorialStep === 'fix_col_info') setTutorialStep('fix_col');
        else if (tutorialStep === 'fix_row_info') setTutorialStep('fix_row');
        else if (tutorialStep === 'peek_info') setTutorialStep('finish');
        else if (tutorialStep === 'finish') {
            setTutorialStep(null);
            if (onTutorialComplete) onTutorialComplete();

            // Reset for actual game
            initializeGame();
        }
    };

    // Handler triggers for tutorial
    const handleTutorialAction = (action: 'col' | 'row') => {
        if (tutorialStep === 'fix_col' && action === 'col') {
            setTutorialStep('fix_row_info');
        } else if (tutorialStep === 'fix_row' && action === 'row') {
            // New Flow: Fix Row -> Peek Info
            setTutorialStep('peek_info');
        }
    };

    // New Handler for Column Drag
    const handleColDragStart = (colIndex: number) => {
        setDraggingCol(colIndex);
    };

    const handleColDragEnd = (colIndex: number, shift: number) => {
        setDraggingCol(null);
        if (shift === 0) return;

        const direction = shift > 0 ? 'down' : 'up';

        // Tutorial check
        if (tutorialStep === 'fix_col') {
            // Require UP shift (negative shift / 'up' dir)
            if (colIndex === 3 && direction === 'up') {
                handleTutorialAction('col');
            } else {
                return;
            }
        } else if (tutorialStep) {
            return; // Should be blocked by DragStart but double check
        }

        const validShift = Math.abs(shift);

        // Calculate new grid based on current state (safe since handlers are recreated on render)
        const newGrid = [...grid.map(r => [...r])]; // Deep copy
        const column = newGrid.map(r => r[colIndex]);

        for (let k = 0; k < validShift; k++) {
            if (direction === 'down') {
                const last = column.pop()!;
                column.unshift(last);
            } else {
                const first = column.shift()!;
                column.push(first);
            }
        }

        for (let i = 0; i < grid.length; i++) {
            newGrid[i][colIndex] = column[i];
        }

        setGrid(newGrid);

        if (!isTutorial && checkWin(newGrid, targetGrid)) {
            setTimeout(() => winGame(), 0);
        }

        // Trigger auto-advance if it was the correct move
        // Note: we called handleTutorialAction inside logic (which sets state), 
        // but we still want the standard move logic to run.

        setMoves(m => m + 1);
        setGridVersion(v => v + 1);
    };

    const winGame = () => {
        setGamePhase('level_complete');

        // Calculate Score
        // Re-generate config to get scrambleSteps
        const config = generateLevelConfig(currentLevel);
        // Tutorial override? Tutorial has 0 scrambleSteps usually?
        // Use 5 for tutorial base if needed, or just 0 so penalty is higher?
        // Actually tutorial doesn't score usually.

        const minMoves = isTutorial ? 5 : config.scrambleSteps;
        const excessMoves = Math.max(0, moves - minMoves);

        const movePenalty = excessMoves * 50;
        const timePenalty = seconds * 5;

        const rawScore = Math.max(0, 1000 - movePenalty - timePenalty);
        const finalLevelScore = rawScore * currentLevel;

        setLevelScore(finalLevelScore);

        if (onLevelComplete) {
            onLevelComplete(finalLevelScore);
        }

        if (!isTutorial) {
            const stored = parseInt(localStorage.getItem('shift_shift_level') || '1', 10);
            if (currentLevel + 1 > stored) {
                localStorage.setItem('shift_shift_level', (currentLevel + 1).toString());
            }
        }
    };

    // deleted saveScore


    // NEW: Handle Row Drag End from Row.tsx
    const handleRowDragEnd = (idx: number, shift: number) => {
        if (shift === 0) return;

        const direction = shift > 0 ? 'right' : 'left';

        // Tutorial Check
        if (tutorialStep === 'fix_row') {
            // Require LEFT shift
            if (idx === 1 && direction === 'left') {
                handleTutorialAction('row');
            } else {
                return;
            }
        } else if (tutorialStep) {
            return;
        }

        const validShift = Math.abs(shift);

        const newGrid = [...grid];
        const currentRow = [...newGrid[idx]];

        for (let k = 0; k < validShift; k++) {
            if (direction === 'right') {
                const last = currentRow.pop()!;
                currentRow.unshift(last);
            } else {
                const first = currentRow.shift()!;
                currentRow.push(first);
            }
        }
        newGrid[idx] = currentRow;

        setGrid(newGrid);

        if (!isTutorial && checkWin(newGrid, targetGrid)) {
            setTimeout(() => winGame(), 0);
        }

        setMoves(m => m + 1);
        setGridVersion(v => v + 1); // Remounts rows to prevent animation blink
    };

    const initializeGame = (level = currentLevel) => {
        // Re-init game
        const config = generateLevelConfig(level);
        const initialGrid = generateGrid(config.rows, config.cols, config.density);

        setGrid(initialGrid);
        setTargetGrid(initialGrid);
        setEmployees(Array.from({ length: config.rows }, generateInitials));
        setGamePhase('memorize');
        setMoves(0);
        setSeconds(0);
        setGridVersion(0);
        setStartMessage(false);
    }

    const handleNextLevel = () => {
        const next = currentLevel + 1;
        setCurrentLevel(next);
        initializeGame(next);
    };

    // Auto-Advance
    useEffect(() => {
        if (gamePhase === 'level_complete') {
            const t = setTimeout(() => {
                handleNextLevel();
            }, 3000); // 3 seconds delay
            return () => clearTimeout(t);
        }
    }, [gamePhase, handleNextLevel]);


    if (grid.length === 0) return null;



    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-[100vw] overflow-hidden relative bg-[#F2F7F6]">



            {/* Top HUD */}
            <div className="absolute top-4 left-0 right-0 px-6 flex flex-col items-center gap-4 z-20 max-w-2xl mx-auto w-full pointer-events-none">

                {/* Row 1: Stats */}
                <div className="flex justify-between items-start w-full pointer-events-auto">
                    {/* Level Badge */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#03372E]/60">Level</span>
                        <span className="text-2xl font-black text-[#03372E] font-display">{currentLevel}</span>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#03372E]/60">Score</span>
                        <span className="text-2xl font-black text-[#03372E] font-mono tracking-tight">{displayScore.toLocaleString()}</span>
                    </div>

                    {/* Time */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#03372E]/60">Time</span>
                        <div className="text-2xl font-black text-[#03372E] font-mono bg-[#E0E6E5] px-3 py-1 rounded-lg border border-white/50 min-w-[3ch] text-center">
                            {seconds}
                        </div>
                    </div>
                </div>


            </div>

            {/* Global Overlays - Moved to Root for Z-Index */}
            {/* Memorize Phase Indicator */}
            {gamePhase === 'memorize' && !isTutorial && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 w-64 z-50 animate-in slide-in-from-top-4 fade-in duration-500 pointer-events-none">
                    <div className={`${GAME_THEME.colors.msgMemoryBg} backdrop-blur-md border ${GAME_THEME.colors.msgMemoryBorder} ${GAME_THEME.colors.msgMemoryText} p-3 ${GAME_THEME.layout.radius} flex flex-col items-center gap-2 ${GAME_THEME.layout.shadowLg}`}>
                        <div className={`text-xs font-bold uppercase tracking-widest ${GAME_THEME.colors.msgMemoryTitle}`}>Remember the schedule</div>
                        <div className={`h-1.5 w-full ${GAME_THEME.colors.overlayBg} rounded-full overflow-hidden`}>
                            <div className={`h-full ${GAME_THEME.colors.indicatorPulse} rounded-full animate-[width_3s_linear_forwards] w-full origin-left`} style={{ animationName: 'shrinkWidth' }} />
                        </div>
                        <style>{`@keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }`}</style>
                    </div>
                </div>
            )}

            {/* Oh Shift Message */}
            {startMessage && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 w-72 z-50 animate-in zoom-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                    <div className={`${GAME_THEME.colors.msgAlertBg} backdrop-blur-md border ${GAME_THEME.colors.msgAlertBorder} ${GAME_THEME.colors.msgAlertText} p-4 ${GAME_THEME.layout.radius} flex flex-col items-center gap-1 ${GAME_THEME.layout.shadowLg} text-center`}>
                        <div className={`text-lg font-black uppercase italic tracking-tighter ${GAME_THEME.colors.msgAlertTitle}`}>Oh Shift!</div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-80">You need to get the shifts back!</div>
                    </div>
                </div>
            )}

            {/* Game Area Wrapper */}
            <motion.div
                className="z-10 relative"
                animate={{
                    scale: (gamePhase === 'level_complete' || gamePhase === 'shift_over') ? 0.9 : 1,
                    opacity: (gamePhase === 'level_complete' || gamePhase === 'shift_over') ? 0.4 : 1,
                    filter: (gamePhase === 'level_complete' || gamePhase === 'shift_over') ? 'blur(2px)' : 'blur(0px)'
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
                {/* Original Grid Container with Responsive Scale */}
                <div className={`flex flex-col gap-4 p-4 md:p-8 ${GAME_THEME.colors.panelBg} backdrop-blur-sm ${GAME_THEME.layout.radiusLg || 'rounded-3xl'} border ${GAME_THEME.colors.panelBorder} ${GAME_THEME.layout.shadowLg} relative scale-[0.72] sm:scale-75 md:scale-100 origin-top -mb-32 sm:-mb-24 md:mb-0`}>

                    {/* Top Controls: Reset & End (Desktop) */}
                    <div className="flex justify-between w-full pb-4 border-b border-[#03372E]/10 mb-2 pointer-events-auto z-20 relative">
                        <button
                            onClick={() => initializeGame()}
                            className={`group relative px-4 py-3 ${GAME_THEME.colors.btnReset} ${GAME_THEME.layout.radius} transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent hover:border-[#D4898F]/20`}
                            title="Reset Level"
                        >
                            <RefreshCw className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="font-bold text-xs">RESET</span>
                        </button>

                        <button
                            onClick={() => setGamePhase('shift_over')}
                            className={`group relative px-4 py-3 bg-white/50 hover:bg-white text-[#03372E] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent hover:border-[#03372E]/10`}
                            title="End Shift"
                        >
                            <span className="font-bold text-xs">END SHIFT</span>
                        </button>
                    </div>





                    {/* Grid Wrapper */}
                    <div className="relative flex flex-col gap-4">
                        {/* Columns Grid */}
                        <div className="flex items-center gap-4 z-20 relative">
                            <div className="w-12 flex-shrink-0" />
                            <div className="flex gap-4">
                                {grid.length > 0 && grid[0].map((_, colIndex) => {
                                    const colData = grid.map(row => row[colIndex]);
                                    const dayName = DAYS[colIndex] || `D${colIndex + 1}`;
                                    return (
                                        <div key={`col-wrapper-${colIndex}-${gridVersion}`} className="relative">
                                            <Column
                                                key={`col-${colIndex}-${gridVersion}`}
                                                colIndex={colIndex}
                                                header={dayName}
                                                colData={colData}
                                                gamePhase={gamePhase}
                                                dragControls={colControls[colIndex]}
                                                onDragStart={handleColDragStart}
                                                onDragEnd={handleColDragEnd}
                                                isDimmed={!!(tutorialStep && tutorialStep !== 'finish' && tutorialStep !== 'scrambling' && tutorialStep !== 'watch' && !(tutorialStep === 'fix_col' && colIndex === 3))}
                                                isLocked={!!(tutorialStep && !(tutorialStep === 'fix_col' && colIndex === 3))}
                                                scrambleAnim={colIndex === 3 ? scramblingState.colAnim : null}
                                                onScrambleComplete={onColScrambleComplete}
                                            />
                                            {tutorialStep === 'fix_col' && colIndex === 3 && (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"><GhostHand direction="up" /></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rows Content */}
                        {grid.map((row, rowIndex) => (
                            <div key={`row-wrapper-${rowIndex}-${gridVersion}`} className="relative">
                                <Row
                                    key={`${rowIndex}-${gridVersion}`}
                                    rowIndex={rowIndex}
                                    row={row}
                                    employee={employees[rowIndex]}
                                    gamePhase={gamePhase}
                                    isPeeking={isPeeking}
                                    hiddenColIndex={draggingCol}
                                    colControls={colControls}
                                    onDragEnd={handleRowDragEnd}
                                    isDimmed={!!(tutorialStep && tutorialStep !== 'finish' && tutorialStep !== 'scrambling' && tutorialStep !== 'watch' && !(tutorialStep === 'fix_row' && rowIndex === 1))}
                                    isLocked={!!(tutorialStep && !(tutorialStep === 'fix_row' && rowIndex === 1))}
                                    scrambleAnim={rowIndex === 1 ? scramblingState.rowAnim : null}
                                    onScrambleComplete={onRowScrambleComplete}
                                />
                                {tutorialStep === 'fix_row' && rowIndex === 1 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"><GhostHand direction="left" /></div>
                                )}
                            </div>
                        ))}

                        {/* Peek Overlay */}
                        {isPeeking && gamePhase === 'playing' && (
                            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col gap-4">
                                <div className="h-10 w-full" />
                                {targetGrid.map((row, rowIndex) => (
                                    <div key={`peek-row-${rowIndex}`} className="flex items-center gap-4 opacity-40">
                                        <div className="w-12 h-12 invisible" />
                                        <div className="flex gap-4">
                                            {row.map((cell, colIndex) => (
                                                <div key={`peek-${rowIndex}-${colIndex}`} className={`w-16 h-16 ${GAME_THEME.layout.radius} border-4 ${cell === 1 ? `${GAME_THEME.colors.cellShift} ${GAME_THEME.colors.cellShiftBorder}` : `${GAME_THEME.colors.cellEmpty} ${GAME_THEME.colors.cellEmptyBorder}`}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls: Peek (Full Width) */}
                    <div className="hidden md:flex w-full pt-4 border-t border-[#03372E]/10 mt-2 pointer-events-auto z-20 relative">
                        <button
                            onMouseDown={() => setIsPeeking(true)}
                            onMouseUp={() => setIsPeeking(false)}
                            onMouseLeave={() => setIsPeeking(false)}
                            onTouchStart={() => setIsPeeking(true)}
                            onTouchEnd={() => setIsPeeking(false)}
                            className={`w-full group relative px-4 py-3 ${GAME_THEME.colors.btnPeek} ${GAME_THEME.layout.radius} transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent hover:border-[#03372E]/10`}
                            title="Hold to Peek"
                        >
                            <Eye className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="font-bold text-xs uppercase tracking-wider">Hold to Peek</span>
                        </button>
                    </div>
                </div>
            </motion.div >

            {/* Victory Card Layer */}
            <AnimatePresence>
                {
                    gamePhase === 'level_complete' && (
                        <motion.div
                            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className={`w-80 md:w-96 ${GAME_THEME.colors.panelBg} p-8 rounded-3xl shadow-2xl border ${GAME_THEME.colors.panelBorderAccent} flex flex-col gap-6 items-center pointer-events-auto`}
                                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 50, opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            >
                                <div className="text-center space-y-1">
                                    <div className="text-xs font-bold uppercase tracking-widest text-[#D4898F]">Level {currentLevel} Complete</div>
                                    <div className="text-5xl font-black text-[#03372E] font-display uppercase tracking-tight leading-none">
                                        {levelScore.toLocaleString()}
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-[#03372E]/40">Points Earned</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-[#E0E6E5] p-3 rounded-xl text-center">
                                        <div className="text-[10px] font-bold uppercase text-[#03372E]/60">Moves</div>
                                        <div className="text-xl font-bold text-[#03372E] font-mono">{moves}</div>
                                    </div>
                                    <div className="bg-[#E0E6E5] p-3 rounded-xl text-center">
                                        <div className="text-[10px] font-bold uppercase text-[#03372E]/60">Time</div>
                                        <div className="text-xl font-bold text-[#03372E] font-mono">{seconds}</div>
                                    </div>
                                </div>

                                <div className="w-full flex justify-center py-2">
                                    <div className="flex gap-1 items-center animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-[#03372E]" />
                                        <div className="w-2 h-2 rounded-full bg-[#03372E] animation-delay-200" />
                                        <div className="w-2 h-2 rounded-full bg-[#03372E] animation-delay-400" />
                                    </div>
                                    <span className="ml-3 text-xs font-bold uppercase tracking-widest text-[#03372E]/60">Next Shift Starting...</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >



            {/* Mobile Peek Button */}
            < button
                onMouseDown={() => setIsPeeking(true)}
                onMouseUp={() => setIsPeeking(false)}
                onMouseLeave={() => setIsPeeking(false)}
                onTouchStart={() => setIsPeeking(true)}
                onTouchEnd={() => setIsPeeking(false)}
                className={`flex md:hidden w-full max-w-xs ${GAME_THEME.colors.btnPeek} ${GAME_THEME.layout.radius} py-5 absolute bottom-20 items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform z-10`}
            >
                <Eye className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-wider">Hold to Peek</span>
            </button >


            {/* Shift Over Overlay */}
            <AnimatePresence>
                {
                    gamePhase === 'shift_over' && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#03372E]/20 backdrop-blur-sm"
                        >
                            <motion.div
                                className="bg-[#D4898F] p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-white/20 relative overflow-hidden"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-white/20" />

                                <div className="text-center space-y-4">
                                    <div className="text-sm font-bold uppercase tracking-widest text-[#03372E]/60">Session Ended</div>
                                    <h2 className="text-4xl font-black text-[#03372E] font-display uppercase tracking-tight leading-none">
                                        Shift Over
                                    </h2>

                                    <div className="py-4 space-y-4">
                                        <div className="bg-[#03372E]/10 p-4 rounded-2xl">
                                            <div className="text-xs font-bold uppercase tracking-widest text-[#03372E]/60 mb-1">Total Score</div>
                                            <div className="text-5xl font-black text-[#03372E] font-mono tracking-tight">{sessionScore.toLocaleString()}</div>
                                        </div>

                                        <div className="bg-[#03372E]/10 p-4 rounded-2xl">
                                            <div className="text-xs font-bold uppercase tracking-widest text-[#03372E]/60 mb-1">Level Reached</div>
                                            <div className="text-3xl font-black text-[#03372E] font-display tracking-tight">{currentLevel}</div>
                                        </div>
                                    </div>

                                    {personalBest !== undefined && sessionScore > personalBest && (
                                        <div className="animate-bounce bg-yellow-400 text-[#03372E] font-bold text-xs uppercase tracking-widest py-2 rounded-full mb-4">
                                            New Personal Best!
                                        </div>
                                    )}

                                    <button
                                        onClick={() => onExit(currentLevel)}
                                        className="w-full bg-[#03372E] text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95 text-lg hover:bg-[#044c40]"
                                    >
                                        RETURN TO LOBBY
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Tutorial Overlay */}
            {
                tutorialStep && (
                    <TutorialOverlay
                        step={tutorialStep}
                        onNext={advanceTutorial}
                        onSkip={() => {
                            setTutorialStep(null);
                            if (onTutorialComplete) onTutorialComplete();
                        }}
                    />
                )
            }
        </div >
    );
}
