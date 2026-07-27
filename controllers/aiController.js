const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { embedText, cosineSimilarity } = require('./../utils/embeddings');
const { askClaude } = require('./../utils/claude');

const TOUR_FIELDS =
  'name summary description difficulty price ratingsAverage duration imageCover maxGroupSize';

// ranks every tour by cosine similarity against the query embedding.
// the dataset is small (tens of tours), so brute-force in-memory ranking
// is simpler and more reliable than standing up a vector index for it.
const rankTours = async (query, limit) => {
  const queryEmbedding = await embedText(query);

  const tours = await Tour.find()
    .select(`${TOUR_FIELDS} +embedding`)
    .lean();

  return tours
    .filter(tour => Array.isArray(tour.embedding) && tour.embedding.length)
    .map(tour => ({
      ...tour,
      embedding: undefined,
      score: cosineSimilarity(queryEmbedding, tour.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

exports.search = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return next(new AppError('please provide a search query in ?q=', 400));
  }

  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const results = await rankTours(q, limit);

  res.status(200).json({
    status: 'success',
    results: results.length,
    data: { tours: results }
  });
});

const buildContext = tours =>
  tours
    .map(
      tour =>
        `- "${tour.name}" (${tour.difficulty}, ${tour.duration} days, $${tour.price}, rated ${tour.ratingsAverage}/5): ${tour.summary}`
    )
    .join('\n');

const SYSTEM_PROMPT = `You are the AI travel assistant for Natours, a tour booking company.
Answer the user's question using ONLY the tours listed under CONTEXT below - never invent tours, prices, or details that aren't there.
If none of the listed tours fit what the user is asking for, say so plainly and suggest they broaden their search instead of making something up.
Keep answers short (2-4 sentences), friendly, and mention specific tour names when recommending one.`;

exports.chat = catchAsync(async (req, res, next) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return next(new AppError('please provide a message', 400));
  }

  const history = Array.isArray(req.body.history) ? req.body.history : [];
  const sanitizedHistory = history
    .filter(
      turn =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string'
    )
    .slice(-10)
    .map(turn => ({ role: turn.role, content: turn.content }));

  const matches = await rankTours(message, 4);
  const context = matches.length
    ? buildContext(matches)
    : '(no matching tours found in the catalog)';

  const reply = await askClaude({
    system: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}`,
    messages: [...sanitizedHistory, { role: 'user', content: message }]
  });

  res.status(200).json({
    status: 'success',
    data: {
      reply,
      sources: matches.map(tour => ({ id: tour._id, name: tour.name }))
    }
  });
});
