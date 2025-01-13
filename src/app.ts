import express, {Request, Response, NextFunction } from "express";
import { connectDb } from "./utils/feature.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import cors from "cors";


// importing routes..
import userRoute from './routes/user.js';
import productRoute from './routes/product.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashBoardRoute from './routes/stats.js';
import { config } from "dotenv";
import morgan from 'morgan';
import Stripe from "stripe";


config({
    path:"./.env", 
});

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "";
// const stripeKey = process.env.STRIPE_KEY || "";

// calling database connection over here as follows..
connectDb(mongoURI);

// export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

const app = express();

app.get("/",(req, res) => {
    res.send("API Working with /API/USER");
})

// including json payload..
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// using Routes..
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashBoardRoute);

// static api for upload folder  generally by which we access the images present in the folder as follows
app.use("/uploads", express.static("uploads"));

// creating the middle ware for Error handling..
app.use(errorMiddleware);


// creating the port on which the app is running
app.listen(port, () => {
    console.log(`Server is working on http://localhost:${port}`)
})