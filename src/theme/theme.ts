export const themes = {
  savanna: {
    backgroundBase: '#EBE5D9',
    cardSurface: '#F7F5F0',
    typographyDark: '#3E362E',
    typographyMuted: '#7A6B5D',
    highlightAccent: '#A48B71',
    drawerBackground: '#DFD7C8',
    actionArchive: '#8C9970',
    actionDelete: '#B27065',
    shadowBase: '#2C241B',
  },
  midnight: {
    backgroundBase: '#121212',
    cardSurface: '#1E1E1E',
    typographyDark: '#F7F5F0',
    typographyMuted: '#A0A0A0',
    highlightAccent: '#64B5F6',
    drawerBackground: '#0D0D0D',
    actionArchive: '#4CAF50',
    actionDelete: '#E53935',
    shadowBase: '#000000',
  }
};

export type ThemeName = keyof typeof themes;

export const getTypography = (colors: typeof themes.savanna) => ({
  mainTitle: {
    fontWeight: '800' as const,
    color: colors.typographyDark,
    letterSpacing: -0.5,
  },
  body: {
    fontWeight: '400' as const,
    color: colors.typographyMuted,
    lineHeight: 24,
  },
});

export const getShadows = (colors: typeof themes.savanna) => ({
  stackBottom: {
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stackMiddle: {
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTop: {
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardFloating: {
    shadowColor: colors.shadowBase,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
});


export const colors = themes.savanna;
export const typography = getTypography(colors);
export const shadows = getShadows(colors);
