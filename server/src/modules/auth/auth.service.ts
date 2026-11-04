import bcrypt from 'bcryptjs';
import { authConfig } from '../../config/auth';
import { AppError } from '../../shared/errors/AppError';
import { UserModel } from '../users/user.model';
import { tokenService } from './token.service';
import type { LoginInput, RegisterInput } from './auth.schemas';

/** What the client is allowed to see about a user. Never the hash or tokenVersion. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'admin';
  defaultAddress: {
    line1: string;
    area: string;
    city: string;
    postcode: string;
    zone: string;
  } | null;
}

type UserDoc = InstanceType<typeof UserModel>;

function toPublicUser(user: UserDoc): PublicUser {
  const addr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    defaultAddress: addr
      ? { line1: addr.line1, area: addr.area ?? '', city: addr.city, postcode: addr.postcode ?? '', zone: addr.zone }
      : null,
  };
}

export interface Session {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function issueSession(user: UserDoc): Session {
  return {
    user: toPublicUser(user),
    accessToken: tokenService.signAccess({ id: user.id, role: user.role }),
    refreshToken: tokenService.signRefresh({ id: user.id, tokenVersion: user.tokenVersion }),
  };
}

// Compared against when the email doesn't exist, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('voltnest-timing-guard', 10);

export const authService = {
  async register(input: RegisterInput): Promise<Session> {
    const exists = await UserModel.exists({ email: input.email });
    if (exists) throw AppError.conflict('An account with this email already exists. Try logging in.');

    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, authConfig.bcryptRounds),
      role: 'customer',
      lastLoginAt: new Date(),
    });
    return issueSession(user);
  },

  async login(input: LoginInput): Promise<Session> {
    const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');
    const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new AppError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');

    user.lastLoginAt = new Date();
    await user.save();
    return issueSession(user);
  },

  /** Swap a valid refresh token for a new access token AND a new refresh token. */
  async refresh(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) throw new AppError(401, 'Not logged in', 'NO_SESSION');
    const { userId, tokenVersion } = tokenService.verifyRefresh(refreshToken);

    const user = await UserModel.findById(userId);
    // tokenVersion changes on logout, so older refresh tokens stop working everywhere
    if (!user || user.tokenVersion !== tokenVersion) throw new AppError(401, 'Please log in again', 'SESSION_ENDED');
    return issueSession(user);
  },

  /** Ends every session of this user (all devices). Never fails: logout must always work. */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const { userId, tokenVersion } = tokenService.verifyRefresh(refreshToken);
      await UserModel.updateOne({ _id: userId, tokenVersion }, { $inc: { tokenVersion: 1 } });
    } catch {
      // expired or forged token: nothing to revoke
    }
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await UserModel.findById(userId);
    if (!user) throw AppError.unauthorized();
    return toPublicUser(user);
  },
};
