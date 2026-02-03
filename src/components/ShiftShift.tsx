import { useState, useEffect } from 'react';
import { useDragControls } from 'framer-motion';
import { Eye, RefreshCw } from 'lucide-react';
import Row from './Row';
import Column from './Column';
import { GAME_THEME } from '../theme';
import type { TutorialStep } from './TutorialOverlay';
import TutorialOverlay from './TutorialOverlay';
import GhostHand from './GhostHand';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ROWS = 4;
const COLS = 5;

// Pure helper functions
const generateInitials = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
};

const generateGrid = () => {
    return Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => (Math.random() > 0.5 ? 1 : 0))
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
    const newGrid = grid.map((row) => [...row]);
    const column = newGrid.map((row) => row[colIndex]);

    if (direction === 'down') {
        const last = column.pop()!;
        column.unshift(last);
    } else {
        const first = column.shift()!;
        column.push(first);
    }

    for (let i = 0; i < ROWS; i++) {
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
    onExit: () => void;
    isTutorial?: boolean;
    onTutorialComplete?: () => void;
}

export default function ShiftShift({ playerName, onExit, isTutorial = false, onTutorialComplete }: ShiftShiftProps) {
    const [grid, setGrid] = useState<number[][]>([]);
    const [targetGrid, setTargetGrid] = useState<number[][]>([]);
    const [employees, setEmployees] = useState<string[]>([]);
    const [gamePhase, setGamePhase] = useState<'memorize' | 'playing' | 'won'>('memorize');
    const [score, setScore] = useState(0);
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

    // Create Drag Controls for Columns - MUST be top level.
    const colControl0 = useDragControls();
    const colControl1 = useDragControls();
    const colControl2 = useDragControls();
    const colControl3 = useDragControls();
    const colControl4 = useDragControls();
    const colControls = [colControl0, colControl1, colControl2, colControl3, colControl4];

    // Initialize Game
    useEffect(() => {
        const initialGrid = generateGrid();
        setGrid(initialGrid);

        if (isTutorial) {
            setTargetGrid(initialGrid); // Target is the starting state
        } else {
            setTargetGrid(initialGrid);
        }

        setEmployees(Array.from({ length: ROWS }, generateInitials));
        setGamePhase('memorize');

        setMoves(0);
        setSeconds(0);
        setGridVersion(0);
        setStartMessage(false);
    }, []); // Run once on mount

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

        // Wait 1s then Show Fix Overlay
        setTimeout(() => {
            setTutorialStep('fix_col_info');
        }, 1000);
    };

    // Scramble Logic - Standard Game
    useEffect(() => {
        if (isTutorial || gamePhase !== 'memorize' || targetGrid.length === 0) return;

        const scrambleTimer = setTimeout(() => {
            let currentScrambledGrid = [...targetGrid.map(row => [...row])];

            // Perform 15 random moves
            for (let k = 0; k < 15; k++) {
                const isRow = Math.random() > 0.5;
                if (isRow) {
                    const rowIndex = Math.floor(Math.random() * ROWS);
                    const direction = Math.random() > 0.5 ? 'left' : 'right';
                    const row = currentScrambledGrid[rowIndex];
                    currentScrambledGrid[rowIndex] = getShiftedRow(row, direction);
                } else {
                    const colIndex = Math.floor(Math.random() * COLS);
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
    }, [targetGrid, gamePhase, isTutorial]);

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
        // block if in tutorial step that forbids this
        if (tutorialStep && tutorialStep !== 'fix_col') return;

        // Enforce SPECIFIC column if needed (Col 3)
        if (tutorialStep === 'fix_col' && colIndex !== 3) return;

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

        for (let i = 0; i < ROWS; i++) {
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
        setGamePhase('won');
        const finalScore = Math.max(0, 10000 - ((moves + 1) * 100) - (seconds * 10));
        setScore(finalScore);
        saveScore(finalScore, moves + 1, seconds);
    };

    const saveScore = (finalScore: number, finalMoves: number, finalSeconds: number) => {
        if (isTutorial) return;

        const savedScores = localStorage.getItem('shift_shift_highscores');
        let currentHighScores = savedScores ? JSON.parse(savedScores) : [];

        const newScore = {
            name: playerName,
            score: finalScore,
            moves: finalMoves,
            time: finalSeconds
        };

        const updatedScores = [...currentHighScores, newScore]
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 10);

        localStorage.setItem('shift_shift_highscores', JSON.stringify(updatedScores));
    };

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

    const initializeGame = () => {
        // Re-init game
        const initialGrid = generateGrid();
        setGrid(initialGrid);
        setTargetGrid(initialGrid);
        setEmployees(Array.from({ length: ROWS }, generateInitials));
        setGamePhase('memorize');
        setMoves(0);
        setSeconds(0);
        setGridVersion(0);
        setStartMessage(false);
    }


    if (grid.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between w-full max-w-md mb-2">
                <div className="text-center">
                    <div className={`text-xs font-bold ${GAME_THEME.colors.textDim} uppercase tracking-wider mb-1 font-display`}>Time</div>
                    <div className={`text-3xl font-black ${GAME_THEME.colors.textMain} font-mono tracking-tight ${GAME_THEME.colors.displayBg} px-4 py-2 ${GAME_THEME.layout.radius} border ${GAME_THEME.colors.displayBorder} shadow-inner`}>
                        {seconds}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onMouseDown={() => setIsPeeking(true)}
                        onMouseUp={() => setIsPeeking(false)}
                        onMouseLeave={() => setIsPeeking(false)}
                        onTouchStart={() => setIsPeeking(true)}
                        onTouchEnd={() => setIsPeeking(false)}
                        className={`group relative px-4 py-3 ${GAME_THEME.colors.btnPeek} ${GAME_THEME.layout.radius} transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border`}
                        title="Hold to Peek"
                    >
                        <Eye className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100">Peek</span>
                    </button>

                    <button
                        onClick={initializeGame}
                        className={`group relative px-4 py-3 ${GAME_THEME.colors.btnReset} ${GAME_THEME.layout.radius} transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border`}
                        title="Reset Level"
                    >
                        <RefreshCw className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100">Reset</span>
                    </button>
                </div>
            </div>

            <div className={`flex flex-col gap-4 p-8 ${GAME_THEME.colors.panelBg} backdrop-blur-sm ${GAME_THEME.layout.radiusLg || 'rounded-3xl'} border ${GAME_THEME.colors.panelBorder} ${GAME_THEME.layout.shadowLg} relative`}>

                {/* Memorize Phase Indicator - Floats above the grid */}
                {gamePhase === 'memorize' && !isTutorial && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 z-30 animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <div className={`${GAME_THEME.colors.msgMemoryBg} backdrop-blur-md border ${GAME_THEME.colors.msgMemoryBorder} ${GAME_THEME.colors.msgMemoryText} p-3 ${GAME_THEME.layout.radius} flex flex-col items-center gap-2 ${GAME_THEME.layout.shadowLg}`}>
                            <div className={`text-xs font-bold uppercase tracking-widest ${GAME_THEME.colors.msgMemoryTitle}`}>Remember the schedule</div>

                            {/* Progress Bar */}
                            <div className={`h-1.5 w-full ${GAME_THEME.colors.overlayBg} rounded-full overflow-hidden`}>
                                <div className={`h-full ${GAME_THEME.colors.indicatorPulse} rounded-full animate-[width_3s_linear_forwards] w-full origin-left`} style={{ animationName: 'shrinkWidth' }} />
                            </div>

                            <style>{`
                                @keyframes shrinkWidth {
                                    from { width: 100%; }
                                    to { width: 0%; }
                                }
                            `}</style>
                        </div>
                    </div>
                )}

                {/* Oh Shift Message - Floats above the grid */}
                {startMessage && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 z-30 animate-in zoom-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className={`${GAME_THEME.colors.msgAlertBg} backdrop-blur-md border ${GAME_THEME.colors.msgAlertBorder} ${GAME_THEME.colors.msgAlertText} p-4 ${GAME_THEME.layout.radius} flex flex-col items-center gap-1 ${GAME_THEME.layout.shadowLg} text-center`}>
                            <div className={`text-lg font-black uppercase italic tracking-tighter ${GAME_THEME.colors.msgAlertTitle}`}>Oh Shift!</div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-80">You need to get the shifts back!</div>
                        </div>
                    </div>
                )}

                {/* Columns Overlay Layer - Rendered ON TOP of Rows? No, MUST BE ON TOP to capture drags. 
                    But wait, Row elements have 'drag x'.
                    If Column elements are on top, they catch pointer.
                    Column.tsx has pointer-events-none on wrapper, and pointer-events-auto on HEADER.
                    So it is SAFE to render this ON TOP of grid, provided the "Gap" areas don't block.
                    The "Strip" in Column.tsx is visible only when dragging.
                */}

                {/* Column Headers + Draggable Strips */}
                {/* We position this ABSOLUTELY over the grid to match alignment? 
                    Actually, we can put it in the flow as the "Header Row", and let the strips hang down.
                    The Header Row in Flex flow works. The "Strip" is absolute relative to the Header or Column container.
                */}
                <div className="flex items-center gap-4 z-20 relative">
                    <div className="w-12 flex-shrink-0" /> {/* Ghost Avatar */}

                    <div className="flex gap-4">
                        {DAYS.map((day, colIndex) => {
                            // Extract column data
                            const colData = grid.map(row => row[colIndex]);

                            return (
                                <div key={`col-wrapper-${colIndex}-${gridVersion}`} className="relative">
                                    <Column
                                        key={`col-${colIndex}-${gridVersion}`} // Remount on version change too!
                                        colIndex={colIndex}
                                        header={day}
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
                                    {/* Ghost Hand for Column Step */}
                                    {tutorialStep === 'fix_col' && colIndex === 3 && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                                            <GhostHand direction="up" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rows Grid */}
                {grid.map((row, rowIndex) => (
                    <div key={`row-wrapper-${rowIndex}-${gridVersion}`} className="relative">
                        <Row
                            key={`${rowIndex}-${gridVersion}`}
                            rowIndex={rowIndex}
                            row={row}
                            employee={employees[rowIndex]}
                            gamePhase={gamePhase}
                            isPeeking={isPeeking}
                            hiddenColIndex={draggingCol} // Pass the hidden column
                            colControls={colControls}
                            onDragEnd={handleRowDragEnd}
                            isDimmed={!!(tutorialStep && tutorialStep !== 'finish' && tutorialStep !== 'scrambling' && tutorialStep !== 'watch' && !(tutorialStep === 'fix_row' && rowIndex === 1))}
                            isLocked={!!(tutorialStep && !(tutorialStep === 'fix_row' && rowIndex === 1))}
                            scrambleAnim={rowIndex === 1 ? scramblingState.rowAnim : null}
                            onScrambleComplete={onRowScrambleComplete}
                        />
                        {/* Ghost Hand for Row Step */}
                        {tutorialStep === 'fix_row' && rowIndex === 1 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                                <GhostHand direction="left" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Peek Overlay */}
                {isPeeking && gamePhase === 'playing' && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col gap-4 p-8">
                        {/* Spacer for Column Header Row (h-10) */}
                        <div className="h-10 w-full" />

                        {targetGrid.map((row, rowIndex) => (
                            <div key={`peek-row-${rowIndex}`} className="flex items-center gap-4 opacity-40">
                                <div className="w-12 h-12 invisible" /> {/* Avatar Spacer */}
                                <div className="flex gap-4">
                                    {row.map((cell, colIndex) => (
                                        <div
                                            key={`peek-${rowIndex}-${colIndex}`}
                                            className={`w-16 h-16 ${GAME_THEME.layout.radius} border-4 ${cell === 1 ? `${GAME_THEME.colors.cellShift} ${GAME_THEME.colors.cellShiftBorder}` : `${GAME_THEME.colors.cellEmpty} ${GAME_THEME.colors.cellEmptyBorder}`}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className={`${GAME_THEME.colors.textDim} text-sm font-medium flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${GAME_THEME.colors.indicatorPulse} animate-pulse`} />
                    Drag rows (Horz) or columns (Vert) to fix
                </div>
                <div className={`${GAME_THEME.colors.textDim} text-sm font-medium flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${GAME_THEME.colors.indicatorPulse} animate-pulse`} />
                    Hold Space to Peek at the target schedule
                </div>
            </div>

            {/* Win Screen Overlay */}
            {gamePhase === 'won' && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${GAME_THEME.colors.overlayBg} backdrop-blur-md animate-in fade-in zoom-in duration-300`}>
                    <div className={`flex flex-col items-center gap-6 p-8 ${GAME_THEME.colors.panelBg} rounded-3xl border ${GAME_THEME.colors.panelBorderAccent} ${GAME_THEME.layout.shadowLg}`}>
                        <div className="text-center space-y-2">
                            <div className={`${GAME_THEME.colors.textWinTitle} font-bold tracking-widest uppercase`}>Excellent Work</div>
                            <div className={`text-6xl font-bold ${GAME_THEME.colors.textWinScore} tracking-tighter`}>{score.toLocaleString()}</div>
                            <div className={`${GAME_THEME.colors.textWinStats} font-mono text-xs uppercase tracking-widest mt-2`}>
                                {moves} Moves • {seconds} Seconds
                            </div>
                        </div>
                        <button
                            onClick={onExit}
                            className={`${GAME_THEME.colors.btnPrimary} font-bold px-8 py-4 ${GAME_THEME.layout.radius} transition-all active:scale-95`}
                        >
                            RETURN TO LOBBY
                        </button>
                    </div>
                </div>
            )}


            {/* Tutorial Overlay */}
            {tutorialStep && (
                <TutorialOverlay
                    step={tutorialStep}
                    onNext={advanceTutorial}
                    onSkip={() => {
                        setTutorialStep(null);
                        if (onTutorialComplete) onTutorialComplete();
                    }}
                />
            )}
        </div>
    );
}
