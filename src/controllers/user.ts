import { Request,Response,NextFunction } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utilty-class.js";

export const newUser = TryCatch(

    async(
        req:Request<{}, {}, NewUserRequestBody>, 
        res:Response, 
        next:NextFunction
    ): Promise<void> => {
    
         const {name, email, photo, gender,_id,dob} = req.body;

         let user = await User.findById(_id);   
         // let user = await User.findOne({ email });
 
         if (user) {
             return res.status(200).json({
               success: true,
               message: `Welcome, ${user.name}`,
             }) as unknown as void; // Cast to void;
           }

         if(!_id || !name || !email || !photo || !gender || !dob) {
            return next(new ErrorHandler("Please add all feilds", 400));
            }
        
            user = await User.create({
            name,
            email,
            photo,
            gender,
            _id,
            dob : new Date(dob),
           });
    
               return res.status(201).json({
                success : true,
                message : `Welcome, ${user.name}`,
            }) as unknown as void; // Cast to void;
        }
);

// api for getting all users..
export const getAllUser = TryCatch(async(req, res, next) => {

    const users = await User.find({});

    return res.status(200).json({
        success:true,
        users,
    });

});

// api for getting particular user by id
export const getUser = TryCatch(async(req, res, next) => {

    const id = req.params.id; 
    const user = await User.findById(id);
    console.log(user);

    if(!user) return next(new ErrorHandler("Invalid Id", 400));

    return res.status(200).json({
        success : true,
        user
    });
});

// api for deleting the particular user..
export const deleteUser = TryCatch(async(req, res, next) => {
    const id = req.params.id;
    const user = await User.findById(id);

    if(!user) return next(new ErrorHandler("User not found", 400));

    await user.deleteOne();     //deleteOne() : mongoDb command to delete the message...

    return res.status(200).json({
        success : true,
        message : "User Deleted Successfully",
    });
});