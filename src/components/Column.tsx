import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate, DragControls } from 'framer-motion';
import { GAME_THEME } from '../theme';

interface ColumnProps {
    colIndex: number;
    colData: number[]; // The vertical slice of data
    header: string;
    gamePhase: 'memorize' | 'playing' | 'level_complete' | 'won' | 'shift_over';
    dragControls: DragControls;
    onDragStart: (idx: number) => void;
    onDragEnd: (colIndex: number, shiftAmount: number) => void;
    isDimmed?: boolean;
    isLocked?: boolean;
    scrambleAnim?: 'up' | 'down' | null;
    onScrambleComplete?: () => void;
}

const CELL_SIZE = GAME_THEME.layout.cellSize;
// Removed fixed constants
const BUFFER_COUNT = 5;

export default function Column({ colIndex, colData, header, gamePhase, dragControls, onDragStart, onDragEnd, isDimmed = false, isLocked = false, scrambleAnim, onScrambleComplete }: ColumnProps) {
    const COL_HEIGHT = colData.length * CELL_SIZE;
    const START_Y = -2 * COL_HEIGHT;

    const y = useMotionValue(START_Y);
    const draggingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    // Start with opacity 0, only show when dragging to prevent Z-fighting artifacts at rest
    const [isVisible, setIsVisible] = useState(false);

    const handleDragStart = () => {
        draggingRef.current = true;
    };

    useMotionValueEvent(y, "change", (latest) => {
        if (!draggingRef.current) return;

        // Visual Drag Threshold Check
        if (!isDragging) {
            const displacement = Math.abs(latest - START_Y);
            if (displacement > 5) { // 5px threshold
                setIsDragging(true);
                setIsVisible(true);
                onDragStart(colIndex);
            }
        }

        const distanceFromCenter = latest - START_Y;
        if (distanceFromCenter > COL_HEIGHT) {
            y.set(latest - COL_HEIGHT);
        } else if (distanceFromCenter < -COL_HEIGHT) {
            y.set(latest + COL_HEIGHT);
        }
    });

    // NEW: Programmatic Animation Effect
    useEffect(() => {
        if (!scrambleAnim) return;

        // Ensure strip is visible for animation
        setIsVisible(true);

        const target = scrambleAnim === 'down' ? CELL_SIZE : -CELL_SIZE;

        animate(y, target + START_Y, {
            duration: GAME_THEME.timing.slow / 1000,
            ease: GAME_THEME.timing.animationEase
        }).then(() => {
            if (onScrambleComplete) onScrambleComplete();
        });
    }, [scrambleAnim]);

    const handleDragEnd = () => {
        draggingRef.current = false;

        const currentY = y.get();
        const velocity = y.getVelocity();
        // Reverse velocity for "Natural" feel? No, standard is direct.
        // User drags DOWN -> Y increases.
        // Shift DOWN -> content moves DOWN.

        const predictedY = currentY + velocity * 0.2;
        const snapTarget = Math.round(predictedY / CELL_SIZE) * CELL_SIZE;

        animate(y, snapTarget, {
            ...GAME_THEME.timing.spring
        }).then(() => {
            const finalY = y.get();
            const totalDisplacement = finalY - START_Y;
            const shifts = Math.round(totalDisplacement / CELL_SIZE);

            // Wait for reset before hiding
            setIsDragging(false);

            if (shifts !== 0) {
                onDragEnd(colIndex, shifts);
                // Parent will remount us, so no need to clean up perfectly
            } else {
                y.set(START_Y);
                setIsVisible(false);
                onDragEnd(colIndex, 0);
            }
        });
    };

    const onPointerDown = (event: React.PointerEvent) => {
        if (gamePhase === 'playing' && !isLocked) {
            dragControls.start(event);
        }
    };

    return (
        <div className={`flex flex-col items-center gap-4 relative pointer-events-none transition-opacity duration-500 ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}>
            {/* Header Handle - Static but captures pointer for drag */}
            <div
                onPointerDown={onPointerDown}
                className={`w-16 h-10 ${GAME_THEME.colors.headerBase} ${GAME_THEME.layout.radiusSm} ${GAME_THEME.colors.headerText} ${gamePhase === 'playing' && !isLocked ? GAME_THEME.colors.headerActiveState : ''}`}
            >
                {header}
            </div>

            {/* The Motion Strip */}
            {/* We enable drag on this element, but mapped to controls from header */}
            <div className={`absolute top-14 left-0 w-16 overflow-hidden pointer-events-none z-10 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ height: COL_HEIGHT }}>
                <motion.div
                    drag={gamePhase === 'playing' && !isLocked ? "y" : false}
                    dragControls={dragControls}
                    dragListener={false} // Only controllable via controls (from Header or Row Cells)
                    dragDirectionLock={true} // Lock to Y axis if started vertically
                    dragConstraints={{ top: -Infinity, bottom: Infinity }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    style={{ y }}
                    className="flex flex-col"
                >
                    {Array.from({ length: BUFFER_COUNT }).map((_, bufferIndex) => (
                        <div key={`buf-${bufferIndex}`} className="flex flex-col gap-4" style={{ height: COL_HEIGHT, flexShrink: 0 }}>
                            {colData.map((cell, rIndex) => (
                                <div
                                    key={`c-${rIndex}`}
                                    className={`w-16 h-16 flex-shrink-0 ${GAME_THEME.layout.radius} ${GAME_THEME.layout.shadow} ${cell === 1 ? `${GAME_THEME.colors.cellShift} ${GAME_THEME.colors.cellShiftShadow}` : GAME_THEME.colors.cellEmpty}`}
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
