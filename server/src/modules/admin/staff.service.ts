import bcrypt from 'bcryptjs';
import { authConfig } from '../../config/auth';
import { AppError } from '../../shared/errors/AppError';
import { UserModel } from '../users/user.model';

export const staffService = {
  /** The owner and all employee accounts. */
  async list() {
    const rows = await UserModel.find({ role: { $in: ['staff', 'admin'] } })
      .sort({ role: 1, createdAt: 1 })
      .select('name email role isActive lastLoginAt createdAt')
      .lean();
    return rows.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive !== false,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    }));
  },

  async create(input: { name: string; email: string; password: string }) {
    if (await UserModel.exists({ email: input.email })) {
      throw AppError.conflict('That email already has an account. Use a different email for the employee.');
    }
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, authConfig.bcryptRounds),
      role: 'staff',
    });
    return { id: user.id as string };
  },

  /**
   * Switch an employee off or on, rename them, or set a new password.
   * Switching off or a new password ends all their sessions at once.
   * The owner's own account can't be changed here.
   */
  async update(id: string, input: { isActive?: boolean; password?: string; name?: string }) {
    const user = await UserModel.findById(id);
    if (!user || user.role !== 'staff') throw AppError.notFound('Employee not found');

    if (input.name) user.name = input.name;
    if (input.password) user.passwordHash = await bcrypt.hash(input.password, authConfig.bcryptRounds);
    if (input.isActive !== undefined) user.isActive = input.isActive;
    if (input.password || input.isActive === false) user.tokenVersion += 1; // logs them out everywhere
    await user.save();
    return { id, isActive: user.isActive !== false };
  },
};
