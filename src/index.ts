import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { AppDataSource } from './data-source';
import authRouter from './routes/auth';
import catRouter from './routes/categories';
import typeRouter from './routes/types';
import productRouter from './routes/products';
import paymentRouter from './routes/payments';
import walletRouter from './routes/wallet';
import orderRouter from './routes/orders';
dotenv.config();

const app = express();

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    app.use('/auth', authRouter);
    app.use('/api', catRouter);
    app.use('/api', typeRouter);
    app.use('/api', productRouter);
    app.use('/api', paymentRouter);
    app.use('/api', walletRouter);
    app.use('/api', orderRouter);
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log('Error during Data Source initialization:', error));
