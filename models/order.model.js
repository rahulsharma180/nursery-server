import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
    orderId: {
      type: String,
      unique: true,
      require: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          require: true,
        },
        name: {
          type: string,
          require: true,
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
          require: true,
        },
        size: {
          type: String,
        },
        isReturn: {
          type: Boolean,
          default: false,
        },
        itemReturned: {
          type: Boolean,
          required: false,
        },
        barcode: {
          type: String,
        },
        image: {
          type: String,
        },
        subTotal: {
          type: Number,
        },
        selectedColor: {
          type: String,
        },
      },
    ],
    paymentId: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      default: "",
    },
    order_status: {
      type: String,
      default: "Pending",
    },
    statusHistory: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    delivery_address: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
    },
    couponCode: {
      type: String,
    },
    couponDiscount: {
      type: Number,
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
    barcode: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    pickupPoint: {
      type: String,
      default: null,
    },
    deliveryBoyId: {
      type: mongoose.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    deliveryStatus: {
      type: String,
      default: null,
    },
    orderType: {
      type: String,
      enum: ["Normal", "Return"],
      default: "Normal",
    },
    deliveredBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryBoy", // or "User" if you prefer
      },
      name: { type: String },
    },
    deliverySignature: { type: String },
    walletAmountUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "ONLINE", "WALLET", "MIXED"],
      default: "CASH",
    },
  },
  {
    timestamps: true,
  },
);

const OrderModel = mongoose.model("order", orderSchema);
export default OrderModel;
