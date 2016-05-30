const DEFAULTS = {
  token: process.env.CRAFT_TOKEN,
  url: process.env.CRAFT_URL || 'https://beta.craft.ai',
  operationsChunksSize: 500
};

export default DEFAULTS;
