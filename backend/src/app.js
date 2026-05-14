const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger/swagger.json');

const authRouter = require('./modules/auth/auth.router');
const categoriesRouter = require('./modules/categories/categories.router');
const todosRouter = require('./modules/todos/todos.router');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/todos', todosRouter);

app.use(errorHandler);

module.exports = app;
