import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

/**
 * Controlador para gerenciar autenticação de usuários
 */
export class AuthController {
  /**
   * Registrar um novo usuário
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        throw new AppError('Email já está em uso', 400);
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          mfaEnabled: true,
          profileImage: true,
          createdAt: true
        }
      });
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Responder com o usuário e token
      res.status(201).json({
        status: 'success',
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Login de usuário
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        throw new AppError('Email ou senha incorretos', 401);
      }
      
      // Verificar senha
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      
      if (!isPasswordCorrect) {
        throw new AppError('Email ou senha incorretos', 401);
      }
      
      // Verificar se MFA está habilitado
      if (user.mfaEnabled && user.mfaSecret) {
        // Gerar token temporário para verificação MFA
        const mfaToken = jwt.sign(
          { id: user.id, mfaRequired: true },
          process.env.JWT_SECRET || 'default_secret',
          { expiresIn: '5m' }
        );
        
        return res.status(200).json({
          status: 'success',
          mfaRequired: true,
          mfaToken
        });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Remover senha da resposta
      const { password: _, mfaSecret: __, ...userWithoutSensitiveData } = user;
      
      // Responder com o usuário e token
      res.status(200).json({
        status: 'success',
        token,
        user: userWithoutSensitiveData
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Verificar código MFA
   */
  public static async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, code } = req.body;
      
      if (!token || !code) {
        throw new AppError('Token e código são obrigatórios', 400);
      }
      
      // Verificar token MFA
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      } catch (error) {
        throw new AppError('Token inválido ou expirado', 401);
      }
      
      if (!decoded.mfaRequired) {
        throw new AppError('Token inválido', 401);
      }
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (!user || !user.mfaSecret) {
        throw new AppError('Usuário não encontrado ou MFA não configurado', 401);
      }
      
      // Verificar código
      const isCodeValid = authenticator.verify({
        token: code,
        secret: user.mfaSecret
      });
      
      if (!isCodeValid) {
        throw new AppError('Código MFA inválido', 401);
      }
      
      // Gerar token JWT
      const newToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
      );
      
      // Remover senha e segredo MFA da resposta
      const { password: _, mfaSecret: __, ...userWithoutSensitiveData } = user;
      
      // Responder com o usuário e token
      res.status(200).json({
        status: 'success',
        token: newToken,
        user: userWithoutSensitiveData
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Configurar MFA
   */
  public static async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      
      // Gerar segredo MFA
      const secret = authenticator.generateSecret();
      
      // Gerar QR code
      const otpauth = authenticator.keyuri(user.email, 'MoneyMind', secret);
      const qrCode = await QRCode.toDataURL(otpauth);
      
      // Salvar segredo temporariamente na sessão (em produção, usar Redis ou outro mecanismo seguro)
      req.session = req.session || {};
      req.session.mfaSecret = secret;
      
      // Responder com o QR code
      res.status(200).json({
        status: 'success',
        qrCode,
        secret
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Ativar MFA
   */
  public static async enableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { code } = req.body;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Verificar se o segredo está na sessão
      if (!req.session?.mfaSecret) {
        throw new AppError('Configuração MFA não iniciada', 400);
      }
      
      // Verificar código
      const isCodeValid = authenticator.verify({
        token: code,
        secret: req.session.mfaSecret
      });
      
      if (!isCodeValid) {
        throw new AppError('Código MFA inválido', 401);
      }
      
      // Atualizar usuário
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: req.session.mfaSecret
        }
      });
      
      // Limpar segredo da sessão
      delete req.session.mfaSecret;
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'MFA ativado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Desativar MFA
   */
  public static async disableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { password } = req.body;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      
      // Verificar senha
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      
      if (!isPasswordCorrect) {
        throw new AppError('Senha incorreta', 401);
      }
      
      // Atualizar usuário
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null
        }
      });
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'MFA desativado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter perfil do usuário
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          mfaEnabled: true,
          profileImage: true,
          createdAt: true
        }
      });
      
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      
      // Responder com o usuário
      res.status(200).json({
        status: 'success',
        user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Atualizar perfil do usuário
   */
  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, email, profileImage } = req.body;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Verificar se o email já está em uso
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        
        if (existingUser && existingUser.id !== userId) {
          throw new AppError('Email já está em uso', 400);
        }
      }
      
      // Atualizar usuário
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          profileImage
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          mfaEnabled: true,
          profileImage: true,
          createdAt: true
        }
      });
      
      // Responder com o usuário atualizado
      res.status(200).json({
        status: 'success',
        user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Alterar senha do usuário
   */
  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      
      // Verificar senha atual
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordCorrect) {
        throw new AppError('Senha atual incorreta', 401);
      }
      
      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Atualizar usuário
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword
        }
      });
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
