import './load-env.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { setTimeout as sleep } from 'node:timers/promises';
import { z } from 'zod';

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

const assistantRuntimeState = {
  lastBootCheckAt: null,
  lastBootCheckOk: null,
  lastBootCheckError: null,
  lastDecisionAt: null,
  lastDecisionOk: null,
  lastDecisionError: null,
  lastDecisionSource: null,
};

const AssistantActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  target: z.object({
    path: z.string().min(1),
    query: z.record(z.string(), z.string()).optional(),
  }),
});

const AssistantPayloadSchema = z.object({
  userMessage: z.string().min(1),
  context: z.object({
    role: z.string().min(1),
    roleLabel: z.string().min(1),
    currentPath: z.string().min(1),
    currentUser: z.string().nullable().optional(),
    selectedDepartmentId: z.string().nullable().optional(),
    selectedDepartmentName: z.string().optional(),
    recentMessages: z.array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().min(1),
      }),
    ).default([]),
    availableActions: z.array(AssistantActionSchema).default([]),
  }),
});

const OptionalStringField = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().min(1).optional(),
);

const OptionalStringArrayField = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.array(z.string().min(1)).max(6).optional(),
);

const AssistantDecisionSchema = z.object({
  type: z.enum(['navigate', 'ask', 'answer']),
  reply: z.string().min(1),
  thought: z.array(z.string().min(1)).max(3).default([]),
  actionId: OptionalStringField,
  optionIds: OptionalStringArrayField,
});

const AgentGraphState = Annotation.Root({
  payload: Annotation(),
  candidates: Annotation(),
  decision: Annotation(),
  decisionSource: Annotation(),
  result: Annotation(),
});

class AssistantLlmUnavailableError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AssistantLlmUnavailableError';
    this.code = 'assistant_llm_unavailable';
    this.status = 503;

    if ('cause' in options) {
      this.cause = options.cause;
    }
  }
}

function shouldRequireLlm() {
  return /^true$/i.test(process.env.ASSISTANT_REQUIRE_LLM ?? '');
}

function getAssistantConfigSummary() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim() ?? '';

  return {
    requireLlm: shouldRequireLlm(),
    apiKeyConfigured: Boolean(apiKey),
    model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL,
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL,
  };
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message || error.name || 'Unknown error';
  }

  return String(error ?? 'Unknown error');
}

function getErrorCauseMessage(error) {
  const cause = error?.cause;
  if (!cause) return '';

  if (cause instanceof Error) {
    return cause.message || cause.name || '';
  }

  if (typeof cause === 'object' && 'message' in cause) {
    return String(cause.message || '');
  }

  return String(cause);
}

function isRetryableAssistantError(error) {
  const message = `${getErrorMessage(error)} ${getErrorCauseMessage(error)}`.toLowerCase();
  return [
    'connection error',
    'fetch failed',
    'timeout',
    'etimedout',
    'econnreset',
    'eai_again',
    'enotfound',
    'socket hang up',
    'networkerror',
  ].some((token) => message.includes(token));
}

function buildAssistantDiagnostics(error) {
  const config = getAssistantConfigSummary();
  const cause = getErrorCauseMessage(error);

  return {
    ...config,
    message: getErrorMessage(error),
    ...(cause ? { cause } : {}),
    retryable: isRetryableAssistantError(error),
  };
}

function updateAssistantRuntimeState(patch) {
  Object.assign(assistantRuntimeState, patch);
}

export function getAssistantHealth() {
  return {
    ...getAssistantConfigSummary(),
    boot: {
      at: assistantRuntimeState.lastBootCheckAt,
      ok: assistantRuntimeState.lastBootCheckOk,
      error: assistantRuntimeState.lastBootCheckError,
    },
    lastDecision: {
      at: assistantRuntimeState.lastDecisionAt,
      ok: assistantRuntimeState.lastDecisionOk,
      error: assistantRuntimeState.lastDecisionError,
      source: assistantRuntimeState.lastDecisionSource,
    },
  };
}

