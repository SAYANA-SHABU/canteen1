import mongoose from "mongoose";

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, default: 0 }, // STOCK
  category: { 
    type: String, 
    required: true,
    default: "maincourse"
  }
}, { timestamps: true });

export default mongoose.model("Menu", MenuSchema);