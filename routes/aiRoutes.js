const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('./../controllers/aiController');

const router = express.Router();

// chat calls cost real money (LLM tokens) - keep this well below the
// global API rate limit
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'too many AI requests, please try again in a few minutes'
});
router.use(aiLimiter);

router.get('/search', aiController.search);
router.post('/chat', aiController.chat);

module.exports = router;
