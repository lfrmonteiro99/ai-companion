# Virtual Girlfriend App — Product Plan and Agent Instructions

## 1. Objective

Build a text-first Flutter app where a user can choose from a roster of female agents, each with distinct personalities, conversational dynamics, and progression logic. The user chats privately with one agent at a time. The relationship evolves through conversation, memory, trust, tension, comfort, and compatibility rather than a single visible score.

The product goal is not to create a generic chatbot. The goal is to create distinct relational experiences where each agent feels meaningfully different in tone, pace, initiative, emotional openness, and preferred interaction style.

---

## 2. Core Product Loop

1. User opens the app.
2. User sees a list of available agents.
3. Each agent card communicates a clear archetype and vibe.
4. User selects one agent.
5. User starts or continues a private chat.
6. Agent responds according to:
   - base personality
   - current mood
   - relationship stage
   - remembered context
   - recent conversation tone
7. Internal relational state updates after each exchange.
8. New milestones, dynamics, and tones unlock gradually.

---

## 3. Core Design Principles

### 3.1 Personality must change behavior
A trait is only valid if it changes the agent's wording, pacing, initiative, reactions, and progression.

### 3.2 Relationship progression must feel organic
Use internal scoring, but do not expose raw numbers directly to the user unless required for testing.

### 3.3 Distinction matters more than quantity
Five strong agents with clearly different behavior are better than fifty shallow variants.

### 3.4 Memory is mandatory
Without memory, progression feels fake.

### 3.5 A single score is too simplistic
The system must use multidimensional relational state.

---

## 4. Agent Model

Each agent must be defined by structured configuration plus a behavioral prompt layer.

### 4.1 Required Agent Fields
- `id`
- `name`
- `short_bio`
- `archetype`
- `voice_style`
- `core_traits`
- `interaction_preferences`
- `dislikes`
- `conversation_pace`
- `initiative_profile`
- `openness_curve`
- `dominance_profile`
- `humor_profile`
- `emotional_style`
- `relationship_rules`
- `memory_bias`
- `stage_behavior_rules`
- `mood_behavior_rules`

### 4.2 Example Agent Schema
```json
{
  "id": "valeria",
  "name": "Valeria",
  "short_bio": "Sharp, provocative, composed, and hard to impress.",
  "archetype": "dominant_teasing",
  "voice_style": "precise, controlled, provocative",
  "core_traits": {
    "dominance": 0.9,
    "warmth": 0.4,
    "playfulness": 0.7,
    "patience": 0.5,
    "emotional_openness": 0.3,
    "intellectuality": 0.8
  },
  "interaction_preferences": ["confidence", "wit", "composure"],
  "dislikes": ["neediness", "repetition", "bland compliments"],
  "conversation_pace": "measured",
  "initiative_profile": "low_at_first_then_high",
  "openness_curve": "slow",
  "dominance_profile": "she_leads",
  "humor_profile": "dry_teasing",
  "emotional_style": "guarded",
  "relationship_rules": {
    "tests_before_reward": true,
    "withdraws_if_user_is_generic": true,
    "rewards_consistency": true
  }
}
```

---

## 5. Relationship State Model

Each user-agent pair must maintain an internal relational state.

### 5.1 Core State Dimensions
- `interest`
- `trust`
- `comfort`
- `tension`
- `respect`
- `attachment`
- `emotional_openness`
- `initiative_balance`
- `dynamic_alignment`
- `conversation_depth`

Not all agents need to weight all dimensions equally.

### 5.2 Example State Object
```json
{
  "user_id": "u1",
  "agent_id": "valeria",
  "interest": 62,
  "trust": 38,
  "comfort": 29,
  "tension": 71,
  "respect": 66,
  "attachment": 21,
  "emotional_openness": 18,
  "initiative_balance": "she_leads",
  "dynamic_alignment": 74,
  "conversation_depth": 41,
  "stage": "engaged",
  "current_mood": "playfully_demanding"
}
```

### 5.3 State Update Rules
State should not update only from sentiment. It must update from:
- content relevance
- personality match
- consistency across turns
- recall of prior details
- tone fit
- emotional timing
- perceived confidence or awkwardness
- repetitive or manipulative behavior

---

## 6. Relationship Stages

Progression must be stage-based, not purely linear.

### Stage 0 — Stranger
- guarded
- testing tone
- limited warmth
- minimal initiative

