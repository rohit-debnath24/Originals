import { userRepository } from './repositories/user.repository.js';
import { logger } from './utils/logger.js';

export const seedData = async () => {
  logger.info('Seeding development data for x402 Casino...');
  userRepository.getOrCreateByWallet('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  logger.info('✅ Seed data complete');
};
