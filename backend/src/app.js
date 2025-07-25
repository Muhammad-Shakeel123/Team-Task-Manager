import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN,
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));

import userRouter from './routes/user.routes.js';
import teamRouter from './routes/team.routes.js';
import taskRouter from './routes/task.routes.js';

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const sessionStore =
  process.env.NODE_ENV === 'production'
    ? new (pgSession(session))({
        pool: pgPool,
        tableName: 'session',
      })
    : new session.MemoryStore();

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use('/api/users', userRouter);
app.use('/api/team', teamRouter);
app.use('/api/tasks', taskRouter);

export { app };
