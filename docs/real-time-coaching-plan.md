# Real-Time Coaching — Design & Implementation Plan

> Last updated: 2026-04-12

## 1. Visão do Produto

### O que é
Um painel de coaching discreto que aparece automaticamente durante a conversa, dando feedback em tempo real sobre a qualidade das mensagens do utilizador — sem ele ter de pedir.

### Diferença vs. features existentes

| Feature | Quando | Iniciativa | Custo LLM |
|---|---|---|---|
| **Hints** (existente) | Antes de enviar | Utilizador pede | 1 call por pedido |
| **Feedback pós-sessão** (existente) | Depois de terminar | Utilizador pede | 1 call grande |
| **Real-time coaching** (novo) | Após cada mensagem enviada | Automático | 1 call leve por mensagem |

### Para quem
Tier "Coach" (premium). Não disponível no tier free ou pro.

---

## 2. UX Design

### 2.1 Princípios

1. **Discreto, não intrusivo** — não pode distrair da conversa natural
2. **Actionável** — cada feedback deve dizer o que fazer diferente, não só o que está mal
3. **Positivo-first** — destacar o que foi bem antes de apontar melhorias
4. **Dismissível** — utilizador pode fechar/minimizar a qualquer momento
5. **Contextual** — feedback considera a personalidade do agente e o estado da relação

### 2.2 UI Layout

```
┌─────────────────────────────────────┐
│  Chat Header (agente + status)      │
├─────────────────────────────────────┤
│                                     │
│  [Agent message]                    │
│                                     │
│              [User message]         │
│              ┌─────────────────┐    │
│              │ 💡 Boa leitura  │    │  ← Coaching badge (inline)
│              │ do tom dela.    │    │
│              └─────────────────┘    │
│                                     │
│  [Agent message]                    │
│                                     │
│              [User message]         │
│              ┌─────────────────┐    │
│              │ ⚠️ Intenso      │    │
│              │ demais para     │    │
│              │ este momento.   │    │
│              │                 │    │
│              │ Tenta: "..."    │    │  ← Suggestion
│              └─────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  [Coaching summary bar]        [x]  │  ← Collapsible bottom bar
│  Confiança ●●●○○  Calibração ●●●●○ │
├─────────────────────────────────────┤
│  [Input] [Hint] [Send]             │
└─────────────────────────────────────┘
```

### 2.3 Componentes UI

#### A. Coaching Badge (por mensagem)
- Aparece abaixo de cada mensagem do utilizador (após resposta do agente)
- 3 variantes visuais:
  - **Verde** (positivo): "Boa leitura do tom." / "Resposta bem calibrada."
  - **Âmbar** (neutro): "Podia ter mais profundidade." / "Tom um pouco genérico."
  - **Vermelho** (negativo): "Intenso demais para este momento." / "Ignoraste um sinal dela."
- Clicável para expandir detalhes (sugestão alternativa)
- Animação: fade-in suave 0.5s após resposta do agente terminar
- Pode ser fechado individualmente (X)

#### B. Coaching Summary Bar (sessão)
- Barra fixa acima do input (abaixo das mensagens)
- Mostra 3-4 skills mais relevantes com mini-barras de progresso
- Atualiza em tempo real após cada avaliação
- Toggle para colapsar/expandir
- Só visível quando coaching está ativo

#### C. Coaching Toggle
- Switch no chat header: "Coach 🎓" on/off
- Permite desativar temporariamente sem sair do tier
- Estado persiste na sessão (não no DB)

### 2.4 Comportamento

| Evento | Comportamento |
|---|---|
| User envia mensagem | Agente responde normalmente via streaming |
| Agente termina resposta | Coaching avalia em background (não bloqueia) |
| Avaliação pronta (~1-2s) | Badge aparece com fade-in abaixo da mensagem do user |
| User clica badge | Expande: mostra sugestão alternativa + explicação |
| User fecha badge | Badge colapsa para ícone mínimo (dot colorido) |
| User desativa coaching | Todos os badges desaparecem, bar colapsa |
| Fim da sessão | Summary bar mostra evolução da sessão |

### 2.5 Frequência de avaliação

Não avaliar TODAS as mensagens — seria caro e overwhelming:
- **Avaliar**: a cada 2 mensagens do utilizador (ou todas se sessão curta < 8 msgs)
- **Skip**: mensagens muito curtas (< 3 palavras) a menos que sejam problemáticas
- **Sempre avaliar**: primeiras 2 mensagens (first impression matters)

---

## 3. Arquitectura Técnica

### 3.1 Fluxo de Dados

```
User sends message
       │
       ▼
[/api/chat/stream] ─── Agent response streaming (existing) ───► SSE: type="token"
       │
       ▼
Agent response complete, saved to DB
       │
       ├── Background tasks (existing): state delta, memory, milestones
       │
       └── NEW: Coaching evaluation (async, non-blocking)
              │
              ▼
       [evaluateSingleMessage()] ─── gpt-4o-mini call (~150 tokens)
              │
              ▼
       SSE: type="coaching" { impact, feedback, suggestion, scores }
              │
              ▼
       Frontend: renders CoachingBadge below user message
```

