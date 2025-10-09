import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logAnomaly } from './elasticsearchService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/log', async (req, res) => {
  try {
    const { alert } = req.body;
    if (!alert) {
      return res.status(400).send('Alert data is required');
    }
    await logAnomaly(alert);
    res.status(200).send('Log successful');
  } catch (error) {
    console.error('Failed to log anomaly:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});