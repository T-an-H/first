/**
 * DeepSeek API 调用服务
 *
 * 封装了对 DeepSeek API 的调用，用于：
 * 1. 智能出题 — 根据课程章节和老师要求生成题目（支持按层级出不同难度）
 * 2. 智能批改 — 批改学生提交的答案
 * 3. 分层测试出题 — 为 AI 分层测试生成单选题/判断题
 */

import './load-env.js';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_CHAT_PATH = '/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

function getDeepSeekApiUrl() {
  const configuredApiUrl = process.env.DEEPSEEK_API_URL?.trim();
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  const configuredBaseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL;
  return `${configuredBaseUrl.replace(/\/$/, '')}${DEEPSEEK_CHAT_PATH}`;
}

async function callDeepSeek(systemPrompt, userPrompt, options = {}) {
  const { temperature = 0.7, maxTokens = 4096 } = options;
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const apiUrl = getDeepSeekApiUrl();
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_MODEL;

  if (!apiKey) {
    throw new Error('未配置 DEEPSEEK_API_KEY，无法调用 DeepSeek。');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API 错误 (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/** 解析返回的 JSON 数组 */
function parseJsonArray(content) {
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`返回内容中未找到 JSON 数组\n原始内容: ${content}`);
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`JSON 解析失败: ${e.message}\n原始内容: ${content}`);
  }
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，,。.!！？?；;：:、"'‘’“”()（）【】\[\]-]/g, '');
}

function splitReferenceAnswers(value) {
  return String(value ?? '')
    .split(/[|/／]|(?:\s+或\s+)|(?:\s+and\s+)|；|;|，|,|\n/g)
    .map(item => item.trim())
    .filter(Boolean);
}

function clampScore(score, maxScore) {
  return Math.max(0, Math.min(Number(maxScore || 0), Number(score || 0)));
}

function getAnswerByQuestionId(answers, questionId) {
  return answers.find(answer => answer.questionId === questionId)?.answerText || '';
}

function gradeChoiceOrTrueFalse(question, studentAnswer) {
  const expected = splitReferenceAnswers(question.answer);
  const normalizedStudent = normalizeText(studentAnswer);
  const isCorrect = expected.some(item => normalizeText(item) === normalizedStudent);
  const score = isCorrect ? Number(question.score || 0) : 0;

  return {
    is_correct: isCorrect,
    score,
    feedback: isCorrect ? '答案正确。' : `答案不正确，标准答案是：${question.answer}`,
  };
}

function gradeFill(question, studentAnswer) {
  const expected = splitReferenceAnswers(question.answer);
  const normalizedStudent = normalizeText(studentAnswer);
  const maxScore = Number(question.score || 0);

  if (!normalizedStudent) {
    return { is_correct: false, score: 0, feedback: '未作答。' };
  }

  if (expected.some(item => normalizeText(item) === normalizedStudent)) {
    return { is_correct: true, score: maxScore, feedback: '答案正确。' };
  }

  if (expected.some(item => {
    const normalizedExpected = normalizeText(item);
    return normalizedExpected && (normalizedStudent.includes(normalizedExpected) || normalizedExpected.includes(normalizedStudent));
  })) {
    const score = clampScore(Math.round(maxScore * 0.7), maxScore);
    return {
      is_correct: false,
      score,
      feedback: `答案部分正确，参考答案是：${question.answer}`,
    };
  }

  return {
    is_correct: false,
    score: 0,
    feedback: `答案不正确，参考答案是：${question.answer}`,
  };
}

