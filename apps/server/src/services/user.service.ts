import { userRepository, UserRow } from '../repositories/user.repository.js';
import { createChildLogger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const logger = createChildLogger('UserService');

export const userService = {
  async createUser(name: string, walletAddress?: string): Promise<UserRow> {
    logger.info({ name, walletAddress }, 'Creating new user');

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    const user = userRepository.create(name, walletAddress);
    logger.info({ userId: user.id }, 'User created');
    return user;
  },

  async getUserById(id: string): Promise<UserRow> {
    const user = userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  },

  async getUserByWallet(walletAddress: string): Promise<UserRow | null> {
    return userRepository.findByWalletAddress(walletAddress);
  },

  async getOrCreateByWallet(walletAddress: string): Promise<UserRow> {
    return userRepository.getOrCreateByWallet(walletAddress);
  }
};
