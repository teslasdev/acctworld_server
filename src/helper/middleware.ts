import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

interface AuthRequest extends Request {
  user?: User;
}

const authMiddleware = (requiredRoles?: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied', success: false });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: 'Invalid token', success: false });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found', success: false });
      }

      req.user = user;

      // Check if the user's role matches one of the required roles
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient role permissions', success: false });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Token verification failed', error, success: false });
    }
  };
};

export default authMiddleware;
