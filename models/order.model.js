import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
  },
  orderId:{
    type:String,
    unique:true,
    require:true
  }
  
});

const OrderModel = mongoose.model("order", orderSchema);
export default OrderModel;
