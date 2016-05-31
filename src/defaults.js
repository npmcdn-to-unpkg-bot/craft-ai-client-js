const DEFAULTS = {
  token: process.env.CRAFT_TOKEN,
  url: process.env.CRAFT_URL || 'https://beta.craft.ai',
  operationsChunksSize: 500,
  operationsAdditionWait: 60
};

export default DEFAULTS;
