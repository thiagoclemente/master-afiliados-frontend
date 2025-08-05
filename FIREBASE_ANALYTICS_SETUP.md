# Firebase Analytics Setup

## Configuração do Firebase Analytics

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

### 2. Como obter as credenciais do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto "master-afiliados"
3. Vá em "Project Settings" (ícone de engrenagem)
4. Na aba "General", role até "Your apps"
5. Clique em "Add app" e selecione "Web"
6. Registre o app e copie as configurações

### 3. Eventos Rastreados

O sistema rastreia automaticamente os seguintes eventos:

#### Eventos de Autenticação
- `login` - Quando o usuário faz login
- `sign_up` - Quando o usuário se registra

#### Eventos de Navegação
- `page_view` - Visualização de páginas (automático)

#### Eventos de Vídeos
- `video_play` - Reprodução de vídeo
- `video_download` - Download de vídeo
- `pack_access` - Acesso a pacote de vídeos

#### Eventos de Relatórios
- `commission_report_upload` - Upload de relatório de comissões
- `control_campaign` - Ações em campanhas (criar/editar/deletar)

#### Eventos de Conteúdo
- `art_view` - Visualização de art
- `sticker_view` - Visualização de sticker

#### Eventos de Busca
- `search` - Buscas realizadas

#### Eventos de Erro
- `error` - Erros da aplicação

### 4. Uso do Hook useAnalytics

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const { 
    trackEvent, 
    trackPageView, 
    trackLogin,
    trackVideoPlay,
    trackError 
  } = useAnalytics();

  // Rastrear evento customizado
  trackEvent('custom_event', { 
    parameter1: 'value1',
    parameter2: 'value2' 
  });

  // Rastrear reprodução de vídeo
  trackVideoPlay('Título do Vídeo', 'video_id');

  // Rastrear erro
  trackError('Mensagem de erro', 'error_code');
}
```

### 5. Componentes Implementados

#### AnalyticsProvider
- Rastreia automaticamente visualizações de página
- Define propriedades do usuário quando logado
- Integrado no layout principal da aplicação

#### Páginas com Tracking
- **Login**: Rastreia tentativas de login e erros
- **Vídeos**: Rastreia reprodução, download e acesso a pacotes
- **Comissões**: Rastreia upload de relatórios
- **Control Master**: Rastreia ações em campanhas
- **Arts/Stickers**: Rastreia visualizações

### 6. Visualização dos Dados

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto "master-afiliados"
3. Vá em "Analytics" no menu lateral
4. Visualize os eventos em tempo real ou relatórios

### 7. Configuração de Produção

Para produção, certifique-se de:
1. Configurar as variáveis de ambiente corretas
2. Habilitar o Analytics no Firebase Console
3. Configurar regras de privacidade conforme necessário
4. Testar os eventos em ambiente de produção

### 8. Privacidade e GDPR

O sistema está configurado para:
- Não rastrear dados pessoais sensíveis
- Respeitar configurações de privacidade do usuário
- Permitir desativação do tracking se necessário

### 9. Troubleshooting

#### Analytics não está funcionando
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o Analytics está habilitado no Firebase Console
3. Verifique o console do navegador para erros
4. Teste em modo de desenvolvimento

#### Eventos não aparecem
1. Aguarde alguns minutos (pode haver delay)
2. Verifique se o usuário não bloqueou analytics
3. Confirme se o evento está sendo chamado corretamente
4. Use o modo de debug do Firebase Analytics 