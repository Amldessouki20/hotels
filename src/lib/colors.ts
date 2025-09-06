// نظام الألوان الموحد للمشروع
// Unified Color System for the Project

export const colors = {
  // الألوان الأساسية - Primary Colors
  primary: {
    50: 'bg-amber-50',
    100: 'bg-amber-100',
    300: 'bg-amber-300',
    500: 'bg-amber-500',
    600: 'bg-amber-600',
    700: 'bg-amber-700',
    800: 'bg-amber-800',
    900: 'bg-amber-900',
  },
  
  // ألوان النصوص الأساسية - Primary Text Colors
  primaryText: {
    50: 'text-amber-50',
    100: 'text-amber-100',
    300: 'text-amber-300',
    500: 'text-amber-500',
    600: 'text-amber-600',
    700: 'text-amber-700',
    800: 'text-amber-800',
    900: 'text-amber-900',
  },
  
  // ألوان الحدود الأساسية - Primary Border Colors
  primaryBorder: {
    50: 'border-amber-50',
    100: 'border-amber-100',
    300: 'border-amber-300',
    500: 'border-amber-500',
    600: 'border-amber-600',
    700: 'border-amber-700',
    800: 'border-amber-800',
    900: 'border-amber-900',
  },
  
  // الألوان الثانوية - Secondary Colors (Gray)
  secondary: {
    50: 'bg-gray-50',
    100: 'bg-gray-100',
    200: 'bg-gray-200',
    300: 'bg-gray-300',
    400: 'bg-gray-400',
    500: 'bg-gray-500',
    600: 'bg-gray-600',
    700: 'bg-gray-700',
    800: 'bg-gray-800',
    900: 'bg-gray-900',
  },
  
  // ألوان النصوص الثانوية - Secondary Text Colors
  secondaryText: {
    50: 'text-gray-50',
    100: 'text-gray-100',
    200: 'text-gray-200',
    300: 'text-gray-300',
    400: 'text-gray-400',
    500: 'text-gray-500',
    600: 'text-gray-600',
    700: 'text-gray-700',
    800: 'text-gray-800',
    900: 'text-gray-900',
  },
  
  // ألوان الحدود الثانوية - Secondary Border Colors
  secondaryBorder: {
    50: 'border-gray-50',
    100: 'border-gray-100',
    200: 'border-gray-200',
    300: 'border-gray-300',
    400: 'border-gray-400',
    500: 'border-gray-500',
    600: 'border-gray-600',
    700: 'border-gray-700',
    800: 'border-gray-800',
    900: 'border-gray-900',
  },
  
  // ألوان الحالات - Status Colors
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    hover: 'hover:bg-green-50',
    accent: 'text-green-600',
    bgAccent: 'bg-green-50',
  },
  
  error: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    hover: 'hover:bg-red-50',
    accent: 'text-red-600',
    bgAccent: 'bg-red-50',
  },
  
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    hover: 'hover:bg-yellow-50',
    accent: 'text-yellow-600',
    bgAccent: 'bg-yellow-50',
  },
  
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    hover: 'hover:bg-blue-50',
    accent: 'text-blue-600',
    bgAccent: 'bg-blue-50',
  },
};

// فئات CSS الجاهزة للاستخدام - Ready-to-use CSS Classes
export const buttonStyles = {
  // الأزرار الأساسية - Primary Buttons
  primary: `${colors.primary[600]} hover:${colors.primary[700]} text-white`,
  primaryOutline: `${colors.primaryBorder[300]} ${colors.primaryText[700]} ${colors.primary[50]}`,
  
  // الأزرار الثانوية - Secondary Buttons
  secondary: `${colors.secondary[600]} hover:${colors.secondary[700]} text-white`,
  secondaryOutline: `${colors.secondaryBorder[300]} ${colors.secondaryText[700]} hover:${colors.secondary[50]}`,
  
  // أزرار الحالات - Status Buttons
  success: `${colors.success.border} ${colors.success.text} ${colors.success.hover}`,
  error: `${colors.error.border} ${colors.error.text} ${colors.error.hover}`,
  warning: `${colors.warning.border} ${colors.warning.text} ${colors.warning.hover}`,
  info: `${colors.info.border} ${colors.info.text} ${colors.info.hover}`,
};

export const inputStyles = {
  // حقول الإدخال - Input Fields
  default: `border ${colors.secondaryBorder[300]} focus:ring-2 focus:ring-amber-500 focus:border-amber-500`,
  error: `border ${colors.error.border} focus:ring-2 focus:ring-red-500 focus:border-red-500`,
  success: `border ${colors.success.border} focus:ring-2 focus:ring-green-500 focus:border-green-500`,
};

export const cardStyles = {
  // البطاقات - Cards
  default: `bg-white border ${colors.secondaryBorder[200]} rounded-lg shadow-sm`,
  highlighted: `bg-white border ${colors.primaryBorder[300]} rounded-lg shadow-md`,
  success: `${colors.success.bgAccent} border ${colors.success.border} rounded-lg`,
  error: `${colors.error.bgAccent} border ${colors.error.border} rounded-lg`,
  warning: `${colors.warning.bgAccent} border ${colors.warning.border} rounded-lg`,
  info: `${colors.info.bgAccent} border ${colors.info.border} rounded-lg`,
};

export const textStyles = {
  // أنماط النصوص - Text Styles
  heading: `text-3xl font-bold ${colors.secondaryText[900]}`,
  subheading: `text-xl font-semibold ${colors.secondaryText[800]}`,
  body: `${colors.secondaryText[700]}`,
  caption: `text-sm ${colors.secondaryText[600]}`,
  muted: `text-sm ${colors.secondaryText[500]}`,
  accent: `${colors.primaryText[600]}`,
  success: `${colors.success.accent}`,
  error: `${colors.error.accent}`,
  warning: `${colors.warning.accent}`,
  info: `${colors.info.accent}`,
};

// دالة مساعدة لتطبيق الألوان - Helper function to apply colors
export const applyColors = {
  button: {
    primary: () => buttonStyles.primary,
    primaryOutline: () => buttonStyles.primaryOutline,
    secondary: () => buttonStyles.secondary,
    secondaryOutline: () => buttonStyles.secondaryOutline,
    success: () => buttonStyles.success,
    error: () => buttonStyles.error,
    warning: () => buttonStyles.warning,
    info: () => buttonStyles.info,
  },
  input: {
    default: () => inputStyles.default,
    error: () => inputStyles.error,
    success: () => inputStyles.success,
  },
  card: {
    default: () => cardStyles.default,
    highlighted: () => cardStyles.highlighted,
    success: () => cardStyles.success,
    error: () => cardStyles.error,
    warning: () => cardStyles.warning,
    info: () => cardStyles.info,
  },
  text: {
    heading: () => textStyles.heading,
    subheading: () => textStyles.subheading,
    body: () => textStyles.body,
    caption: () => textStyles.caption,
    muted: () => textStyles.muted,
    accent: () => textStyles.accent,
    success: () => textStyles.success,
    error: () => textStyles.error,
    warning: () => textStyles.warning,
    info: () => textStyles.info,
  },
};

// مثال على الاستخدام - Usage Example:
/*
import { applyColors, colors, buttonStyles } from '@/lib/colors';

// استخدام الألوان المباشرة
<div className={colors.primary[600]}>

// استخدام أنماط الأزرار
<button className={buttonStyles.primary}>

// استخدام الدوال المساعدة
<button className={applyColors.button.primary()}>

// استخدام ألوان النصوص
<h1 className={applyColors.text.heading()}>
*/