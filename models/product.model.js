 import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  price: {
    type: String,
    required: true,
  },
  oldPrice: {
    type: String,
    required: true,
  },


  
  image: [{ type: String, required: true }],
  brand: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  discount: {
    type: Number,
    required: true,
  },
 // Optionally, you can remove this if you never need full populate in frontend
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      select: false, // Don't include by default
    },
  
});
