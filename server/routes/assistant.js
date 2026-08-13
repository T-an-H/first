import { Router } from 'express';
import { getAssistantHealth, runAssistantAgent } from '../assistant-agent.js';

const router = Router();

router.get('/health', (req, res) => {
  const health = getAssistantHealth();

  res.json({
    success: true,
    status: health.apiKeyConfigured ? 'configured' : 'misconfigured',
    ...health,
  });
});

router.post('/navigate', async (req, res) => {
  try {
    const result = await runAssistantAgent(req.body);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Assistant agent error:', error);
    const health = getAssistantHealth();
    res.status(Number(error?.status) || 500).json({
      success: false,
      code: error?.code || 'assistant_error',
      diagnostics: health.lastDecision?.error || health.boot?.error || null,
      message: error?.message || '智能体暂时不可用',
    });
  }
});

export default router;
