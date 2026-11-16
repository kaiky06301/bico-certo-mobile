# Bico Certo Mobile

> **Global Solution 2026/2 · CitizenTech · Mobile Application Development (FIAP)**
> App em React Native (Expo) que conecta moradores a prestadores de serviço do próprio bairro, com **triagem inteligente do problema** e **preço justo**.

| | |
|---|---|
| **Vídeo (até 5 min)** | `LINK_DO_VIDEO` |
| **Publicação (Firebase App Distribution)** | `LINK_DO_FIREBASE` |
| **API Java (usuários, pedidos e triagem com IA)** | https://github.com/kaiky06301/bico-certo-java |
| **API .NET (orçamentos e contratações)** | `LINK_DO_REPOSITORIO_DOTNET` |

---

## O problema e a solução

Quem precisa de um eletricista, encanador ou diarista na periferia depende de indicação e **não sabe quanto é justo pagar**. O prestador bom do bairro, por sua vez, não consegue clientes fora do seu círculo.

No **Bico Certo**:
1. O morador descreve o problema com as próprias palavras.
2. O app mostra o que a **análise do Bico Certo** entendeu: tipo de serviço, urgência, **faixa de preço justo** e uma dica de segurança para seguir enquanto espera.
3. Os prestadores daquela área recebem um aviso e enviam **orçamentos**.
4. O morador escolhe um orçamento, agenda a data e, no fim, **avalia** o prestador.

---

## Telas

| # | Tela | Perfil | O que faz |
|---|---|---|---|
| 1 | **Login** | público | Autenticação real com JWT na API Java |
| 2 | **Cadastro** | público | Cria conta de cliente ou de prestador (com o serviço que oferece) |
| 3 | **Novo pedido** | cliente | Descreve o problema → **análise com IA** (prévia) → confirma o pedido |
| 4 | **Meus pedidos** | cliente | Lista com status, urgência e preço justo (puxar para atualizar) |
| 5 | **Detalhe do pedido** | cliente | Orçamentos recebidos, contratação com data, cancelar e avaliar com estrelas |
| 6 | **Editar pedido** | cliente | Corrige a descrição; a análise é refeita |
| 7 | **Pedidos abertos** | prestador | Pedidos da sua área esperando orçamento |
| 8 | **Detalhe do serviço** | prestador | Envia orçamento, inicia e conclui o serviço |
| 9 | **Agenda** | prestador | Serviços contratados em ordem de data |
| 10 | **Avisos** | ambos | Notificações geradas pela API (com selo de não lidas na aba) |
| 11 | **Perfil** | ambos | Dados do usuário e logout |
| + | **Sobre o App** | ambos | Versão e **hash do commit** de referência (não conta para o mínimo de 6 telas) |

---

## Requisitos atendidos

| Requisito | Como foi feito |
|---|---|
| **1. Mínimo de 6 telas + navegação** | 11 telas + Sobre, com **React Navigation**: pilha de autenticação e, depois do login, abas e pilha diferentes para cliente e prestador (`src/navigation`) |
| **2. CRUD com a API (Axios)** | **Pedidos (API Java):** criar (`POST`), listar e detalhar (`GET`), editar (`PUT`) e cancelar (`DELETE`). Também orçamentos e contratações na API .NET. Loaders, mensagens de erro, "tentar de novo" e puxar para atualizar em todas as listas |
| **3. Autenticação** | Cadastro e login reais na API Java (JWT), **sessão persistida** (AsyncStorage) com expiração, **logout** que limpa a sessão e o cache, e **rotas protegidas** (sem login só existem Login e Cadastro). Token expirado (401) encerra a sessão automaticamente |
| **4. Estilização** | Identidade própria: paleta laranja e azul-marinho (`src/theme/cores.ts`), fonte **Poppins**, logo, ícone e splash próprios (`assets/`), ícones Ionicons, componentes com área de toque ≥ 48 px e rótulos de acessibilidade |
| **5. Arquitetura** | Camadas separadas por responsabilidade (abaixo), TypeScript, **ESLint + Prettier** (`npm run lint`, `npm run format`) |
| **6. Vídeo** | `LINK_DO_VIDEO` |
| **7. Publicação** | Firebase App Distribution, com o professor como testador; tela **Sobre o App** com o hash do commit (`app.config.js`) |

---

