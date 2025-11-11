import express from "express";
import cors from "cors";
import dotenv from 'dotenv'
dotenv.config()
// console.log("MONGODB_URI:", process.env.MONGODB_URI);

import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import connectDB from "./config/connectDB.js";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.route.js";

// const PORT = process.env.PORT

const app = express()

app.use(cors());
// app.options('*', cors())

app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev")); // 👈 format diya
app.use(helmet({
crossOriginResourcePolicy: false
}))


app.get("/",(request,response)=>{
    response.json({
        message: "Server is running " + process.env.PORT
    })
})


app.use('/api/user',userRouter)
app.use('/api/category',categoryRouter)



connectDB().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("Server is running " + process.env.PORT)
    })
})