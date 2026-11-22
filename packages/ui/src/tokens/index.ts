export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#1E3A8A', // Deep Academic Navy
      hover: '#172554',
      light: '#EFF6FF',
      subtle: '#DBEAFE',
      ring: '#93C5FD'
    },
    accent: {
      DEFAULT: '#2563EB', // Sapphire Blue for active interactive CTA
      hover: '#1D4ED8',
      light: '#EFF6FF'
    },
    surface: {
      canvas: '#F8FAFC',
      card: '#FFFFFF',
      panel: '#F1F5F9',
      hover: '#F8FAFC',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9'
    },
    darkSurface: {
      canvas: '#0B0F19',
      card: '#111827',
      panel: '#1F2937',
      hover: '#1E293B',
      border: '#1F2937',
      borderSubtle: '#111827'
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#64748B',
      disabled: '#94A3B8',
      inverse: '#FFFFFF'
    },
    status: {
      success: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        text: '#065F46',
        solid: '#059669'
      },
      warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
        solid: '#D97706'
      },
      danger: {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        solid: '#DC2626'
      },
      info: {
        bg: '#F0F9FF',
        border: '#BAE6FD',
        text: '#075985',
        solid: '#0284C7'
      }
    }
  },
  touch: {
    minTargetSize: '44px',
    minSpacing: '8px'
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  }
} as const

export type Tokens = typeof tokens
