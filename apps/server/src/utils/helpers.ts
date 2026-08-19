import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const hashPin = (pin: string): string => {
  // Simple hash for MVP - in production use bcrypt or argon2
  // This is a placeholder implementation
  return Buffer.from(pin).toString('base64');
};

export const verifyPin = (pin: string, hash: string): boolean => {
  return hashPin(pin) === hash;
};

export const calculateEffectiveRate = (baseRate: number, spreadPercent: number): number => {
  return baseRate * (1 + spreadPercent / 100);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