function extractReferencePoints(value) {
  const parts = String(value ?? '')
    .split(/[；;。！？?!\n]/)
    .flatMap(item => item.split(/[，,、]/))
    .map(item => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [String(value ?? '').trim()].filter(Boolean);
}

function gradeShortAnswer(question, studentAnswer) {
  const maxScore = Number(question.score || 0);
  const normalizedStudent = normalizeText(studentAnswer);
  const normalizedReference = normalizeText(question.answer);

  if (!normalizedStudent) {
    return { is_correct: false, score: 0, feedback: '未作答。' };
  }

  if (normalizedReference && normalizedStudent === normalizedReference) {
    return { is_correct: true, score: maxScore, feedback: '回答完整，关键点覆盖准确。' };
  }

  const referencePoints = extractReferencePoints(question.answer);
  const matchedPoints = referencePoints.filter(point => {
    const normalizedPoint = normalizeText(point);
    return normalizedPoint && normalizedStudent.includes(normalizedPoint);
  });

  if (referencePoints.length === 0) {
    return {
      is_correct: false,
      score: clampScore(Math.round(maxScore * 0.6), maxScore),
      feedback: '已按本地规则完成批改，请老师复核主观题得分。',
    };
  }

  const coverage = matchedPoints.length / referencePoints.length;
  const rawScore = coverage >= 1 ? maxScore : Math.max(0, Math.round(maxScore * Math.max(coverage, 0.3)));
  const score = clampScore(rawScore, maxScore);

  if (coverage >= 0.8) {
    return {
      is_correct: true,
      score,
      feedback: '回答较完整，已覆盖大部分关键点。',
    };
  }

  if (coverage >= 0.4) {
    return {
      is_correct: false,
      score,
      feedback: `回答部分覆盖关键点，仍可补充：${referencePoints.filter(point => !matchedPoints.includes(point)).join('、') || '更多细节'}`,
    };
  }

  return {
    is_correct: false,
    score: clampScore(Math.round(maxScore * 0.2), maxScore),
    feedback: `回答与参考要点差距较大，参考答案要点：${question.answer}`,
  };
}

function fallbackGradeSubmission({ questions, answers }) {
  return questions.map(question => {
    const studentAnswer = getAnswerByQuestionId(answers, question.id);

    switch (question.question_type) {
      case 'choice':
      case 'true_false':
        return gradeChoiceOrTrueFalse(question, studentAnswer);
      case 'fill':
        return gradeFill(question, studentAnswer);
      case 'short_answer':
        return gradeShortAnswer(question, studentAnswer);
      default:
        return {
          is_correct: false,
          score: 0,
          feedback: '暂不支持该题型的自动批改。',
        };
    }
  });
}

function normalizeGradingResults(results, questions) {
  return results.map((result, index) => {
    const maxScore = Number(questions[index]?.score || 0);
    const score = clampScore(result?.score, maxScore);
    return {
      is_correct: Boolean(result?.is_correct),
      score,
      feedback: String(result?.feedback || ''),
    };
  });
}

// 层级描述
const TIER_DESCS = {
  basic:    '基础层（难度：简单，考察基本概念和基础知识，适合初学者）',
  advanced: '进阶层（难度：中等，考察理解与应用，需要一定基础）',
  excellent:'卓越层（难度：较难，考察综合运用与深度理解，适合优秀学生）',
};

/**
 * AI 出题 — 根据课程信息和层级生成作业题目
 *
 * @param {object} params
 * @param {string} params.courseTitle
 * @param {string} params.chapterTitle
 * @param {string} params.requirement  - 老师的要求
 * @param {string} [params.tier]       - 'basic'|'advanced'|'excellent'|undefined(不分层)
 */
export async function generateQuestions({ courseTitle, chapterTitle, requirement, tier }) {
  const tierHint = tier ? `\n当前目标学生群体：${TIER_DESCS[tier]}，请严格按照该难度出题。` : '';

  const systemPrompt = `你是一位经验丰富的课程出题老师，专门为学生编写高质量的作业题目。
请严格按照以下要求出题：
1. 题目必须紧扣课程章节内容${tierHint}
2. 题型支持：选择题(choice)、判断题(true_false)、填空题(fill)、简答题(short_answer)
3. 必须返回合法的 JSON 数组，格式如下：
[
  {
    "question_type": "choice | true_false | fill | short_answer",
    "question_text": "题目标题",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "正确答案",
    "score": 10
  }
]
4. 选择题的 answer 写具体内容（如"选项B的内容"），不要写"A"或索引
5. 判断题的 answer 写 "对" 或 "错"
6. 填空题的 answer 写填空答案
7. 简答题的 answer 写参考答案要点
8. 分值根据题目难度分配（选择题/判断题 5-10分，填空题 10分，简答题 15-20分）
9. 只返回 JSON 数组，不要包含任何其他文字`;

  const userPrompt = `课程名称：${courseTitle}
章节名称：${chapterTitle}
老师的要求：${requirement}

请根据以上信息生成作业题目。`;

  const content = await callDeepSeek(systemPrompt, userPrompt, { temperature: 0.8, maxTokens: 8192 });
  return parseJsonArray(content);
}

/**
 * AI 生成分层测试题 — 为某门课生成10道单选/判断题
 *
 * @param {object} params
 * @param {string} params.courseTitle - 课程名称
 * @param {string} params.courseDesc  - 课程简介（可选）
 */
export async function generateTierTestQuestions({ courseTitle, courseDesc }) {
  const systemPrompt = `你是一位经验丰富的教育专家，负责为课程设计分层测试题。
分层测试用于判断学生的基础水平，题目要求：
1. 共10道题，类型只能是：单选题(single_choice) 或 判断题(true_false)
2. 建议单选题7道、判断题3道
3. 题目难度中等，能区分出"基础"、"中等"、"优秀"三个层次
4. 每道题10分，满分100分
5. 必须返回合法的 JSON 数组，格式如下：
[
  {
    "question_type": "single_choice",
    "question_text": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "正确答案的完整内容（不要写A/B/C/D，写内容）",
    "score": 10
  },
  {
    "question_type": "true_false",
    "question_text": "判断题内容",
    "options": ["正确", "错误"],
    "answer": "正确",
    "score": 10
  }
]
6. 只返回 JSON 数组，不要包含任何其他文字`;

  const userPrompt = `课程名称：${courseTitle}
${courseDesc ? '课程简介：' + courseDesc : ''}

请为这门课程生成10道分层测试题。`;

  const content = await callDeepSeek(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 6000 });
  const questions = parseJsonArray(content);
  if (questions.length !== 10) {
    throw new Error(`AI 生成了 ${questions.length} 道题，期望10道`);
  }
  return questions;
}

