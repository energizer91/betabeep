import mongoose from "mongoose";

export const connectToMongoDB = async () => {
  const dbUrl = process.env.MONGODB_URL;

  if (!dbUrl) {
    throw new Error('No MONGODB_URL specified');
  }

  try {
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
};