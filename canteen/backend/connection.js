import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://canteen608:canteen608@cluster0.emtytzf.mongodb.net/?appName=Cluster0');
    console.log("MongoDB Connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectDB;

// const mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://canteen608:canteen608@cluster0.28pmwtc.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0')
//   .then(() => console.log('Connected!'))
//   .catch((err)=>console.error("MongoDB connection error:",err))
  