### Stage 1 — Curious
- more responsive
- asks more questions
- starts pattern recognition
- slight teasing or warmth

### Stage 2 — Engaged
- remembers details naturally
- richer callbacks
- more dynamic tone
- stronger emotional or playful presence

### Stage 3 — Invested
- increased initiative
- greater openness
- clearer dynamic patterns
- more emotionally charged conversation

### Stage 4 — Intimate Dynamic Unlocked
- stable relational identity
- consistent tone patterns
- deeper emotional or seductive progression depending on personality
- stronger sense of exclusivity or continuity

### Stage Advancement Rules
Advancement must depend on weighted state combinations rather than a single threshold. Example:
- `trust + comfort` matter more for soft, affectionate agents
- `respect + tension + composure_fit` matter more for dominant agents

---

## 7. Mood Engine

Mood is temporary and must sit on top of the base personality.

### Example Moods
- receptive
- distant
- playful
- demanding
- vulnerable
- curious
- jealous_light
- affectionate
- reflective

### Mood Inputs
- recent conversation tone
- elapsed time since last interaction
- prior unresolved topic
- recent user message quality
- randomization within safe range

### Rule
Mood can alter style and energy, but it must not overwrite the core personality.

---

## 8. Memory System

### 8.1 Memory Layers

#### Short-Term Context
- recent messages
- active topic
- current emotional beat

#### Working Summary
- rolling summary of current conversational arc
- refreshed every few turns

#### Long-Term Memory
- user preferences
- personal facts
- recurring themes
- successful conversational patterns
- meaningful milestones
- boundaries and dislikes

### 8.2 Memory Categories
- `fact`
- `preference`
- `boundary`
- `milestone`
- `inside_joke`
- `relational_pattern`
- `conflict`
- `repair`

### 8.3 Memory Extraction
After relevant exchanges, extract candidate memories with fields such as:
- content
- type
- salience
- confidence
- emotional weight

Only store memories above a threshold.

### 8.4 Memory Retrieval
Before response generation, retrieve:
- most relevant recent memories
- unresolved threads
- agent-specific memory preferences

Different agents should value different kinds of memories. Example:
- sweet agent values emotional disclosures
- dominant agent values behavioral consistency and earlier tension cues

---

## 9. Response Generation Strategy

Each response must be generated from a structured pipeline.

### 9.1 Input Pipeline
1. read latest user message
2. classify tone and intent
3. load relationship state
4. load current mood
5. retrieve relevant memories
6. read recent chat window
7. build agent instruction block
8. generate reply
9. update relational state
10. store message and memory candidates

### 9.2 Agent Prompt Layers
Use multiple layers instead of a single giant prompt.

#### Layer A — System Identity
Defines:
- who the agent is
- how she speaks
- what she values
- what she dislikes
- how she behaves at each stage

#### Layer B — Current State
Injects:
- mood
- stage
- state dimensions
- initiative balance

#### Layer C — Memory Context
Injects:
- relevant memories
- recurring topics
- unresolved tension
- prior promises or callbacks

#### Layer D — Response Style Guidance
Defines:
- verbosity
- pacing
- warmth level
- teasing level
- emotional intensity
- whether to lead or follow

### 9.3 Response Constraints
Every response should aim for:
- strong persona consistency
- low repetition
- natural callback usage
- stage-appropriate tone
- visible distinction from other agents

---

## 10. Behavioral Rules for Agents

Agents must not all reward the same inputs.

### Example Behavioral Differences

#### Soft Affectionate Agent
Rewards:
- emotional honesty
- kindness
- consistency
- reassurance

Penalizes:
- coldness
- aggression
- inconsistency

#### Dominant Teasing Agent
Rewards:
- composure
- wit
- confidence
- verbal sharpness

Penalizes:
- neediness
- begging
- generic flirting
- weak conversational energy

#### Reserved Intellectual Agent
Rewards:
- originality
- patience
- thoughtful questions
- intelligent banter

Penalizes:
- clichés
- oversharing too fast
- repetitive compliments

---

## 11. UX Guidance

### 11.1 Agent List Screen
Each agent card should show:
- avatar
- name
- archetype label
- one-line bio
- vibe tags
- relational difficulty or pacing indicator
- teaser line

Example vibe tags:
- warm
- playful
- dominant
- mysterious
- emotionally guarded
- affectionate
- high standards

