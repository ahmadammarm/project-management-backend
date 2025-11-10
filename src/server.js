import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {clerkMiddleware} from '@clerk/express';
import {serve} from 'inngest/express';
import {inngest} from './inngest/client.js';
import {functions} from './inngest/functions.js';
import workspaceRouter from './routes/WorkspaceRoutes.js';
import { AuthMiddleware } from './middlewares/AuthMiddleware.js';
import projectRouter from './routes/ProjectRouter.js';
import taskRouter from './routes/TaskRoutes.js';
import commentRouter from './routes/CommentRoutes.js';

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());

app.use(cors());

app.use(clerkMiddleware());

app.get('/', (_, res) => {
  res.send('Project Management Backend is running');
});

app.use('/api/inngest', serve({client: inngest, functions}));

// workspace routes
app.use('/api/workspaces', AuthMiddleware, workspaceRouter);

//project routes
app.use('/api/projects', AuthMiddleware, projectRouter);

// task routes
app.use('/api/tasks', AuthMiddleware, taskRouter);

// comment routes
app.use('/api/comments', AuthMiddleware, commentRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
