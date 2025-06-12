# MoneyMind - Aplicativo de Gestão Financeira

![MoneyMind Logo](https://via.placeholder.com/200x80?text=MoneyMind)

## 📋 Visão Geral

MoneyMind é uma aplicação completa de gestão financeira pessoal, desenvolvida com tecnologias modernas para oferecer uma experiência segura e intuitiva. O sistema permite aos usuários gerenciar transações, definir metas financeiras, conectar carteiras, visualizar relatórios detalhados e receber insights personalizados através de inteligência artificial.

### 🚀 Principais Funcionalidades

- **Dashboard Inteligente**: Visualização rápida de saldos, gastos e tendências
- **Gestão de Transações**: Registro, categorização e análise de receitas e despesas
- **Metas Financeiras**: Definição e acompanhamento de objetivos financeiros
- **Múltiplas Carteiras**: Integração com diferentes contas e métodos de pagamento
- **Autenticação Segura**: Login com proteção multi-fator (MFA)
- **Relatórios Detalhados**: Análises e gráficos para melhor compreensão financeira
- **Design Responsivo**: Experiência consistente em dispositivos desktop e mobile

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js**: Ambiente de execução JavaScript
- **TypeScript**: Superset tipado de JavaScript
- **Express**: Framework web para Node.js
- **Prisma ORM**: ORM moderno para TypeScript/Node.js
- **PostgreSQL**: Banco de dados relacional
- **JWT**: Autenticação baseada em tokens
- **Bcrypt**: Criptografia de senhas
- **Winston**: Sistema de logging

### Frontend
- **React**: Biblioteca JavaScript para interfaces
- **TypeScript**: Tipagem estática para JavaScript
- **Material UI**: Framework de componentes React
- **React Query**: Gerenciamento de estado e cache
- **Zustand**: Gerenciamento de estado global
- **Axios**: Cliente HTTP para requisições
- **Chart.js**: Biblioteca para visualização de dados
- **React Router**: Roteamento para aplicações React

## 🏗️ Arquitetura

O MoneyMind segue uma arquitetura moderna de três camadas:

1. **Frontend**: Interface de usuário em React/TypeScript
2. **Backend**: API RESTful em Node.js/Express/TypeScript
3. **Banco de Dados**: PostgreSQL com Prisma ORM

### Diagrama de Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Frontend   │────▶│   Backend   │────▶│  Database   │
│  React/TS   │◀────│  Node.js/TS │◀────│ PostgreSQL  │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🚀 Começando

### Pré-requisitos

- Node.js (v16+)
- PostgreSQL (v13+)
- npm ou yarn

### Instalação

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/moneymind.git
cd moneymind
```

#### 2. Configuração do Backend

```bash
# Entrar no diretório do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrações do Prisma
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

#### 3. Configuração do Frontend

```bash
# Entrar no diretório do frontend
cd ../frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🗄️ Estrutura do Projeto

### Backend

```
backend/
├── prisma/                  # Schema e migrações do Prisma
│   └── schema.prisma        # Definição do modelo de dados
├── src/
│   ├── config/              # Configurações da aplicação
│   ├── controllers/         # Controladores da API
│   ├── lib/                 # Bibliotecas e utilitários
│   ├── middlewares/         # Middlewares do Express
│   ├── routes/              # Rotas da API
│   ├── services/            # Lógica de negócios
│   ├── types/               # Definições de tipos TypeScript
│   └── utils/               # Funções utilitárias
├── .env.example             # Exemplo de variáveis de ambiente
├── package.json             # Dependências e scripts
└── tsconfig.json            # Configuração do TypeScript
```

### Frontend

```
frontend/
├── public/                  # Arquivos estáticos
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   ├── hooks/               # Hooks personalizados
│   ├── pages/               # Páginas da aplicação
│   ├── services/            # Serviços de API
│   ├── store/               # Gerenciamento de estado global
│   ├── styles/              # Estilos e temas
│   ├── types/               # Definições de tipos TypeScript
│   ├── utils/               # Funções utilitárias
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Ponto de entrada
├── .env.example             # Exemplo de variáveis de ambiente
├── package.json             # Dependências e scripts
└── tsconfig.json            # Configuração do TypeScript
```

## 🔐 Segurança

O MoneyMind implementa diversas camadas de segurança:

- **Autenticação JWT**: Tokens seguros para autenticação
- **Autenticação Multi-fator (MFA)**: Camada adicional de segurança
- **Criptografia de Dados**: Proteção de informações sensíveis
- **Proteção contra Ataques**: Medidas contra XSS, CSRF, SQL Injection
- **Validação de Entrada**: Verificação rigorosa de todos os dados
- **Auditoria e Logging**: Registro de atividades importantes
- **Compliance LGPD**: Conformidade com a Lei Geral de Proteção de Dados

## 📦 API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Autenticar usuário
- `POST /api/auth/verify-mfa` - Verificar código MFA
- `GET /api/auth/profile` - Obter perfil do usuário
- `PATCH /api/auth/profile` - Atualizar perfil do usuário
- `PATCH /api/auth/change-password` - Alterar senha
- `POST /api/auth/setup-mfa` - Configurar MFA
- `POST /api/auth/enable-mfa` - Ativar MFA
- `POST /api/auth/disable-mfa` - Desativar MFA

### Transações

- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Obter transação específica
- `PATCH /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Excluir transação
- `GET /api/transactions/summary/monthly` - Resumo mensal
- `GET /api/transactions/summary/category` - Resumo por categoria

### Metas

- `GET /api/goals` - Listar metas
- `POST /api/goals` - Criar meta
- `GET /api/goals/:id` - Obter meta específica
- `PATCH /api/goals/:id` - Atualizar meta
- `DELETE /api/goals/:id` - Excluir meta
- `POST /api/goals/:id/contribute` - Contribuir para meta

### Carteiras

- `GET /api/wallets` - Listar carteiras
- `POST /api/wallets` - Criar carteira
- `GET /api/wallets/:id` - Obter carteira específica
- `PATCH /api/wallets/:id` - Atualizar carteira
- `DELETE /api/wallets/:id` - Excluir carteira
- `PATCH /api/wallets/:id/balance` - Ajustar saldo

### Categorias

- `GET /api/categories` - Listar categorias
- `GET /api/categories/:id` - Obter categoria específica
- `POST /api/categories` - Criar categoria (admin)
- `PATCH /api/categories/:id` - Atualizar categoria (admin)
- `DELETE /api/categories/:id` - Excluir categoria (admin)

### Dashboard

- `GET /api/dashboard` - Obter dados do dashboard

## 🔧 Variáveis de Ambiente

### Backend (.env)

```
# Ambiente
NODE_ENV=development

# Servidor
PORT=3000
HOST=localhost

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/moneymind

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# MFA
MFA_SECRET=your_mfa_secret_key

# Logs
LOG_LEVEL=info
```

### Frontend (.env)

```
# API
VITE_API_URL=http://localhost:3000/api

# Ambiente
VITE_APP_ENV=development
```

## 🧪 Testes

### Backend

```bash
# Executar testes unitários
npm run test

# Executar testes com cobertura
npm run test:coverage
```

### Frontend

```bash
# Executar testes unitários
npm run test

# Executar testes com cobertura
npm run test:coverage
```

## 📝 Scripts Disponíveis

### Backend

- `npm run dev` - Inicia o servidor em modo de desenvolvimento
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Inicia o servidor em modo de produção
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes
- `npm run prisma:generate` - Gera o cliente Prisma
- `npm run prisma:migrate` - Executa migrações do banco de dados
- `npm run prisma:studio` - Abre o Prisma Studio

### Frontend

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes

## 🚀 Deploy

### Backend

1. Compile o TypeScript para JavaScript:
   ```bash
   npm run build
   ```

2. Configure as variáveis de ambiente para produção

3. Inicie o servidor:
   ```bash
   npm start
   ```

### Frontend

1. Compile o projeto para produção:
   ```bash
   npm run build
   ```

2. O diretório `dist` conterá os arquivos estáticos para deploy

3. Sirva os arquivos com um servidor web como Nginx ou Apache

## 📚 Documentação Adicional

- [Documentação da API](docs/api.md)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Seu Nome** - *Trabalho Inicial* - [SeuUsuario](https://github.com/SeuUsuario)

## 🙏 Agradecimentos

- Equipe de desenvolvimento
- Contribuidores
- Comunidade open source
