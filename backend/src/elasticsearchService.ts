import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE;
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME;
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD;

if (!ELASTICSEARCH_NODE) {
  throw new Error('ELASTICSEARCH_NODE environment variable is not set');
}

const client = new Client({
  node: ELASTICSEARCH_NODE,
  auth: {
    username: ELASTICSEARCH_USERNAME || 'elastic',
    password: ELASTICSEARCH_PASSWORD || 'changeme'
  },
  tls: {
      rejectUnauthorized: false
  }
});

export async function logAnomaly(alert: any) {
  try {
    await client.index({
      index: 'anomaly-alerts',
      document: {
        ...alert,
        timestamp: new Date(),
      },
    });
    console.log('Anomaly logged to Elasticsearch');
  } catch (error) {
    console.error('Error logging anomaly to Elasticsearch:', error);
    throw error; // Re-throw to be caught by the route handler
  }
}