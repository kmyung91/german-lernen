// Design System for German Learning App
export type Theme = 'light' | 'dark';

export interface DesignTokens {
  colors: {
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Background colors
    background: string;
    surface: string;
    card: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Learning bucket colors
    learning: string;
    reviewing: string;
    mastered: string;
    
    // UI colors
    border: string;
    shadow: string;
    overlay: string;
  };
  
  typography: {
    // Font families
    fontFamily: {
      regular: string;
      medium: string;
      bold: string;
    };
    
    // Font sizes
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
      '4xl': number;
    };
    
    // Line heights
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
    
    // Font weights
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// Light theme
export const lightTheme: DesignTokens = {
  colors: {
    primary: '#00B1AC', // Teal
    primaryLight: '#33C1BC', // Lighter teal
    primaryDark: '#008B87', // Darker teal
    
    background: '#F0FDFA', // Teal-50 - subtle primary tint
    surface: '#F8FAFC', // Slate-50
    card: '#FFFFFF',
    
    textPrimary: '#1E293B', // Slate-800
    textSecondary: '#64748B', // Slate-500
    textTertiary: '#94A3B8', // Slate-400
    
    success: '#10B981', // Emerald-500
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500
    info: '#3B82F6', // Blue-500
    
    learning: '#EF4444', // Red-500
    reviewing: '#F59E0B', // Amber-500
    mastered: '#10B981', // Emerald-500
    
    border: '#E2E8F0', // Slate-200
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.1)',
  },
  
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Dark theme
export const darkTheme: DesignTokens = {
  colors: {
    primary: '#33C1BC', // Lighter teal for dark mode
    primaryLight: '#66D1CC', // Even lighter teal
    primaryDark: '#00B1AC', // Base teal
    
    background: '#0D1B1A', // Dark teal background
    surface: '#1E293B', // Slate-800
    card: '#334155', // Slate-700
    
    textPrimary: '#F1F5F9', // Slate-100
    textSecondary: '#CBD5E1', // Slate-300
    textTertiary: '#94A3B8', // Slate-400
    
    success: '#34D399', // Emerald-400
    warning: '#FBBF24', // Amber-400
    error: '#F87171', // Red-400
    info: '#60A5FA', // Blue-400
    
    learning: '#F87171', // Red-400
    reviewing: '#FBBF24', // Amber-400
    mastered: '#34D399', // Emerald-400
    
    border: '#475569', // Slate-600
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Theme context and hook
export const getTheme = (theme: Theme): DesignTokens => {
  return theme === 'dark' ? darkTheme : lightTheme;
};

// Helper functions for common styles
export const createTextStyle = (theme: DesignTokens, variant: 'heading' | 'body' | 'caption' | 'button') => {
  const { typography, colors } = theme;
  
  switch (variant) {
    case 'heading':
      return {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        lineHeight: typography.lineHeight.tight,
      };
    case 'body':
      return {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.normal,
        color: colors.textPrimary,
        lineHeight: typography.lineHeight.normal,
      };
    case 'caption':
      return {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.normal,
        color: colors.textSecondary,
        lineHeight: typography.lineHeight.normal,
      };
    case 'button':
      return {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.textPrimary,
        lineHeight: typography.lineHeight.normal,
      };
    default:
      return {};
  }
};

export const createCardStyle = (theme: DesignTokens) => {
  const { colors, borderRadius, shadows } = theme;
  
  return {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  };
};
