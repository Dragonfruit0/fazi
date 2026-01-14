
export enum AppView {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  STUDIO = 'STUDIO',
  PRICING = 'PRICING',
  BILLING = 'BILLING',
  HISTORY = 'HISTORY'
}

export interface UIVariant {
  id: string;
  label: string;
  html: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  variants: UIVariant[];
  prompt: string;
  createdAt: number;
}

export interface UserState {
  isLoggedIn: boolean;
  flashesRemaining: number;
  plan: 'FREE' | 'BASIC' | 'PRO';
}
