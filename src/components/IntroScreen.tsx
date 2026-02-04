import { GAME_THEME } from '../theme';
import { Eye, ArrowUpDown, CheckCircle2 } from 'lucide-react';

interface IntroScreenProps {
    onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
    return (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 animate-in fade-in duration-700`}>
            <div className={`max-w-2xl w-full ${GAME_THEME.colors.panelBg} ${GAME_THEME.layout.radiusLg || 'rounded-3xl'} border ${GAME_THEME.colors.panelBorder} ${GAME_THEME.layout.shadowLg} p-6 md:p-12 space-y-4 md:space-y-8 relative overflow-hidden`}>

                {/* Header */}
                <div className="text-center space-y-2 md:space-y-4 relative z-10">
                    <div className={`text-xs md:text-sm font-bold ${GAME_THEME.colors.textAccent} uppercase tracking-widest font-display`}>Welcome Manager</div>
                    <h1 className={`text-2xl md:text-4xl ${GAME_THEME.colors.textMain} tracking-tighter leading-tight font-display`}>
                        The schedule is in chaos—<br />can you restore the order?
                    </h1>
                </div>

                {/* The Goal */}
                <div className="space-y-2 relative z-10 text-center">
                    <p className={`${GAME_THEME.colors.textDim} text-sm md:text-lg leading-relaxed max-w-lg mx-auto`}>
                        Study the schedule before it vanishes, then recreate the pattern by moving the blocks back into their original spots.
                    </p>
                </div>

                {/* Controls - Horizontal Layout */}
                <div className="space-y-4 relative z-10">
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        {/* Memorize */}
                        <div className="flex flex-col items-center text-center gap-2 md:gap-3 p-2 md:p-4">
                            <div className={`p-2 md:p-3 rounded-xl ${GAME_THEME.colors.cellEmpty} shrink-0`}>
                                <Eye className={`w-5 h-5 md:w-6 md:h-6 ${GAME_THEME.colors.textMain}`} />
                            </div>
                            <div>
                                <div className={`font-bold ${GAME_THEME.colors.textMain} mb-0.5 md:mb-1 font-display tracking-wide text-xs md:text-base`}>Memorize</div>
                                <div className={`text-[10px] md:text-xs ${GAME_THEME.colors.textDim} leading-snug hidden md:block`}>Study the "Perfect Schedule" before it hides.</div>
                            </div>
                        </div>

                        {/* Shift */}
                        <div className="flex flex-col items-center text-center gap-2 md:gap-3 p-2 md:p-4">
                            <div className={`p-2 md:p-3 rounded-xl ${GAME_THEME.colors.cellEmpty} shrink-0`}>
                                <ArrowUpDown className={`w-5 h-5 md:w-6 md:h-6 ${GAME_THEME.colors.textMain}`} />
                            </div>
                            <div>
                                <div className={`font-bold ${GAME_THEME.colors.textMain} mb-0.5 md:mb-1 font-display tracking-wide text-xs md:text-base`}>Shift</div>
                                <div className={`text-[10px] md:text-xs ${GAME_THEME.colors.textDim} leading-snug hidden md:block`}>Drag rows left/right and columns up/down.</div>
                            </div>
                        </div>

                        {/* Win */}
                        <div className="flex flex-col items-center text-center gap-2 md:gap-3 p-2 md:p-4">
                            <div className={`p-2 md:p-3 rounded-xl ${GAME_THEME.colors.cellEmpty} shrink-0`}>
                                <CheckCircle2 className={`w-5 h-5 md:w-6 md:h-6 ${GAME_THEME.colors.textMain}`} />
                            </div>
                            <div>
                                <div className={`font-bold ${GAME_THEME.colors.textMain} mb-0.5 md:mb-1 font-display tracking-wide text-xs md:text-base`}>Win</div>
                                <div className={`text-[10px] md:text-xs ${GAME_THEME.colors.textDim} leading-snug hidden md:block`}>Match the pattern. Fewer moves = Higher Score.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="pt-4 relative z-10">
                    <button
                        onClick={onStart}
                        className={`w-full md:w-auto md:px-12 mx-auto block ${GAME_THEME.colors.btnPrimary} font-bold text-xl py-4 ${GAME_THEME.layout.radius} transition-all active:scale-95 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40`}
                    >
                        ENTER LOBBY
                    </button>
                    <p className={`text-center text-xs ${GAME_THEME.colors.textDim} mt-4 opacity-60`}>
                        Press to continue
                    </p>
                </div>
            </div>
        </div>
    );
}