### 3.2 Novo SSE Event Type

```typescript
// Sent after "done" event, when coaching evaluation completes
{
  type: "coaching",
  messageIndex: number,       // Index of the user message being evaluated
  impact: "positive" | "neutral" | "negative",
  feedback: string,           // 1 sentence in Portuguese
  suggestion: string | null,  // Alternative message (only for neutral/negative)
  scores: {                   // Partial — only skills relevant to this message
    [key: string]: number     // e.g. { calibration: 72, warmth: 65 }
  }
}
```

### 3.3 Ficheiros a Criar/Modificar

#### Novos ficheiros:
| Ficheiro | Propósito |
|---|---|
| `lib/services/coaching.ts` | Serviço de avaliação single-message |
| `app/components/CoachingBadge.tsx` | Badge inline por mensagem |
| `app/components/CoachingSummaryBar.tsx` | Barra de resumo da sessão |

#### Ficheiros a modificar:
| Ficheiro | Mudança |
|---|---|
| `app/api/chat/stream/route.ts` | Adicionar coaching eval nos background tasks + novo SSE event |
| `app/components/ChatWindow.tsx` | Estado coaching, listener SSE, toggle, render badges + bar |
| `app/components/MessageBubble.tsx` | Aceitar prop `coaching` e render badge slot |
| `lib/types/index.ts` | Tipos `CoachingFeedback`, `CoachingBadgeData` |

### 3.4 Serviço de Coaching (`lib/services/coaching.ts`)

```typescript
interface CoachingInput {
  userMessage: string;
  agentReply: string;
  agent: AgentConfig;
  recentMessages: { role: string; content: string }[];  // Last 4-6 for context
  relationshipState: { stage: number; mood: string; trust: number; comfort: number };
}

interface CoachingFeedback {
  impact: "positive" | "neutral" | "negative";
  feedback: string;           // Max 1-2 sentences, Portuguese
  suggestion: string | null;  // Alternative phrasing
  dominantSkill: string;      // Which skill this most relates to
  scores: Record<string, number>;  // 2-3 relevant skill scores
}

async function evaluateSingleMessage(input: CoachingInput): Promise<CoachingFeedback>
```

**Prompt design** (gpt-4o-mini, ~150 token budget, temperature 0.4):
- Contexto: personalidade do agente, estado da relação, últimas mensagens
- Avalia APENAS a última mensagem do user
- Deve ser rápido e conciso — 1 frase de feedback + 1 sugestão opcional
- Output: JSON com impact, feedback, suggestion, scores
- Tudo em Português Brasileiro

### 3.5 Custo estimado

| Métrica | Valor |
|---|---|
| Tokens por coaching call | ~300 (input) + ~150 (output) = ~450 |
| Custo por call (gpt-4o-mini) | ~$0.0003 |
| Calls por sessão (10 msgs, eval every 2) | 5 |
| Custo coaching/sessão | ~$0.0015 |
| Custo adicional vs. sessão normal | +15-20% |

Viável para tier premium (€14/mês cobre centenas de sessões).

---

## 4. Implementação — Step by Step

### Step 1: Tipos e serviço de coaching
- Adicionar tipos `CoachingFeedback` a `lib/types/index.ts`
- Criar `lib/services/coaching.ts` com `evaluateSingleMessage()`
- Prompt optimizado para single-message evaluation

### Step 2: Stream endpoint
- Modificar `app/api/chat/stream/route.ts`
- Adicionar coaching evaluation aos background tasks
- Enviar novo SSE event `type: "coaching"` após avaliação
- Só ativar se user tier === "coach" (placeholder flag por agora)

### Step 3: Componentes UI
- Criar `CoachingBadge.tsx` — badge inline com 3 variantes (positivo/neutro/negativo)
- Criar `CoachingSummaryBar.tsx` — barra de skills acumuladas
- Expandable: click mostra sugestão alternativa

### Step 4: ChatWindow integration
- Adicionar estado `coachingData: Map<number, CoachingFeedback>`
- Listener para SSE `type: "coaching"` events
- Toggle switch no header
- Passar coaching data ao MessageBubble
- Render CoachingSummaryBar acima do input

### Step 5: MessageBubble update
- Aceitar prop `coaching?: CoachingFeedback`
- Render CoachingBadge abaixo da mensagem do user
- Delay de 0.5s após mensagem aparecer (para não ser imediato)

### Step 6: Gate por tier
- Verificar `user.tier` no stream endpoint
- Mostrar "Upgrade to Coach" no toggle se tier !== "coach"
- Placeholder até monetização ser implementada

---

## 5. Verificação

Após implementação:
1. Enviar mensagem no chat → agente responde → coaching badge aparece ~1-2s depois
2. Badge verde para mensagem bem calibrada
3. Badge âmbar/vermelho para mensagem genérica com sugestão alternativa
4. Click no badge → expande com detalhes
5. Toggle coaching off → badges desaparecem
6. Summary bar mostra skills e atualiza após cada avaliação
7. Verificar que coaching não atrasa o streaming da resposta do agente
8. Verificar custo: ~$0.0003 por avaliação no gpt-4o-mini
