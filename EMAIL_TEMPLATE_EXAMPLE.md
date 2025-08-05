# Exemplo de Template de Email para Recuperação de Senha

Este documento mostra como configurar o template de email no backend (Strapi) para enviar o link de recuperação de senha.

## Estrutura da URL

A URL de recuperação deve seguir este padrão:
```
https://seu-dominio.com/reset-password?email=usuario@exemplo.com&code=CODIGO_GERADO
```

## Exemplo de Template HTML

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - Master Afiliados</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background: #5a6fd8;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Recuperação de Senha</h1>
        <p>Master Afiliados</p>
    </div>
    
    <div class="content">
        <h2>Olá, {{ user.username }}!</h2>
        
        <p>Recebemos uma solicitação para redefinir sua senha na plataforma Master Afiliados.</p>
        
        <p>Se você não fez essa solicitação, pode ignorar este email com segurança.</p>
        
        <div style="text-align: center;">
            <a href="{{ resetUrl }}" class="button">
                🔗 Redefinir Minha Senha
            </a>
        </div>
        
        <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
                <li>Este link é válido por 24 horas</li>
                <li>Não compartilhe este link com ninguém</li>
                <li>Se o botão não funcionar, copie e cole o link abaixo no seu navegador</li>
            </ul>
        </div>
        
        <p><strong>Link alternativo:</strong></p>
        <p style="word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 5px;">
            {{ resetUrl }}
        </p>
        
        <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
        
        <p>Atenciosamente,<br>
        <strong>Equipe Master Afiliados</strong></p>
    </div>
    
    <div class="footer">
        <p>Este email foi enviado automaticamente. Não responda a este email.</p>
        <p>&copy; 2024 Master Afiliados. Todos os direitos reservados.</p>
    </div>
</body>
</html>
```

## Configuração no Strapi

### 1. Configurar Plugin de Email

No arquivo `config/plugins.js`:

```javascript
module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: 'noreply@seudominio.com',
        defaultReplyTo: 'suporte@seudominio.com',
      },
    },
  },
});
```

### 2. Configurar Template de Email

No arquivo `config/email-templates.js`:

```javascript
module.exports = ({ env }) => ({
  'forgot-password': {
    subject: 'Recuperação de Senha - Master Afiliados',
    template: 'forgot-password',
    variables: {
      resetUrl: '{{ resetUrl }}',
      user: '{{ user }}',
    },
  },
});
```

### 3. Configurar Controller de Recuperação

No arquivo `src/api/auth/controllers/auth.js`:

```javascript
const forgotPassword = async (ctx) => {
  const { email } = ctx.request.body;
  
  try {
    // Gerar código de recuperação
    const resetToken = strapi.plugins['users-permissions'].services.user.generateResetToken();
    
    // Salvar token no usuário
    const user = await strapi.query('user', 'users-permissions').findOne({ email });
    if (!user) {
      return ctx.badRequest('Email não encontrado');
    }
    
    await strapi.query('user', 'users-permissions').update(
      { id: user.id },
      { resetToken, resetTokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    );
    
    // Construir URL de reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?email=${email}&code=${resetToken}`;
    
    // Enviar email
    await strapi.plugins['email'].services.email.send({
      to: email,
      subject: 'Recuperação de Senha - Master Afiliados',
      template: 'forgot-password',
      data: {
        user: {
          username: user.username,
          email: user.email,
        },
        resetUrl,
      },
    });
    
    ctx.send({ ok: true });
  } catch (error) {
    ctx.badRequest('Erro ao processar solicitação');
  }
};
```

## Variáveis de Ambiente

```env
# Frontend URL
FRONTEND_URL=https://seu-dominio.com

# Email Provider (SendGrid, Mailgun, etc.)
SENDGRID_API_KEY=sua_chave_api_aqui
```

## Exemplo de Email Enviado

O usuário receberá um email com:

1. **Assunto**: "Recuperação de Senha - Master Afiliados"
2. **Conteúdo**: Template HTML personalizado
3. **Link**: `https://seu-dominio.com/reset-password?email=usuario@exemplo.com&code=abc123def456`
4. **Validade**: 24 horas

## Segurança

- ✅ Token único e seguro
- ✅ Expiração automática
- ✅ Validação no backend
- ✅ Link direto sem necessidade de digitar código
- ✅ Avisos de segurança no email

## Testes

1. **Enviar email de recuperação**
2. **Clicar no link do email**
3. **Verificar se o código é lido automaticamente**
4. **Testar redefinição de senha**
5. **Verificar redirecionamento para login** 