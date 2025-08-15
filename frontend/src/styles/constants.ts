// Common style constants for consistent UI
export const STYLE_CONSTANTS = {
  // Layout
  layout: {
    pageContainer: "min-h-screen bg-neutral-50",
    contentContainer: "max-w-7xl mx-auto px-6 py-8",
    headerContainer: "bg-white shadow-elevation-4 border-b border-neutral-200",
    headerContent: "max-w-7xl mx-auto px-6",
    headerHeight: "h-14",
    headerFlex: "flex items-center justify-between",
  },
  
  // Cards
  card: {
    base: "bg-white shadow-elevation-8 border border-neutral-200 rounded overflow-hidden",
    header: "p-6 pb-0",
    headerWithColor: "p-6 border-0",
    content: "p-6",
    contentCompact: "p-4",
    blueHeader: "bg-blue-600 text-white",
    darkBlueHeader: "bg-blue-800 text-white",
  },
  
  // Buttons
  button: {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-0 rounded font-medium",
    secondary: "bg-blue-800 hover:bg-blue-900 text-white border-0 rounded font-medium",
    ghost: "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded font-medium",
    outline: "rounded border-neutral-300 hover:bg-neutral-50",
    white: "bg-white hover:bg-neutral-50 border-0 rounded font-medium",
    neutral: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border-0 rounded font-medium",
    sizes: {
      xs: "px-2 py-1 h-6 text-xs",
      sm: "px-3 py-1.5 h-8 text-sm",
      md: "px-4 py-2 h-9 text-sm",
      lg: "px-6 py-3 h-10 text-sm",
    },
  },
  
  // Forms
  form: {
    field: "space-y-2",
    label: "text-sm font-medium text-neutral-900",
    input: "rounded border-neutral-300 focus:border-blue-600 focus:ring-blue-600 h-8 text-sm",
    textarea: "w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 resize-none text-sm",
    select: "h-8 rounded border-neutral-300",
    selectContent: "bg-white border border-neutral-200 rounded shadow-elevation-16",
    checkbox: "h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-600",
    gridTwoCol: "grid grid-cols-1 lg:grid-cols-2 gap-4",
  },
  
  // Dialog
  dialog: {
    content: "max-w-lg bg-white rounded shadow-elevation-64 border border-neutral-200",
    contentLarge: "max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded shadow-elevation-64 border border-neutral-200",
    contentMedium: "max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded shadow-elevation-64 border border-neutral-200",
    header: "p-6 pb-0",
    title: "text-lg font-semibold text-neutral-900",
    titleLarge: "text-xl font-semibold text-neutral-900",
    form: "p-6 pt-4 space-y-4",
    formLarge: "p-6 pt-4 space-y-5",
    footer: "flex justify-end space-x-3 pt-4 border-t border-neutral-200",
  },
  
  // Loading states
  loading: {
    container: "min-h-screen bg-neutral-50 flex items-center justify-center",
    card: "text-center p-8 bg-white rounded shadow-elevation-16 border border-neutral-200",
    spinner: "animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto",
    text: "mt-4 text-neutral-600 text-sm font-medium",
  },
  
  // Error states
  error: {
    container: "min-h-screen bg-neutral-50 flex items-center justify-center p-4",
    card: "text-center space-y-4 bg-white p-8 rounded shadow-elevation-16 border border-neutral-200 max-w-md w-full",
    alert: "border-red-200 bg-red-50",
    text: "text-red-800 text-sm",
  },
  
  // Typography
  typography: {
    pageTitle: "text-2xl font-semibold text-neutral-900 mb-2",
    sectionTitle: "text-lg font-semibold text-neutral-900",
    cardTitle: "text-lg font-semibold",
    cardTitleSmall: "text-base font-semibold",
    description: "text-neutral-600 text-base max-w-4xl leading-relaxed",
    smallText: "text-xs text-neutral-600",
    label: "text-sm text-neutral-700",
  },
  
  // Stats and badges
  stats: {
    value: "text-2xl font-semibold text-blue-600 mb-1",
    label: "text-neutral-600 text-sm font-medium",
    container: "text-center",
  },
  
  // Spacing
  spacing: {
    section: "space-y-6",
    sectionLarge: "space-y-8",
    formSection: "space-y-4",
    gridGap: "gap-6",
    gridGapSmall: "gap-4",
  },
  
  // Colors for status
  status: {
    planning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    active: "bg-green-100 text-green-800 border border-green-200",
    onHold: "bg-red-100 text-red-800 border border-red-200",
    completed: "bg-purple-100 text-purple-800 border border-purple-200",
    cancelled: "bg-gray-100 text-gray-800 border border-gray-200",
  },
  
  // Budget status colors
  budget: {
    good: "text-green-600",
    warning: "text-orange-600",
    danger: "text-red-600",
  },
} as const;

// Helper function to combine classes
export const combineClasses = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
