import { motion, AnimatePresence } from 'framer-motion';
import { GAME_THEME } from '../theme';

export type TutorialStep = 'watch' | 'scrambling' | 'fix_col_info' | 'fix_col' | 'fix_row_info' | 'fix_row' | 'peek_info' | 'finish';

interface TutorialOverlayProps {
    step: TutorialStep;
    onNext: () => void;
    onSkip?: () => void;
}

export default function TutorialOverlay({ step, onNext, onSkip }: TutorialOverlayProps) {
    const getContent = () => {
        switch (step) {
            case 'watch':
                return {
                    title: "Watch Carefully...",
                    text: "See how the shifts change the schedule.",
                    action: null, // Auto-advance or wait
                };
            case 'scrambling':
                return null; // Hide overlay during animation? Or show "Messing it up..."
            case 'fix_col_info':
                return {
                    title: "Fix the Column",
                    text: "Column 4 (Thu) was shifted down. Drag it UP to fix it.",
                    action: "I'm on it",
                };
            case 'fix_col':
                return null; // Hidden while user drags
            case 'fix_row_info':
                return {
                    title: "Fix the Row",
                    text: "Row 2 was shifted right. Drag it LEFT to fix it.",
                    action: "Got it",
                };
            case 'fix_row':
                return null; // Hidden while user drags
            case 'peek_info':
                return {
                    title: "Need a Hint?",
                    text: "Hold the PEEK button (or Spacebar) to see the goal schedule underneath.",
                    action: "Got it",
                };
            case 'finish':
                return {
                    title: "Excellent Work!",
                    text: "The schedule is back to how it was. Now it's your turn to beat the clock.",
                    action: "START",
                };
            default:
                return null;
        }
    };

    const content = getContent();
    if (!content) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center p-8"
            >
                {/* Dimmed Background */}
                <div className={`absolute inset-0 ${GAME_THEME.colors.overlayBg} backdrop-blur-sm`} />

                {/* Content Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    key={step}
                    className={`relative ${GAME_THEME.colors.panelBg} p-8 ${GAME_THEME.layout.radiusLg || 'rounded-3xl'} border ${GAME_THEME.colors.panelBorderAccent} ${GAME_THEME.layout.shadowLg} max-w-sm w-full text-center space-y-6 pointer-events-auto`}
                >
                    <div className="space-y-3">
                        <h2 className={`text-2xl ${GAME_THEME.colors.textAccent} tracking-wide font-display`}>
                            {content.title}
                        </h2>
                        <p className={`${GAME_THEME.colors.textMain} text-lg leading-relaxed`}>
                            {content.text}
                        </p>
                    </div>

                    {content.action && (
                        <button
                            onClick={onNext}
                            className={`${GAME_THEME.colors.btnPrimary} font-bold px-8 py-3 ${GAME_THEME.layout.radius} transition-all active:scale-95 w-full`}
                        >
                            {content.action}
                        </button>
                    )}

                    {onSkip && step !== 'finish' && (
                        <button
                            onClick={onSkip}
                            className={`${GAME_THEME.colors.textDim} text-sm font-bold uppercase tracking-wider hover:text-slate-400 mt-4 block mx-auto transition-colors`}
                        >
                            Skip Tutorial
                        </button>
                    )}
                </motion.div>

                {/* Arrow to content (Visual Hint) - We could add this later if we know screen positions */}
            </motion.div>
        </AnimatePresence>
    );
}
