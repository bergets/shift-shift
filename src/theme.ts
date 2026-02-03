export const GAME_THEME = {
    colors: {
        // Core Layout
        appBg: 'bg-[#F2F7F6]', // Pale Mint
        panelBg: 'bg-white',
        panelBorder: 'border-white', // Effectively hidden or minimal
        panelBorderAccent: 'border-[#D4898F]/20',
        overlayBg: 'bg-[#03372E]/10', // Low opacity deep green

        // Text
        textMain: 'text-[#03372E]', // Deep Forest Green (Base)
        textDim: 'text-[#03372E]/60',
        textAccent: 'text-[#D4898F]', // Rose Pink

        // Grid Cells
        cellShift: 'bg-[#D4898F]', // Rose Pink
        cellShiftShadow: 'shadow-lg shadow-[#03372E]/10',
        cellShiftBorder: 'border-transparent',

        cellEmpty: 'bg-[#E0E6E5]', // Sage Grey
        cellEmptyBorder: 'border-white', // White gaps

        // Avatar / Employees
        avatarBg: 'bg-[#265249]', // Darker green
        avatarBorder: 'border-white',
        avatarText: 'text-white',
        avatarActiveState: 'hover:bg-[#1C3D36] cursor-grab active:cursor-grabbing shadow-md shadow-[#03372E]/10',

        // Column Headers
        headerText: 'text-[#03372E]/60',
        headerBase: 'font-bold flex items-center justify-center select-none transition-colors z-20',
        headerActiveState: 'cursor-grab active:cursor-grabbing hover:bg-[#03372E]/5 hover:text-[#03372E]',

        // Buttons & HUD
        displayBg: 'bg-[#E0E6E5]',
        displayBorder: 'border-white', // or transparent

        // Buttons: No Borders, Filled
        // Secondary: Light Green Tint, Dark Text
        btnPeek: 'bg-[#03372E]/10 text-[#03372E] border-none hover:bg-[#03372E]/20',
        btnReset: 'bg-[#03372E]/10 text-[#03372E] border-none hover:bg-[#D4898F]/20 hover:text-[#D4898F]',

        // Primary: Pink, White Text
        btnPrimary: 'bg-[#D4898F] hover:bg-[#C9787E] text-white shadow-lg shadow-[#03372E]/10 border-none font-display tracking-wide',

        // Win Screen
        textWinTitle: 'text-[#D4898F] font-display',
        textWinScore: 'text-[#03372E] font-display',
        textWinStats: 'text-[#03372E]/60',

        // Indicators
        indicatorPulse: 'bg-[#D4898F]',

        // Messages / Overlays
        msgMemoryBg: 'bg-white',
        msgMemoryBorder: 'border-[#03372E]/5',
        msgMemoryText: 'text-[#03372E]/80',
        msgMemoryTitle: 'text-[#D4898F] font-display',

        msgAlertBg: 'bg-white',
        msgAlertBorder: 'border-[#D4898F]/20',
        msgAlertText: 'text-[#D4898F]',
        msgAlertTitle: 'text-[#D4898F] font-display',
    },
    layout: {
        cellSize: 80,
        gap: 16,
        radius: 'rounded-2xl',       // Soft, organic curves
        radiusSm: 'rounded-xl',
        radiusLg: 'rounded-3xl',
        radiusFull: 'rounded-full',
        shadow: 'shadow-lg shadow-[#03372E]/5', // Soft colored shadow
        shadowLg: 'shadow-xl shadow-[#03372E]/10',
    },
    timing: {
        fast: 300,
        normal: 500,
        slow: 1500,
        scrambleDelay: 3000,
        animationEase: "easeInOut",
        spring: {
            stiffness: 300, // Softer spring
            damping: 30,
            mass: 1
        }
    }
} as const;
