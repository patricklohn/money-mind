import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

/**
 * Controlador para gerenciar categorias de transações
 */
export class CategoryController {
  /**
   * Obter todas as categorias
   */
  public static async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.query;
      
      // Construir filtros
      const filters: any = {};
      
      if (type) {
        if (!['income', 'expense', 'both'].includes(type as string)) {
          throw new AppError('Tipo de categoria inválido', 400);
        }
        
        filters.OR = [
          { type: type as string },
          { type: 'both' }
        ];
      }
      
      // Buscar categorias
      const categories = await prisma.category.findMany({
        where: filters,
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' }
        ]
      });
      
      // Responder com as categorias
      res.status(200).json({
        status: 'success',
        count: categories.length,
        categories
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter uma categoria pelo ID
   */
  public static async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.id);
      
      // Buscar categoria
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        throw new AppError(`Categoria com ID ${categoryId} não encontrada`, 404);
      }
      
      // Responder com a categoria
      res.status(200).json({
        status: 'success',
        category
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Criar uma nova categoria
   */
  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, icon, color, type, isDefault } = req.body;
      
      // Validar tipo de categoria
      if (!['income', 'expense', 'both'].includes(type)) {
        throw new AppError('Tipo de categoria inválido', 400);
      }
      
      // Verificar se já existe uma categoria com o mesmo nome
      const existingCategory = await prisma.category.findFirst({
        where: { name }
      });
      
      if (existingCategory) {
        throw new AppError(`Já existe uma categoria com o nome ${name}`, 400);
      }
      
      // Criar categoria
      const category = await prisma.category.create({
        data: {
          name,
          icon,
          color,
          type,
          isDefault: Boolean(isDefault)
        }
      });
      
      // Responder com a categoria criada
      res.status(201).json({
        status: 'success',
        category
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Atualizar uma categoria existente
   */
  public static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.id);
      const { name, icon, color, type, isDefault } = req.body;
      
      // Verificar se a categoria existe
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!existingCategory) {
        throw new AppError(`Categoria com ID ${categoryId} não encontrada`, 404);
      }
      
      // Validar tipo de categoria
      if (type && !['income', 'expense', 'both'].includes(type)) {
        throw new AppError('Tipo de categoria inválido', 400);
      }
      
      // Verificar se já existe outra categoria com o mesmo nome
      if (name && name !== existingCategory.name) {
        const duplicateCategory = await prisma.category.findFirst({
          where: { 
            name,
            id: { not: categoryId }
          }
        });
        
        if (duplicateCategory) {
          throw new AppError(`Já existe uma categoria com o nome ${name}`, 400);
        }
      }
      
      // Atualizar categoria
      const category = await prisma.category.update({
        where: { id: categoryId },
        data: {
          name,
          icon,
          color,
          type,
          isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined
        }
      });
      
      // Responder com a categoria atualizada
      res.status(200).json({
        status: 'success',
        category
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Excluir uma categoria
   */
  public static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.id);
      
      // Verificar se a categoria existe
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!existingCategory) {
        throw new AppError(`Categoria com ID ${categoryId} não encontrada`, 404);
      }
      
      // Verificar se é uma categoria padrão
      if (existingCategory.isDefault) {
        throw new AppError('Não é possível excluir uma categoria padrão', 400);
      }
      
      // Verificar se há transações associadas
      const transactionCount = await prisma.transaction.count({
        where: { categoryId }
      });
      
      if (transactionCount > 0) {
        throw new AppError('Não é possível excluir uma categoria com transações associadas', 400);
      }
      
      // Excluir categoria
      await prisma.category.delete({
        where: { id: categoryId }
      });
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'Categoria excluída com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CategoryController;
