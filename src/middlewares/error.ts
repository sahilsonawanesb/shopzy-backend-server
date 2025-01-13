// creating thr custom error handler...
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/utilty-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (err:ErrorHandler, req:Request, res:Response, next:NextFunction) => {

    err.message ||= "Internal Sever Error";
    err.statusCode ||= 500;

    if(err.name === "CastError") err.message = "Invalid Id";
    
    
    res.status(err.statusCode).json({
        success:false,
        message: err.message,
    });
}

export const TryCatch = 
    (func:ControllerType) => {
    return (req:Request, res:Response, next:NextFunction) => {
        Promise.resolve(func(req, res, next)).catch(next);
};   
};