/**
 * AI 批改 — 批改学生提交的答案
 */
export async function gradeSubmission({ questions, answers }) {
  const qaPairs = questions.map((q, i) => {
    const studentAnswer = answers.find(a => a.questionId === q.id);
    return {
      题号: i + 1,
      题目: q.question_text,
      题型: q.question_type,
      正确答案: q.answer,
      学生答案: studentAnswer?.answerText || '(未作答)',
      分值: q.score,
    };
  });

  const systemPrompt = `你是一位认真负责的批改老师。
请逐题批改学生的答案，给出评分和反馈。
对选择题和判断题：直接判断对错。
对填空题：判断答案是否基本正确（意思对即可）。
对简答题：根据参考答案要点评分，给出合理的分数。

必须返回合法的 JSON 数组，格式如下：
[
  {
    "is_correct": true/false,
    "score": 8,
    "feedback": "批改评语"
  }
]
只返回 JSON 数组，不要包含任何其他文字。`;

  const userPrompt = `请批改以下作业答案：\n${JSON.stringify(qaPairs, null, 2)}`;
  try {
    const content = await callDeepSeek(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 4096 });
    const results = parseJsonArray(content);
    if (results.length !== questions.length) {
      throw new Error(`批改结果数量(${results.length})与题目数量(${questions.length})不匹配`);
    }
    return normalizeGradingResults(results, questions);
  } catch (error) {
    console.warn('DeepSeek 批改失败，改用本地规则批改:', error.message || error);
    return fallbackGradeSubmission({ questions, answers });
  }
}
