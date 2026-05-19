import { ServerDescription } from "mongodb"
import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
{
    name:{
        type: String,
        require:true
    }, 
    description:{
        type:String,
        require:true
    },
    price:{
        type:String,
        required:true,
    },
    image:[{type:String,required:true}], brand:{type:String,default:""},rating:{type:Number,default:0}, discount: {
      type: Number,
      required: true,
    },




}

)