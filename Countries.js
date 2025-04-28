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
const countrySchema = new mongoose.Schema({
  code: { type: String, required: true, index: { unique: true } },
  country: { type: String, required: true}
});

module.exports = mongoose.model('Country', countrySchema);