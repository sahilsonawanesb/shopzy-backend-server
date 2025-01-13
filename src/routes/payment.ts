import express from "express";
import { allCoupons, applyCoupon, createPaymentIntent, deleteCoupons, newCoupon } from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";
import { Cashfree } from "cashfree-pg/dist/api.js";
import * as crypto from 'crypto';

const app = express.Router();




// route - api/v1/payment/create
app.post("/create", createPaymentIntent);
// route - api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly(), newCoupon);
// route - api/v1/payment/discount
app.get("/discount", applyCoupon);
// route - api/v1/payment/coupon/all
app.get("/coupon/all", adminOnly(), allCoupons);
// route -api/v1/payment/coupon/:id
app.delete("/coupon/:id", adminOnly(), deleteCoupons);



export default app;