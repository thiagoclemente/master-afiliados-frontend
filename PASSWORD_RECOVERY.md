# Sistema de Recuperação de Senha

Este documento descreve o sistema de recuperação de senha implementado no frontend do Master Afiliados.

## Funcionalidades Implementadas

### 1. Tela de Recuperação de Senha (`/forgot-password`)
- **Localização**: `/src/app/forgot-password/page.tsx`
- **Funcionalidade**: Permite ao usuário solicitar um código de recuperação de senha
- **Campos**:
  - Email (obrigatório)
- **Validações**:
  - Email deve ser válido
  - Email deve existir no sistema
- **Fluxo**:
  1. Usuário insere o email
  2. Sistema envia código de recuperação para o email
  3. Usuário recebe confirmação de envio

### 2. Tela de Redefinição de Senha (`/reset-password`)
- **Localização**: `/src/app/reset-password/page.tsx`
- **Funcionalidade**: Permite ao usuário redefinir a senha usando o código recebido via URL
- **Campos**:
  - Nova senha (obrigatório, mínimo 6 caracteres)
  - Confirmar nova senha (obrigatório)
- **Validações**:
  - Código deve estar presente na URL
  - Senhas devem coincidir
  - Senha deve ter pelo menos 6 caracteres
- **Fluxo**:
  1. Usuário acessa link do email com código na URL
  2. Sistema lê automaticamente o código da URL
  3. Usuário define nova senha
  4. Sistema valida e atualiza a senha
  5. Usuário é redirecionado para login

### 3. Integração com Login
- **Localização**: `/src/app/login/page.tsx`
- **Funcionalidade**: Link "Esqueci minha senha" adicionado à tela de login
- **Navegação**: Direciona para `/forgot-password`

## Estrutura de Arquivos

```
src/
├── app/
│   ├── forgot-password/
│   │   └── page.tsx          # Tela de solicitação de recuperação
│   ├── reset-password/
│   │   └── page.tsx          # Tela de redefinição de senha
│   └── login/
│       └── page.tsx          # Tela de login (atualizada)
├── services/
│   └── auth.service.ts       # Serviço de autenticação
└── context/
    └── auth-context.tsx      # Contexto de autenticação (atualizado)
```

## APIs Utilizadas

### 1. Solicitar Recuperação de Senha
```typescript
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

### 2. Redefinir Senha
```typescript
POST /api/auth/reset-password
Content-Type: application/json

{
  "code": "CODIGO_RECEBIDO",
  "password": "nova_senha",
  "passwordConfirmation": "nova_senha"
}
```

## Middleware e Proteção de Rotas

O middleware foi atualizado para permitir acesso às rotas de recuperação de senha:

```typescript
// Rotas públicas (não requerem autenticação)
const isPublicPath = request.nextUrl.pathname === "/" || 
                    isAuthPage || 
                    isForgotPasswordPage || 
                    isResetPasswordPage;
```

## Serviço de Autenticação

Criado o `AuthService` para centralizar as operações de autenticação:

```typescript
export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse>
  static async forgotPassword(email: string): Promise<ForgotPasswordResponse>
  static async resetPassword(code: string, password: string, passwordConfirmation: string): Promise<ResetPasswordResponse>
}
```

## Fluxo Completo de Recuperação

1. **Usuário acessa login** (`/login`)
2. **Clica em "Esqueci minha senha"** → Redireciona para `/forgot-password`
3. **Insere email** → Sistema envia código de recuperação
4. **Recebe email** com link de recuperação
5. **Acessa link do email** → Redireciona para `/reset-password?email=usuario@exemplo.com&code=CODIGO_RECUPERACAO`
6. **Sistema lê código automaticamente** → Usuário define nova senha
7. **Sistema valida e atualiza** → Redirecionado para login
8. **Pode fazer login** → Com nova senha

## Validações e Tratamento de Erros

### Validações do Frontend
- Email válido
- Senha com mínimo 6 caracteres
- Confirmação de senha
- Código de recuperação presente na URL

### Tratamento de Erros
- Erro de email não encontrado
- Erro de código inválido/expirado
- Erro de senha muito fraca
- Erro de rede/conexão

## Estilização

- **Design System**: Tailwind CSS
- **Ícones**: Lucide React
- **Responsividade**: Mobile-first
- **Estados**: Loading, error, success
- **Acessibilidade**: Labels, focus states, ARIA

## Configuração do Backend

Para que o sistema funcione corretamente, o backend (Strapi) deve estar configurado com:

1. **Plugin de Email** configurado
2. **Templates de email** para recuperação de senha
3. **Configuração de CORS** para permitir requisições do frontend
4. **Variáveis de ambiente** configuradas

## Variáveis de Ambiente

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

## Testes Recomendados

1. **Fluxo completo**: Solicitar recuperação → Receber email → Redefinir senha
2. **Validações**: Email inválido, senha fraca, códigos inválidos
3. **Responsividade**: Testar em diferentes tamanhos de tela
4. **Acessibilidade**: Navegação por teclado, leitores de tela
5. **Estados de erro**: Testar cenários de falha de rede 