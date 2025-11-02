import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {clerkMiddleware} from '@clerk/express';
import {serve} from 'inngest/express';
import {inngest} from './inngest/client';
import {functions} from './inngest/functions';

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
