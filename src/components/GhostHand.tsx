import { motion } from 'framer-motion';
import { Hand } from 'lucide-react';

interface GhostHandProps {
    direction: 'up' | 'down' | 'left' | 'right';
}

export default function GhostHand({ direction }: GhostHandProps) {
    const getAnimation = () => {
        switch (direction) {
            case 'up': return { y: [20, -20, 20], opacity: [0, 1, 0] };
            case 'down': return { y: [-20, 20, -20], opacity: [0, 1, 0] };
            case 'left': return { x: [20, -20, 20], opacity: [0, 1, 0] };
            case 'right': return { x: [-20, 20, -20], opacity: [0, 1, 0] };
        }
    };

    return (
        <motion.div
            className="absolute z-40 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] pointer-events-none"
            animate={getAnimation()}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            <Hand className="w-12 h-12 fill-emerald-500/20" strokeWidth={1.5} />
        </motion.div>
    );
}
