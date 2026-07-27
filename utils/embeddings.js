// Local text embeddings for semantic search / RAG retrieval.
//
// Runs entirely on-device via @xenova/transformers (no API key, no network
// calls after the model is cached) - keeps the AI setup down to a single
// credential (ANTHROPIC_API_KEY) for the actual chat completions.
//
// @xenova/transformers ships ESM-only, so it's loaded via a dynamic
// import() from this CommonJS module. The pipeline is created once and
// reused (loading it is the slow part - a few seconds on first call, then
// the model is cached on disk for subsequent process starts).

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'; // 384-dim sentence embeddings

let extractorPromise = null;

const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', MODEL_NAME)
    );
  }
  return extractorPromise;
};

exports.embedText = async text => {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

exports.cosineSimilarity = (a, b) => {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  // vectors from embedText() are already L2-normalized, so the dot product
  // alone is the cosine similarity - no need to divide by the magnitudes
  return dot;
};
