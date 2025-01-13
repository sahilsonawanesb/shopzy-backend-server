// import { stripe } from "../app.js";
import stripe from "stripe";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utilty-class.js";



export const createPaymentIntent = TryCatch(async(req, res, next) => {
    
    const {amount} = req.body;

    if(!amount) return next(new ErrorHandler("Please Enter Amount", 400));

    const paymentIntent = await stripe.paymentIntents.create({
        amount : Number(amount) * 100,
        currency : "inr",
    });

    return res.status(201).json({
        success:true,
        clientSecret:paymentIntent.client_secret,
    });
});


// controller function for creating newCoupon
export const newCoupon = TryCatch(async(req, res, next) => {

    const {coupon, amount} = req.body;

    if(!coupon || !amount)
        return next(new ErrorHandler("Please Enter both Coupon and Amount", 400));

    await Coupon.create({ code : coupon, amount});

    return res.status(201).json({
        success : true,
        message : `Coupon ${coupon} Created Successfully`
    });
});

// constroller function for applying the coupon..

export const applyCoupon = TryCatch(async(req, res, next) => {

    const {coupon} = req.query;

    const discount = await Coupon.findOne({code:coupon});

    if(!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));

    return res.status(200).json({
        success : true,
        discount : discount.amount,
    });
});

// controller function for all coupons 
export const allCoupons = TryCatch(async(req, res, next) => {

    const coupons = await Coupon.find({});

    return res.status(201).json({
        success : true,
        coupons,
    });
});

// controller function for deleteing the coupons..
export const deleteCoupons = TryCatch(async(req, res, next) => {

    const {id} = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if(!coupon) return next(new ErrorHandler("Invalid Coupon Id", 400));

    return res.status(200).json({
        success : true,
        message : `Coupon ${coupon.code} Deleted Successfully`,
    });
});