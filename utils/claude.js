const Anthropic = require('@anthropic-ai/sdk');
const AppError = require('./appError');

const DEFAULT_MODEL = 'claude-opus-5';

let client = null;

// constructed lazily (only when a chat request actually comes in) so the
// server can boot even before ANTHROPIC_API_KEY has been set
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AppError(
      'the AI assistant is not configured yet - set ANTHROPIC_API_KEY in config.env',
      503
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

// system + a short conversation history in, plain-text reply out.
// `system` and `messages` follow the Messages API shapes directly.
exports.askClaude = async ({ system, messages }) => {
  const anthropic = getClient();

  let response;
  try {
    response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 1024,
      system,
      messages,
      output_config: { effort: 'low' }
    });
  } catch (err) {
    throw new AppError(
      `the AI assistant is unavailable right now: ${err.message}`,
      502
    );
  }

  if (response.stop_reason === 'refusal') {
    throw new AppError(
      "the AI assistant couldn't answer that request, please try rephrasing",
      422
    );
  }

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock ? textBlock.text : '';
};