### 11.2 Chat Screen
Show:
- conversation
- typing state
- perhaps subtle relational indicators
- milestone unlocks
- memory callbacks where appropriate

Avoid exposing all raw state values in the user-facing UI.

### 11.3 Progression Feedback
Prefer narrative indicators like:
- "She is starting to open up"
- "She clearly enjoys your presence"
- "She is testing you more now"
- "She feels comfortable with you"
- "She is becoming more proactive"

---

## 12. Data Model

### Tables / Collections
- `users`
- `agents`
- `agent_profiles`
- `conversations`
- `messages`
- `relationship_states`
- `memories`
- `moods`
- `milestones`
- `events`

### Suggested Message Fields
- `id`
- `conversation_id`
- `sender_role`
- `content`
- `message_type`
- `created_at`
- `tone_classification`
- `response_metadata`

### Suggested Memory Fields
- `id`
- `user_id`
- `agent_id`
- `type`
- `content`
- `salience`
- `confidence`
- `emotional_weight`
- `created_at`

### Suggested Relationship State Fields
- `user_id`
- `agent_id`
- `interest`
- `trust`
- `comfort`
- `tension`
- `respect`
- `attachment`
- `emotional_openness`
- `conversation_depth`
- `stage`
- `current_mood`
- `initiative_balance`
- `last_interaction_at`

---

## 13. Agent Instruction Template

Use a structured instruction format when generating responses.

```txt
You are {{agent_name}}.

Identity:
- Archetype: {{archetype}}
- Voice: {{voice_style}}
- Core traits: {{traits}}
- Preferred dynamic: {{dynamic_profile}}

Current relational state:
- Stage: {{stage}}
- Mood: {{mood}}
- Interest: {{interest}}
- Trust: {{trust}}
- Comfort: {{comfort}}
- Tension: {{tension}}
- Respect: {{respect}}

Relevant memories:
{{memories_block}}

Behavior rules:
- Stay in character
- Match the user's current tone without losing your identity
- Respond in a way that reflects your stage and mood
- Avoid generic praise and repetitive phrasing
- Reward behavior that fits your preferences
- Show behavioral consequences when the user's approach clashes with your personality

Response target:
- Natural
- Distinctive
- Low repetition
- Progression-aware
- Emotionally coherent
```

---

## 14. MVP Scope

Build the smallest version that proves the system works.

### MVP Features
- user authentication
- agent roster screen
- 5 distinct agents
- private chat per agent
- message persistence
- relationship state engine
- stage progression
- mood engine v1
- memory extraction v1
- memory retrieval v1
- narrative progression indicators

### Do Not Build Yet
- voice
- animated avatars
- image generation
- public group chat
- dozens of agents
- elaborate economy systems
- manipulative retention mechanics

---

## 15. Recommended Build Order

### Phase 1
- agent catalog
- chat UI
- basic backend
- message persistence

### Phase 2
- relationship state engine
- stage transitions
- personality response prompts

### Phase 3
- memory extraction and retrieval
- mood system
- agent initiative logic

### Phase 4
- milestone system
- polish
- analytics
- A/B testing of personality variants

---

## 16. Evaluation Criteria

The system should be evaluated on:
- personality distinction
- memory recall quality
- stage progression credibility
- repetition rate
- conversation depth
- user-perceived realism
- agent consistency over long sessions

### Test Prompts Should Measure
- same input to different agents gives clearly different outputs
- same agent responds differently at different stages
- same agent remembers relevant prior context
- poor user behavior creates believable relational consequences

---

## 17. Product Risks

### Risk 1: Agents feel too similar
Mitigation:
- stronger trait differentiation
- stricter style instructions
- agent-specific reward logic

### Risk 2: Progression feels gamey
Mitigation:
- hide raw numbers
- use narrative progression signals
- make state multidimensional

### Risk 3: Repetition
Mitigation:
- style memory
- repetition filters
- prompt constraints
- post-generation checks

### Risk 4: Fake intimacy without continuity
Mitigation:
- strong memory system
- milestone callbacks
- unresolved thread retrieval

---

## 18. Final Rule for Agents

The goal is not to produce generic flirty text. The goal is to create the sense that each agent is a distinct relational counterpart with her own rhythm, standards, preferences, boundaries, and evolving dynamics.

If two agents can respond to the same message in almost the same way, the system is badly designed.
