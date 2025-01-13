import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Request } from "express";
import { invalidateCache, reduceStock } from "../utils/feature.js";
import ErrorHandler from "../utils/utilty-class.js";
import { myCache } from "../app.js";



// controller function of myOrder..
export const myOrders = TryCatch(async(req, res, next) => {

    const {id : user} = req.query;

    let orders = [];

    const key = `my-orders-${user}`;

    if (myCache.has(key)) 
        orders = JSON.parse(myCache.get(key) as string);
    else{
        orders = await Order.find({user});
        myCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
        success : true,
        orders,
    });
});


// controller function for fetching all orders..
export const allOrders = TryCatch(async(req, res, next) => {

    const key = `all-orders`;

    let orders = [];

    if(myCache.has(key)) 
        orders = JSON.parse(myCache.get(key) as string); 
    else{
        orders = await Order.find().populate("user", "name");
        myCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
        success : true,
        orders
    });
});


    // controller function for getSingleOrder as follows..

    export const getSingleOrder = TryCatch(async(req, res, next) => {

        const {id} = req.params;
        const key = `order-${id}`;

        let getOrder;

        if(myCache.has(key))
            getOrder = JSON.parse(myCache.get(key) as string);
            else{
                getOrder = await Order.findById(id).populate("user", "name");

                if(!getOrder) return next(new ErrorHandler("Order Not Found", 404));

                // // now I am ensuring user is not null
                // if (!getOrder.user) {
                //     getOrder.user = { name: "Unknown User", _id: "null" };
                //   }

                myCache.set(key, JSON.stringify(getOrder));
            }
        
        return res.status(200).json({
            success : true,
            getOrder
        });
    });


// controller function for newOrder put function

export const newOrder = TryCatch(async(req:Request<{},{},NewOrderRequestBody>, res, next) =>{

    const {
        shippingDetails,
        orderItems,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total,  
    } = req.body;

    if( !shippingDetails ||
        !orderItems ||
        !user ||
        !subtotal ||
        !tax ||
        !total 
    )

    return next(new ErrorHandler("Please Enter All Feilds", 400));

    const order = await Order.create({
        shippingDetails,
        orderItems,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total,
    });

    await reduceStock(orderItems);
    invalidateCache({ 
        product : true, 
        order: true, 
        admin: true, 
        userId: user,
        productId: order.orderItems.map(i => String(i.productId)),
    });

    return res.status(201).json({
        success: true,
        message : "Order Placed Successfully",
    })
});


// controller function for processingOrder
export const processOrder = TryCatch(
    async(req, res, next) =>{

        const {id} = req.params;

        const orders = await Order.findById(id);

        if(!orders) return next(new ErrorHandler("Order Not Found", 404));

        switch(orders.status){
            case "Processing":
                orders.status = "Shipped";
                break;
            case "Shipped":
                orders.status = "Delivered";
                break;
            default:
                orders.status = "Delivered";
                break;
        }

        orders.save();
  
    invalidateCache({ 
        product : false, 
        order: true, 
        admin: true, 
        userId: orders.user,
        orderId : String(orders._id)
    });

    return res.status(200).json({
        success: true,
        message : "Order Processed Successfully",
    })
});

// controller function for deleting Order..

export const deleteOrder = TryCatch(async(req, res, next) => {

    const {id} = req.params;

    const orders = await Order.findById(id);

    if(!orders) return next(new ErrorHandler("Order Not Found", 404));

    await orders.deleteOne();

    invalidateCache({
        product : false, 
        order : true, 
        admin :true, 
        userId: orders.user, 
        orderId: String(orders._id)
    });

    return res.status(200).json({
        success : true,
        message : "Order Deleted Successfully",
    });

});