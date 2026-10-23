import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService.js';

export type AppRole = 'brand' | 'clipper' | 'admin';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  role: AppRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the Supabase access token from the Authorization header and loads the
 * caller's profile. Never trust user ids supplied in request bodies.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token.' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, role')
      .eq('id', data.user.id)
      .maybeSingle();

    req.user = {
      id: data.user.id,
      email: data.user.email,
      username: profile?.username,
      role: (profile?.role as AppRole) || 'clipper',
    };

    return next();
  } catch (err: any) {
    return res.status(401).json({ error: err?.message || 'Authentication failed.' });
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}