async function invokeModelWithRetry(model, messages, options = {}) {
  const attempts = Math.max(1, Number(options.attempts ?? 2));
  const delayMs = Math.max(0, Number(options.delayMs ?? 350));
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await model.invoke(messages);
    } catch (error) {
      lastError = error;

      if (attempt >= attempts || !isRetryableAssistantError(error)) {
        throw error;
      }

      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，。！？、；：“”‘’（）()【】《》<>,.!?:;'"`~\-_/\\[\]{}|]/g, '');
}

function scoreAction(query, action) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const texts = [action.label, action.description, ...action.keywords]
    .map(normalizeText)
    .filter(Boolean);

  let best = 0;
  let strongHits = 0;
  let mediumHits = 0;

  for (const text of texts) {
    let nextScore = 0;

    if (text === normalizedQuery) {
      nextScore = 1000 + text.length;
    } else if (text.includes(normalizedQuery)) {
      nextScore = 700 + normalizedQuery.length;
    } else if (normalizedQuery.includes(text)) {
      nextScore = 500 + text.length;
    } else {
      const sharedChars = [...normalizedQuery].filter((char) => text.includes(char)).length;
      if (sharedChars >= 2) {
        nextScore = sharedChars * 20;
      }
    }

    if (!nextScore) {
      continue;
    }

    best = Math.max(best, nextScore);

    if (nextScore >= 500) {
      strongHits += 1;
    } else if (nextScore >= 120) {
      mediumHits += 1;
    }
  }

  const specificityBonus = Math.max(0, strongHits - 1) * 140 + (strongHits > 0 ? mediumHits * 40 : 0);
  return best + specificityBonus;
}

function selectCandidateActions(payload) {
  const { userMessage, context } = payload;
  const actions = context.availableActions ?? [];

  const ranked = actions
    .map((action) => ({
      action,
      score: scoreAction(userMessage, action),
    }))
    .sort((left, right) => right.score - left.score);

  const top = ranked.filter((item) => item.score > 0).slice(0, 24).map((item) => item.action);
  if (top.length > 0) {
    return top;
  }

  return actions.slice(0, 24);
}

function rankActions(query, actions) {
  return (actions ?? [])
    .map((action) => ({
      action,
      score: scoreAction(query, action),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);
}

function buildFallbackDecision(payload, candidates, error) {
  const query = payload.userMessage;
  const actions = (candidates?.length ? candidates : payload.context.availableActions) ?? [];
  const ranked = rankActions(query, actions);
  const top = ranked[0];
  const second = ranked[1];

  if (!top) {
    return {
      type: 'answer',
      reply: '我还没找到足够明确的页面动作。你可以直接说“看成绩”“打开某门课”或“去评价管理”。',
      thought: [
        '我先检查了你当前角色下可执行的页面动作。',
        '这句话还不足以锁定目标页面。',
      ],
    };
  }

  const gap = top.score - (second?.score ?? 0);
  const closeMatches = ranked
    .filter((item, index) => {
      if (index === 0) return true;
      return item.score >= Math.max(120, top.score - 120);
    })
    .slice(0, 4);

  const shouldNavigate =
    top.score >= 900 ||
    (top.score >= 700 && gap >= 120) ||
    (top.score >= 500 && (!second || gap >= 180)) ||
    (top.score >= 300 && !second);

  if (shouldNavigate) {
    return {
      type: 'navigate',
      reply: '我来带你过去。',
      thought: [
        '我先按你当前角色可执行的页面动作做了匹配。',
        `当前最接近的目标是“${top.action.label}”。`,
        error ? '这次先走本地决策，模型恢复后会优先用 LLM 判断。' : '信息已经足够，我直接执行跳转。',
      ],
      actionId: top.action.id,
    };
  }

  return {
    type: 'ask',
    reply: '我先筛出了几个接近的目标，你想去哪个页面？',
    thought: [
      '我先按你的表述缩小了候选范围。',
      '现在还有多个页面都比较接近，需要你确认一下。',
      error ? '这次先走本地决策，避免模型不可用时中断。' : '确认后我会直接跳转。',
    ],
    optionIds: closeMatches.map((item) => item.action.id),
  };
}

function stringifyMessageContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item) {
          return item.text;
        }
        return '';
      })
      .join('\n')
      .trim();
  }

  return String(content ?? '').trim();
}

