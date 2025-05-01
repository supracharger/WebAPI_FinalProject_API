const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if the connection fails (optional)
  }
};

connectDB();

// Review Schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, min: 0.01, required: true},
  imgurl: { type: String, required: true },
});

module.exports = mongoose.model('Item', itemSchema);