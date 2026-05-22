# Projeto: Avalia-me

Este documento serve como a memória de desenvolvimento e diretrizes do projeto **Avalia-me** para guiar agentes inteligentes de codificação no Google AI Studio. 

## 📋 Resumo do Estado Atual do Projeto

O **Avalia-me** é um aplicativo full-stack em React (Vite + TypeScript) integrado com o **Firebase (Authentication e Firestore)**. 

### Funcionalidades Implementadas:
1. **Página de Login Elegante (`src/pages/Login.tsx`)**:
   - Campos customizados com ícones dinâmicos do `lucide-react`.
   - Sistema de visualização/ocultação de senha com ícones de Olho (`Eye` e `EyeOff`) e medidor de força da senha em tempo real.
   - Mecanismo robusto contra restrições de iframe (`auth/network-request-failed`), oferecendo guias explicativos de segurança aos usuários e link de abertura externa do applet.
   - Suporte a Contas de Teste Rápido (Demonstração) para prestadores e clientes com autoalimentação resiliente no Firestore.
2. **Prevenção Inteligente de Falhas de Permissão / Provedores (`auth/operation-not-allowed`)**:
   - Tratamento detalhado de erros que orienta o usuário passo a passo a ativar os métodos de login (Google, Facebook, E-mail/Senha) diretamente no Console do Firebase, com link automático para o painel de provedores do projeto atual.
3. **Registro com Unicidade de Telefone**:
   - Integrado via Firestore na collection `/phones/{phoneId}`, acoplado com regras de segurança estritas e transações de registro resilientes (caso o telefone já esteja cadastrado, a criação do usuário no Auth é automaticamente revertida para manter a integridade).

## 🛠️ Configuração Técnica

### Variáveis de Ambiente (`.env.example`):
Certifique-se de que as credenciais do Firebase estejam devidamente espelhadas em seu novo ambiente.

### Regras de Segurança do Firestore (`firestore.rules`):
Possui controle para garantir a unicidade de telefones:
```javascript
match /phones/{phoneId} {
  allow get: if isSignedIn();
  allow create: if isSignedIn() && incoming().userId == request.auth.uid;
  allow delete: if isSignedIn() && existing().userId == request.auth.uid;
}
```

## 🚀 Orientações para o Próximo Agente

Quando o usuário solicitar novos recursos ou correções:
1. **Preserve a Integridade Visual**: Mantenha o design refinado com espaçamentos generosos, foco na legibilidade das fontes (Inter) e feedback em tempo real aos usuários.
2. **Manutenção do Firebase**: Sempre utilize a inicialização tardia e garanta que novas coleções no Firestore estejam devidamente cobertas no arquivo `/firestore.rules` antes do deploy.
3. **Erros de Segurança / IFrame**: Nunca omita as dicas amigáveis de como contornar os bloqueios de cookies/popups de terceiros nos navegadores.
