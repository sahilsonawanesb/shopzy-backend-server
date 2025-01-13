import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utilty-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/feature.js";
// import {faker} from "@faker-js/faker";



// making controller function for creating new Product..
export const newProduct = TryCatch(
    async (req:Request<{},{},NewProductRequestBody>, res, next) => {
        const {name, price, stock, category } = req.body;
        const photo = req.file;

        if(!photo) return next(new ErrorHandler("Please Add Photo", 400));

        if(!name || !price || !stock || !category){

            rm(photo.path, () => {
                console.log("Deleted");
            });
            return next(new ErrorHandler("Please Enter all Feilds", 400));

        }
            
        await Product.create({
            name,
            price,
            stock,
            category: category.toLowerCase(),
            photo: photo.path,
        });

        invalidateCache({ product : true, admin : true});

        return res.status(201).json({
            success : true,
            message : "Product Created Successfully"
        });

    }
);

// making controller function for getting latest product as follows..
// revalidate on New,Update,Delete Product... & New Order
export const getLatestProducts = TryCatch(

    async(req, res, next) => {

        let products;

        if(myCache.has("latest-products")) 
            products = JSON.parse(myCache.get("latest-products") as string);
        else{  
        products = await Product.find({}).sort({createdAt:-1}).limit(5);
        myCache.set("latest-products", JSON.stringify(products));
    }
        // throw new Error("djjdjd");
        return res.status(200).json({
            success:true,
            products,
        });
    });

// making controller function for getting the category wise product..
// revalidate on New,Update,Delete Product... & New Order
export const getAllCategories = TryCatch(
    async(req, res, next) => {

        let categories;
        if(myCache.has("categories"))
            categories = JSON.parse(myCache.get("categories") as string);
        else{
            categories = await Product.distinct("category");
            myCache.set("categories", JSON.stringify(categories));
        }
            

        return res.status(200).json({
            success : true,
            categories
        });
    }
);

// making the controller function for getAdmin products 
// revalidate on New,Update,Delete Product... & New Order

export const getAdminProducts = TryCatch(
    async(req, res, next) => {

        let products;

        if(myCache.has("all-products"))
            products = JSON.parse(myCache.get("all-products") as string);
        else{
            const products = await Product.find({});
            myCache.set("all-products", JSON.stringify(products));
        }
        

        return res.status(200).json({
            success : true,
            products
        });
    }
);

// making controller function to single products by id..

export const getSingleProducts = TryCatch (

    async(req, res, next) => {

        let product;
        const id = req.params.id;

        if(myCache.has(`product-${id}`))
            product = JSON.parse(myCache.get(`product-${id}`) as string);
        else{
            product = await Product.findById(id);
            if(!product) return next(new ErrorHandler("Product Not Found", 404));
            myCache.set(`product-${id}`, JSON.stringify(product));
        }

        return res.status(200).json({
            success : true,
            product,
        });
    }
);


// update product controller..
export const updateProduct = TryCatch(
    async (req, res, next) => {

        const {id} = req.params;
        const {name, price, stock, category } = req.body;
        const photo = req.file;
        const product = await Product.findById(id);

        if(!product) return next(new ErrorHandler("Product Not found", 404));

        
        if(photo){
            rm(product.photo!, () => {
                console.log("Old Photo Deleted");
            });
            product.photo = photo.path;
            // return next(new ErrorHandler("Please Enter all Feilds", 400));
        }
            
       if(name) product.name = name;
       if(price) product.price = price;
       if(stock) product.stock = stock;
       if(category) product.category = category;

       await product.save();

       invalidateCache({product : true, productId : String(product._id), admin:true});

        return res.status(200).json({
            success : true,
            message : "Product Updated Successfully",
        });

    }
);

// Controller function for deleting the user as follows..
export const deleteProduct = TryCatch(
    async(req, res, next) => {

        const product = await Product.findById(req.params.id);

        if(!product) return next(new ErrorHandler("Product Not Found", 404));


        // to delete the particular product photo.
        rm(product.photo!, () => {
            console.log("Product Photo Deleted");
        });

        // to delete the particular product we have to use the mongodb command as follows.
        await product.deleteOne();

        invalidateCache({product : true, productId: String(product._id), admin:true});

        return res.status(201).json({
            success : true,
            message : "Product Deleted Successfully",
        });
    }
);

// creating the controller function for getting all products/by searching..

export const getAllProducts = TryCatch(

    async(req:Request<{},{},{}, SearchRequestQuery>, res, next) => {

        // now access the query here..
        const {search, price, sort, category} = req.query;
        const page = Number(req.query.page) || 1;

        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
        const skip = (page - 1) * limit;
        

        // Base case Query object as follows..
        const baseQuery : BaseQuery = {};


        if(search) 
            baseQuery.name = {
            $regex : search,
            $options : "i"
        };

        // price
        if(price)
            baseQuery.price = {
                $lte : Number(price),
            };
        // category
        if(category) baseQuery.category = category;

        const productsPromis =  Product.find(baseQuery).sort(
            sort && {price: sort === "asc" ? 1 : -1})
            .limit(limit)
            .skip(skip);

        const[products, filteredOnlyProduct] = await Promise.all([
            productsPromis, 
           Product.find(baseQuery)
        ]);
        
        // total page..
        const totalPage = Math.ceil(filteredOnlyProduct.length / limit);


        return res.status(201).json({
            success : true,
            products,
            totalPage
        });
    }

);



// const generateRandomProducts = async(count : number = 10) => {
//     const products = [];

//     for(let i=0; i<count; i++){
//         const product = {
//             name : faker.commerce.productName(),
//             photo : "uploads\\7c13a964-2ab2-4c58-a85a-0badc5ac2bd1.png",
//             price : faker.commerce.price({ min : 1500, max : 80000, dec : 0}),
//             stock : faker.commerce.price({ min: 0, max:100, dec:0}),
//             category: faker.commerce.department(),
//             createdAt : new Date(faker.date.past()),
//             updatedAt : new Date(faker.date.recent()),
//             __v : 0,
//         };

//         products.push(product);
//     }

//     await Product.create(products);

//     console.log({ success: true});
// };


// const deleteRandomProducts = async(count : number = 10)  => {
//     const products = await Product.find({}).skip(2);

//     for(let i=0; i<products.length; i++){


//         const product = products[i];
//         await product.deleteOne();
//     }
//     console.log({success : true});
// };

// deleteRandomProducts(38);


