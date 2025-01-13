import mongoose from "mongoose";
import validator from 'validator';


interface IUser extends Document {
    _id : string;
    name : string;
    email : string;
    photo : string;
    role : "admin" | "user";
    gender : "male" | "female";
    dob : Date;
    createdAt:Date;
    updatedAt:Date;

    // virtual Attribute..
    age:number;
}

const schema = new mongoose.Schema(
    
    {
        _id:{
            type : String,
            required : [true,"Please enter id"],
        },

        photo:{
            type : String,
            required : [true, "Please add photo"],
        },
        name:{
            type : String,
            required : [true,"Please enter name"],
        },
        email:{
            type:String,
            unique : [true, "Email Already Exist"],
            required : [true, "Please enter Email"],
            validate: validator.default.isEmail,
        },
        role:{
            type:String,
            enum:["admin","user"],
            default:"user",
        },
        gender:{
            type:String,
            enum:["male","female"],
            required:[true, "Please Enter Gender"],
        },

        dob : {
            type:Date,
            required:[true, "Please Enter DOB"],
        }
    },
    {
        timestamps:true,
    }

);

// creating the virtual element..
schema.virtual("age").get(function() {
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();

    if(today.getMonth() < dob.getMonth() || today.getMonth() === dob.getMonth()
        && today.getDate() < dob.getDate())
    age--;

    return age;
})

export const User = mongoose.model<IUser>("User",schema);