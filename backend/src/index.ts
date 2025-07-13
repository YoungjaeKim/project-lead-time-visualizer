import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { ExternalSourceService } from './services/ExternalSourceService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint to return current UTC time
app.get('/', (req, res) => {
  res.json({
    message: 'Project Lead Time Visualizer API',
    currentTime: new Date().toISOString(),
    timestamp: Date.now()
  });
});

app.use('/api', routes);

app.use(errorHandler);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-lead-time-visualizer';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  
  ExternalSourceService.startCronJobs();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('External source sync cron jobs started');
  });
};

startServer().catch(console.error);

export default app;