const { validateEnv, config } = require('./config/env');
validateEnv();

const app = require('./app');
const logger = require('./utils/logger');

const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 시작되었습니다 (${config.server.env})`);
});