function extractJsonObject(rawText) {
  const content = rawText.trim();

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Assistant returned non-JSON content: ${content}`);
    }
    return JSON.parse(match[0]);
  }
}

function createModel() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new AssistantLlmUnavailableError('未配置 DEEPSEEK_API_KEY，当前无法走 LLM 决策。');
  }

  return new ChatOpenAI({
    apiKey,
    model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL,
    temperature: 0.1,
    maxRetries: 2,
    timeout: 20000,
    configuration: {
      baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL,
    },
  });
}

export async function warmAssistantModel() {
  const startedAt = new Date().toISOString();

  try {
    const model = createModel();
    await invokeModelWithRetry(model, [new HumanMessage('ping')], {
      attempts: 1,
      delayMs: 0,
    });

    updateAssistantRuntimeState({
      lastBootCheckAt: startedAt,
      lastBootCheckOk: true,
      lastBootCheckError: null,
    });
  } catch (error) {
    const diagnostics = buildAssistantDiagnostics(error);

    updateAssistantRuntimeState({
      lastBootCheckAt: startedAt,
      lastBootCheckOk: false,
      lastBootCheckError: diagnostics,
    });

    console.warn('assistant_llm_boot_check_failed', diagnostics);
  }

  return getAssistantHealth();
}

function buildSystemPrompt() {
  return [
    '你是课程平台里的“小智”，职责是把用户的话理解成真实页面动作。',
    '你必须只在给定的 availableActions 中选择动作，绝对不能编造 actionId、页面路径、参数或权限。',
    '如果信息足够明确，返回 navigate；如果存在两个及以上合理候选，返回 ask，并在 optionIds 中放入 2 到 6 个 actionId；如果只是普通问答，返回 answer。',
    'thought 字段只能写给用户看的简短思路摘要，最多 3 条，每条一句，不要暴露隐藏推理，不要冗长。',
    'reply 要自然、简短、中文。',
    '输出必须是 JSON 对象，格式如下：',
    JSON.stringify({
      type: 'navigate | ask | answer',
      reply: '给用户展示的话',
      thought: ['思路摘要1', '思路摘要2'],
      actionId: '当 type=navigate 时填写',
      optionIds: ['当 type=ask 时填写 actionId 列表'],
    }, null, 2),
  ].join('\n');
}

function buildUserPrompt(payload, candidates) {
  const recentMessages = payload.context.recentMessages.slice(-6);

  return JSON.stringify({
    userMessage: payload.userMessage,
    role: payload.context.role,
    roleLabel: payload.context.roleLabel,
    currentPath: payload.context.currentPath,
    currentUser: payload.context.currentUser ?? '',
    selectedDepartmentId: payload.context.selectedDepartmentId ?? null,
    selectedDepartmentName: payload.context.selectedDepartmentName ?? '',
    recentMessages,
    availableActions: candidates.map((action) => ({
      id: action.id,
      label: action.label,
      description: action.description,
      keywords: action.keywords,
      path: action.target.path,
      query: action.target.query ?? {},
    })),
  }, null, 2);
}

async function prepareCandidatesNode(state) {
  return {
    candidates: selectCandidateActions(state.payload),
  };
}

async function decideNode(state) {
  try {
    const model = createModel();
    const response = await invokeModelWithRetry(model, [
      new SystemMessage(buildSystemPrompt()),
      new HumanMessage(buildUserPrompt(state.payload, state.candidates ?? [])),
    ]);

    const content = stringifyMessageContent(response.content);
    const parsed = AssistantDecisionSchema.parse(extractJsonObject(content));

    updateAssistantRuntimeState({
      lastDecisionAt: new Date().toISOString(),
      lastDecisionOk: true,
      lastDecisionError: null,
      lastDecisionSource: 'llm',
    });

    return {
      decision: parsed,
      decisionSource: 'llm',
    };
  } catch (error) {
    const diagnostics = buildAssistantDiagnostics(error);

    updateAssistantRuntimeState({
      lastDecisionAt: new Date().toISOString(),
      lastDecisionOk: false,
      lastDecisionError: diagnostics,
      lastDecisionSource: shouldRequireLlm() ? 'llm' : 'fallback',
    });

    if (shouldRequireLlm()) {
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new AssistantLlmUnavailableError(`当前要求必须走 LLM，但本次模型调用失败：${message}`, {
        cause: error,
      });
    }

    console.warn('Assistant LLM unavailable, using local fallback:', error?.message || error);
    return {
      decision: buildFallbackDecision(state.payload, state.candidates ?? [], error),
      decisionSource: 'fallback',
    };
  }
}

function finalizeNode(state) {
  const payload = state.payload;
  const decision = state.decision;
  const decisionSource = state.decisionSource === 'llm' ? 'llm' : 'fallback';
  const candidateActions = state.candidates ?? [];
  const allActions = payload.context.availableActions ?? [];
  const actionMap = new Map(allActions.map((action) => [action.id, action]));

  const thought = Array.isArray(decision.thought) ? decision.thought.slice(0, 3) : [];

  if (decision.type === 'navigate') {
    const action = decision.actionId ? actionMap.get(decision.actionId) : null;

    if (!action) {
      return {
        result: {
          type: 'answer',
          source: decisionSource,
          reply: '我理解到你的目标了，但还缺少一个可执行的页面动作。你可以换个说法，或者点下面的选项。',
          thought,
          options: candidateActions.slice(0, 4).map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description,
          })),
        },
      };
    }

    return {
      result: {
        type: 'navigate',
        source: decisionSource,
        reply: decision.reply,
        thought,
        action: {
          id: action.id,
          label: action.label,
          description: action.description,
          target: action.target,
        },
      },
    };
  }

  if (decision.type === 'ask') {
    const optionIds = Array.isArray(decision.optionIds) ? decision.optionIds : [];
    const options = optionIds
      .map((id) => actionMap.get(id))
      .filter(Boolean)
      .slice(0, 6)
      .map((action) => ({
        id: action.id,
        label: action.label,
        description: action.description,
      }));

    return {
      result: {
        type: 'ask',
        source: decisionSource,
        reply: decision.reply,
        thought,
        options: options.length > 0
          ? options
          : candidateActions.slice(0, 4).map((action) => ({
            id: action.id,
            label: action.label,
            description: action.description,
          })),
      },
    };
  }

  return {
    result: {
      type: 'answer',
      source: decisionSource,
      reply: decision.reply,
      thought,
    },
  };
}

const assistantGraph = new StateGraph(AgentGraphState)
  .addNode('prepareCandidates', prepareCandidatesNode)
  .addNode('decide', decideNode)
  .addNode('finalize', finalizeNode)
  .addEdge(START, 'prepareCandidates')
  .addEdge('prepareCandidates', 'decide')
  .addEdge('decide', 'finalize')
  .addEdge('finalize', END)
  .compile();

export async function runAssistantAgent(rawPayload) {
  const payload = AssistantPayloadSchema.parse(rawPayload);
  const result = await assistantGraph.invoke({
    payload,
    candidates: [],
    decision: null,
    decisionSource: null,
    result: null,
  });

  return result.result;
}
