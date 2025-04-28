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
const orderSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'UserId' },
  deny: Boolean,
  address: String,
  city: String,
  state: String,
  zip: { type: Number, min: 10000, max: 100000 },
  items: [{
    itemname: String,
    price: Number,
  }],
  total: Number,
  date: String,
  msg: String,  
});

module.exports = mongoose.model('Order', orderSchema);