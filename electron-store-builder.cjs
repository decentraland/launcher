const baseConfig = require('./electron-builder.cjs');

const config = {
  ...baseConfig,
  publish: [
    {
      provider: 's3',
      bucket: process.env.AWS_S3_BUCKET,
      endpoint: process.env.AWS_ENDPOINT_URL,
      region: process.env.AWS_DEFAULT_REGION,
      path: `/launcher/${process.env.PROVIDER}/`,
    },
  ],
};

module.exports = config;
