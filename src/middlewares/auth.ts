// creating middleware for make sure admin in allowed only..

import { Request, Response, NextFunction } from "express";
import { TryCatch } from "./error.js";
import ErrorHandler from "../utils/utilty-class.js";
import { User } from "../models/user.js";

export const adminOnly = () => TryCatch(async(req:Request, res:Response, next:NextFunction) => {

        const {id} = req.query;
        if(!id) return next(new ErrorHandler("Please Login First", 401));

        const user = await User.findById(id);
        if(!user) return next(new ErrorHandler("You have Entered wrong ID", 401));

        if(user.role !== "admin") return next(new ErrorHandler("Sorry,You do not have acsess", 403));

        next();
    });