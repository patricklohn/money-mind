export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Cria um erro para requisições não encontradas
 * @param originalUrl URL que não foi encontrada
 * @returns AppError com status 404
 */
export const createNotFoundError = (originalUrl: string): AppError => {
  return new AppError(`Rota não encontrada: ${originalUrl}`, 404);
};

/**
 * Cria um erro para entidades não encontradas
 * @param entity Nome da entidade
 * @param id Identificador da entidade
 * @returns AppError com status 404
 */
export const createEntityNotFoundError = (entity: string, id?: string | number): AppError => {
  const message = id ? `${entity} com id ${id} não encontrado` : `${entity} não encontrado`;
  return new AppError(message, 404);
};

/**
 * Cria um erro para validação de dados
 * @param message Mensagem de erro
 * @returns AppError com status 400
 */
export const createValidationError = (message: string): AppError => {
  return new AppError(message, 400);
};

/**
 * Cria um erro para acesso não autorizado
 * @param message Mensagem de erro
 * @returns AppError com status 401
 */
export const createUnauthorizedError = (message = 'Não autorizado'): AppError => {
  return new AppError(message, 401);
};

/**
 * Cria um erro para acesso proibido
 * @param message Mensagem de erro
 * @returns AppError com status 403
 */
export const createForbiddenError = (message = 'Acesso proibido'): AppError => {
  return new AppError(message, 403);
};
