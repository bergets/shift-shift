import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate } from 'framer-motion';
import { GAME_THEME } from '../theme';

interface RowProps {
    rowIndex: number;
    row: number[];
    employee: string;
    gamePhase: 'memorize' | 'playing' | 'won';
    isPeeking: boolean;
    hiddenColIndex: number | null; // NEW: To hide a cell being dragged vertically
    colControls: any[];
    onDragEnd: (rowIndex: number, shiftAmount: number) => void;
    isDimmed?: boolean;
    isLocked?: boolean;
    scrambleAnim?: 'left' | 'right' | null;
    onScrambleComplete?: () => void;
}

const CELL_SIZE = GAME_THEME.layout.cellSize;
const COLS = 5;
const ROW_WIDTH = CELL_SIZE * COLS; // 400px

// We use 5 buffers to allow momentum settling without risk of hitting edge.
// Layout: [B0, B1, B2(Center), B3, B4]
// Width: 5 * ROW_WIDTH.
// Center Start: -2 * ROW_WIDTH.
const BUFFER_COUNT = 5;
const CENTER_INDEX = 2;
const START_X = -CENTER_INDEX * ROW_WIDTH;

export default function Row({ rowIndex, row, employee, gamePhase, isPeeking, hiddenColIndex, colControls, onDragEnd, isDimmed = false, isLocked = false, scrambleAnim, onScrambleComplete }: RowProps) {
    const x = useMotionValue(START_X);
    const draggingRef = useRef(false);

    // Monitor X for seamless loop - ONLY while dragging to avoid fighting animation
    useMotionValueEvent(x, "change", (latest) => {
        if (!draggingRef.current) return;

        // Loop boundaries. Relative from Center.
        const distanceFromCenter = latest - START_X;

        // If we drifted more than 1 ROW_WIDTH, reset.
        if (distanceFromCenter > ROW_WIDTH) {
            x.set(latest - ROW_WIDTH);
        } else if (distanceFromCenter < -ROW_WIDTH) {
            x.set(latest + ROW_WIDTH);
        }
    });

    // NEW: Programmatic Animation Effect
    useEffect(() => {
        if (!scrambleAnim) return;

        const target = scrambleAnim === 'right' ? CELL_SIZE : -CELL_SIZE;

        animate(x, target + START_X, { // target is relative, so add START_X
            duration: GAME_THEME.timing.slow / 1000, // Slow, visible animation
            ease: GAME_THEME.timing.animationEase
        }).then(() => {
            if (onScrambleComplete) onScrambleComplete();
            // Note: We don't reset X here. The parent will update the Key/Data,
            // causing a remount which resets X to START_X implicitly.
        });
    }, [scrambleAnim]);

    const handleDragStart = () => {
        draggingRef.current = true;
    };

    const handleDragEnd = () => {
        draggingRef.current = false;

        const currentX = x.get();
        const velocity = x.getVelocity();

        // Predict landing spot with inertia
        const predictedX = currentX + velocity * 0.2; // Power factor

        // Snap to grid (CELL_SIZE)
        const snapTarget = Math.round(predictedX / CELL_SIZE) * CELL_SIZE;

        // Animate to snap target
        animate(x, snapTarget, {
            ...GAME_THEME.timing.spring
        }).then(() => {
            // Animation Complete. Now we Commit.

            // Calculate total shift from Center
            const finalX = x.get();
            const totalDisplacement = finalX - START_X;
            const shifts = Math.round(totalDisplacement / CELL_SIZE);

            if (shifts !== 0) {
                // We just notify parent.
                // Parent will update state and CHANGE OUR KEY.
                // This component will UNMOUNT and a fresh one with new data will MOUNT at START_X.
                onDragEnd(rowIndex, shifts);
            } else {
                // If 0 shift, just reset to exact center
                x.set(START_X);
            }
        });
    };

    // No useLayoutEffect anymore! The Key-Change handles the reset.

    return (
        <div className={`flex items-center gap-4 transition-opacity duration-500 ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}>
            {/* Avatar Handle - Static */}
            <div className={`w-12 h-12 flex-shrink-0 ${GAME_THEME.layout.radiusFull} ${GAME_THEME.colors.avatarBg} flex items-center justify-center font-bold text-sm ${GAME_THEME.colors.avatarText} ${GAME_THEME.layout.shadow} select-none border-2 ${GAME_THEME.colors.avatarBorder} ${gamePhase === 'playing' && !isLocked ? GAME_THEME.colors.avatarActiveState : ''}`}>
                {employee}
            </div>

            {/* Masking Container */}
            <div className="relative overflow-hidden" style={{ width: ROW_WIDTH, height: 64 }}>
                <motion.div
                    style={{ x }}
                    drag={gamePhase === 'playing' && !isLocked ? "x" : false}
                    dragDirectionLock={true}
                    dragConstraints={{ left: -Infinity, right: Infinity }}
                    dragElastic={0}
                    dragMomentum={false} // We handle momentum manually
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="flex"
                >
                    {/* Render 5 copies */}
                    {Array.from({ length: BUFFER_COUNT }).map((_, bufferIndex) => (
                        <div key={`buffer-${bufferIndex}`} className="flex gap-4" style={{ width: ROW_WIDTH, flexShrink: 0 }}>
                            {row.map((cell, colIndex) => (
                                <div
                                    key={`cell-${colIndex}`}
                                    onPointerDown={(e) => {
                                        if (gamePhase === 'playing') {
                                            colControls[colIndex].start(e);
                                        }
                                    }}
                                    className={`w-16 h-16 flex-shrink-0 ${GAME_THEME.layout.radius} transition-all ${GAME_THEME.layout.shadow} touch-none ${cell === 1 ? `${GAME_THEME.colors.cellShift} ${GAME_THEME.colors.cellShiftShadow}` : GAME_THEME.colors.cellEmpty} ${hiddenColIndex === colIndex ? 'opacity-0 duration-0' : 'duration-300 ' + (isPeeking ? 'opacity-10' : 'opacity-100')}`}
                                >
                                </div>
                            ))}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
