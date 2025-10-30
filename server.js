import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {clerkMiddleware} from '@clerk/express';

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());

app.use(cors());

app.use(clerkMiddleware());

app.get('/', (_, res) => {
  res.send('Project Management Backend is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
