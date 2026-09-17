import express from 'express';
import monetizationRouter from '../server/routes/monetization.js';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/monetization', monetizationRouter);
app.use('/', monetizationRouter);

export default function handler(req: any, res: any) {
  return app(req, res);
}
