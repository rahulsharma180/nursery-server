import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
  },
  orderId: {
    type: String,
    unique: true,
    require: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      require: true
    },
    name: {
      type: string,
      require: true
    },
    quantity: {
      type: Number,
    },
    price: {
      type: Number,
      require: true
    },
    size: {
       type: String
      },
      










  }
  ]

});

const OrderModel = mongoose.model("order", orderSchema);
export default OrderModel;