## Arquitetura

```
src/
├── config/        endereços das APIs (variáveis de ambiente / IP do Metro em desenvolvimento)
├── models/        tipos TypeScript dos dados das APIs
├── services/      acesso às APIs com Axios (httpClient com token e tratamento de 401) + AsyncStorage
├── hooks/         consultas com React Query (cache, atualização e chaves)
├── contexts/      AuthContext: sessão, login, cadastro e logout (Context API)
├── validation/    esquemas de validação dos formulários com Yup
├── navigation/    pilhas e abas por perfil (rotas protegidas)
├── screens/       telas separadas em auth/, cliente/, prestador/ e comum/
├── components/    componentes visuais reutilizáveis (Botao, CampoTexto, Cartao, Selo...)
├── theme/         cores, fontes, tamanhos e espaçamentos
└── utils/         formatação (moeda, data), mensagens de erro e agenda
```

```mermaid
flowchart LR
    T["Telas<br/>(screens)"] --> H["Hooks<br/>React Query"]
    T --> C["AuthContext"]
    H --> S["Services<br/>Axios"]
    C --> S
    C --> A[("AsyncStorage<br/>sessao")]
    S -- "JWT" --> J["API Java<br/>pedidos, triagem IA,<br/>avisos"]
    S -- "JWT + Idempotency-Key" --> N["API .NET<br/>orcamentos e<br/>contratacoes"]
```

**Decisões técnicas:**
- **Axios com interceptadores:** o token entra em todas as requisições e o 401 encerra a sessão num único lugar.
- **React Query:** cache, recarregamento e estados de carregando e erro sem repetir código em cada tela.
- **Idempotency-Key:** ao aceitar um orçamento ou enviar uma proposta, o app gera uma chave única e a reutiliza se o usuário tocar duas vezes ou a internet falhar. Assim a API .NET **não duplica a contratação**.
- **Mesmo login nas duas APIs:** o JWT emitido pela API Java também é aceito pela API .NET.

---

## Tecnologias

| Biblioteca | Para quê |
|---|---|
| Expo SDK 58 + React Native + TypeScript | Base do app |
| `@react-navigation/native-stack` e `bottom-tabs` | Navegação |
| `axios` | Requisições HTTP às APIs |
| `@tanstack/react-query` | Cache e estado das requisições |
| `@react-native-async-storage/async-storage` | Persistir a sessão |
| `yup` | Validação dos formulários |
| `expo-font` + `@expo-google-fonts/poppins` | Fonte da identidade visual |
| `expo-constants` | Ler a versão e o hash do commit (tela Sobre) |
| `expo-splash-screen` | Splash com a marca até as fontes carregarem |
| ESLint (`eslint-config-expo`) + Prettier | Padronização do código |

---

## Como rodar

**Pré-requisitos:** Node 20+, o app **Expo Go** no celular (mesma rede Wi-Fi do computador) e as duas APIs rodando.

```bash
# 1. APIs (em outros terminais) - veja o README de cada uma
#    API Java na porta 8080 e API .NET na porta 5090

# 2. App
git clone LINK_DO_REPOSITORIO
cd bico-certo-mobile
npm install
npx expo start
```

Leia o QR Code com o Expo Go. Em desenvolvimento, o app usa automaticamente o IP do computador que está rodando o Metro para chegar às APIs. Para apontar para APIs publicadas, defina `EXPO_PUBLIC_JAVA_API_URL` e `EXPO_PUBLIC_NET_API_URL`.

**Usuários de teste** (senha `senha123`):

| Perfil | E-mail |
|---|---|
| Cliente | `maria@bicocerto.com.br` |
| Prestador (elétrica) | `joao@bicocerto.com.br` |
| Prestador (encanamento) | `carlos@bicocerto.com.br` |

**Qualidade do código:**
```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run format      # Prettier
```

---

## Integrantes

**Grupo:** Bico Certo Labs

| Nome | RM | Turma |
|---|---|---|
| Erick Bernardes Bradaschia | RM565733 | 2TDSR |
| Gabriel Santos Claudino | RM564054 | 2TDSR |
| Kaiky de Oliveira Silva | RM566067 | 2TDSR |
| Lucas Fortes de Lima | RM559523 | 2TDSR |
| Jonathan Moreira Gomes | RM565060 | 2TDSR |
