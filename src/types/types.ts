import { Request, Response, 
    NextFunction } from "express";
import { invalidateCache } from "../utils/feature.js";

export interface Cashfrees {
    XClientId: string;
    XClientSecret: string;
    CFEnvironment: {
        SANDBOX: string;
        PRODUCTION: string;
    };
}

export interface NewUserRequestBody{
    name : string,
    email : string,
    photo : string,
    gender : string,
    _id : string,
    dob : Date;
}


// product..
export interface NewProductRequestBody{
    name:string,
    price:number,
    stock:number,
    category: string,
}

// making the controller types..
export type ControllerType = (
    req : Request,
    res: Response,
    next: NextFunction,
) => Promise<void | Response<any, Record<string, any>>>;

// making the controller type for search query as follows..
export type SearchRequestQuery = {
    search?: string,
    price?: string,
    category?: string,
    sort?:string,
    page?:string
}

// base query interface types.
export interface BaseQuery {
    name?:{
        $regex : string;
        $options : string;
    };

    price? : {
        $lte : number;
    };

    category?: string;
}

export type InvalidateCacheProps = {
    product?:boolean;
    order?:boolean;
    admin?:boolean;
    userId?:String;
    orderId?:String;
    productId?:String | String[];
};

export type OrderItemType = {
    name : String;
    photo : String;
    price : Number;
    quantity : number;
    productId : String;
};

export type ShippingInfoType = {
    address : String;
    city : String;
    state : String;
    country : String;
    pinCode : Number;
}

export interface NewOrderRequestBody{
    shippingDetails : {};
    user : String;
    subtotal : Number;
    tax : Number;
    shippingCharges : Number;
    discount : Number;
    total : Number;
    orderItems : OrderItemType[];
};

export type CreateOrderRequest = {
    orderId : string;
    order_amount: number;
    order_currency: string;
    customer_details: {
        customer_id : string,
      customer_name: string;
      customer_phone: string;
      customer_email: string;
    };

}