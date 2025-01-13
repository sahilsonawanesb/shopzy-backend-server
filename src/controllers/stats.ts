import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calaculatePercentage, getChartData, getInventories } from "../utils/feature.js";

// controller function for getting the dashboardstats
export const getDashBoardStats = TryCatch(async(req, res, next) => {

    let stats;

    const key = "admin-stats";
    if(myCache.has(key)){
        stats = JSON.parse(myCache.get(key) as string);
    }else{
        const today = new Date();
        
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // monthsObject
        const thisMonth = {
            start : new Date(today.getFullYear(), today.getMonth(), 1),
            end : today,
        }

        const lastMonth = {
            start : new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end : new Date(today.getFullYear(), today.getMonth(), 0)
        }

        // products
        const thisMonthProductsPromise = Product.find({
            createdAt:{
                $gte:thisMonth.start,
                $lte:thisMonth.end,
            },
        });

        const lastMonthProductsPromise = Product.find({
            createdAt:{
                $gte:lastMonth.start,
                $lte:lastMonth.end,
            },
        });

        // users
        const thisMonthUsersPromise = User.find({
            createdAt:{
                $gte:thisMonth.start,
                $lte:thisMonth.end,
            },
        });

        const lastMonthUsersPromise = User.find({
            createdAt:{
                $gte:lastMonth.start,
                $lte:lastMonth.end,
            },
        });

        // orders
        const thisMonthOrdersPromise = Order.find({
            createdAt:{
                $gte:thisMonth.start,
                $lte:thisMonth.end,
            },
        });

        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte : lastMonth.start,
                $lte : lastMonth.end,
            },
        });


        // finding the last six months orders..

        const lastSixMonthsOrdersPromise = Order.find({
            createdAt: {
                $gte:sixMonthsAgo,
                $lte:today,
            },
        });

        // latestTranscations 

        const latestTranscationsPromise = Order.find({})
        .select(["orderItems","discount","total","status"])
        .limit(4);

        const [
                thisMonthProducts,
                thisMonthUsers,
                thisMonthOrders,
                lastMonthProducts,
                lastMonthUsers,
                lastMonthOrders,
                productsCount,
                usersCount,
                allOrders,
                lastSixMonthsOrders,
                categories,
                femaleUsersCount,
                latestTranscation,
            ] = await Promise.all([
            thisMonthProductsPromise,
            thisMonthUsersPromise,
            thisMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            lastMonthOrdersPromise,


            // counting no of products, users and orders here..
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),

            // lastsix months orders
            lastSixMonthsOrdersPromise,
            
            // category
            Product.distinct("category"),

            // gender
            User.countDocuments({ gender:"female"}),

            // latestTranscation
            latestTranscationsPromise,
        ]);



            // calaculating last and current month revenue
            const thisMonthRevenue = thisMonthOrders.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const lastMonthRevenue = lastMonthOrders.reduce(
                (total, order) => total + (order.total || 0),
                0
            );

            const changePercentage = {

                revenue : calaculatePercentage(thisMonthRevenue, lastMonthRevenue),

                product : calaculatePercentage(
                    thisMonthProducts.length,
                    lastMonthProducts.length,
                ),

                order : calaculatePercentage(
                    thisMonthOrders.length,
                    lastMonthOrders.length,
                ),

                user : calaculatePercentage(
                    thisMonthUsers.length,
                    lastMonthUsers.length,
                ),


            }

            // calaculating the revenue on allOrders
            const revenue = allOrders.reduce(
                (total, orders) => total + (orders.total || 0),
                0
            );

            const count = {
                revenue,
                user : usersCount,
                product : productsCount,
                order : allOrders.length,
            };


            // creating Array..
            const orderMonthCounts = new Array(6).fill(0);
            const orderMonthlyRevenue = new Array(6).fill(0);

            lastSixMonthsOrders.forEach((order) => {
                const creationDate = order.createdAt;
                const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

                if(monthDiff < 6){
                    orderMonthCounts[6 - monthDiff - 1] += 1;
                    orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
                }   
            });

            // category count function..
            const categoryCount = await getInventories({
                    categories,
                    productsCount
            });

            // userRatio Count
            const userRatio = {
                male : usersCount - femaleUsersCount,
                female : femaleUsersCount
            }

            // modified latestTranscation
            const modifiedLatestTranscation = latestTranscation.map((i) => ({
                _id: i.id,
                discount: i.discount,
                amount: i.total,
                quantity: i.orderItems.length,
                status: i.status,
            }));
        
        stats = {
            categoryCount,
            changePercentage,
            count,
            chart : {
                order : orderMonthCounts,
                revenue : orderMonthlyRevenue,
            },
            userRatio,
            modifiedLatestTranscation
        };


        myCache.set(key, JSON.stringify(stats));
    }

    
    return res.status(200).json({
        success : true,
        stats
    });
});

// controller function for pie charts
export const getPieCharts = TryCatch(async(req, res, next) => {
    let charts;

    const key = 'admin-pie-charts';

    if(myCache.has(key))
        charts = JSON.parse(myCache.get(key) as string);
    else{

        const allOrderPromise = Order.find({}).select([
            "total",
            "discount",
            "subtotal",
            "tax",
            "shippingCharges",
        ])

        const [
            processingOrder, 
            shippedOrder, 
            deleiveredOrder, 
            categories,
            productsCount,
            outOfStock,
            allOrders,
            allUsers,
            adminUsers,
            customerUsers
        ] = await Promise.all([
            Order.countDocuments({status : "Processing"}),
            Order.countDocuments({status : "Shipped"}),
            Order.countDocuments({status : "Delivered"}),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({stock:0}),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role : "admin"}),
            User.countDocuments({ role : "user"}),
        ]);

        // order fullfillment
        const orderFullfillment = {
            processing : processingOrder,
            shipped : shippedOrder,
            delivered : deleiveredOrder,
        };

        // productCategories
        const productCategories = await getInventories({
            categories,
            productsCount
        });

        // stock availablity
        const stockAvailablity = {
            inStock: productsCount - outOfStock,
            outOfStock
        };

        // gross Income
        const grossIncome = allOrders.reduce(
            (prev, order) => prev + (order.total || 0), 
            0
        );

        const discount = allOrders.reduce(
            (prev, order) => prev + (order.discount || 0),
            0
        );

        const productionCost = allOrders.reduce(
            (prev, order) => prev + (order.shippingCharges || 0), 
            0
        );

        const burnt = allOrders.reduce(
            (prev, order) => prev + (order.tax || 0),
            0
        );

        const marketingCosts = Math.round(grossIncome * (30 / 100));

        const netMargin = grossIncome - discount - productionCost - burnt - marketingCosts;

        // revenue distribution
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCosts,
        };

        const usersAgeGroup = {
            teen:allUsers.filter((i) => i.age < 20).length,
            adult:allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
            old:allUsers.filter((i) => i.age >= 40).length
        };

        const adminCustomer = {
            admin:adminUsers,
            users:customerUsers,
        }

        charts = {
            orderFullfillment,  
            productCategories,
            stockAvailablity,
            revenueDistribution,
            adminCustomer,
            usersAgeGroup
        };

        myCache.set(key, JSON.stringify(charts));

    }

    return res.status(200).json({
        success : true,
        charts
    });
});

// controller function for bar chart
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;

    const key = "admin-bar-charts";

    if (myCache.has(key)) {
        charts = JSON.parse(myCache.get(key) as string);
    } else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        // Creating promises for fetching data
        const sixMonthProductsPromise = Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");

        const sixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");

        const twelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");

        const [products, users, orders] = await Promise.all([
            sixMonthProductsPromise,
            sixMonthUsersPromise,
            twelveMonthOrdersPromise,
        ]);

        const productsCounts = getChartData({
            length: 6,
            today,
            docArr: products,
        });

        const usersCount = getChartData({
            length: 6,
            today,
            docArr: users,
        });

        const ordersCount = getChartData({
            length: 12,
            today,
            docArr: orders,
        });

        charts = {
            users: usersCount,
            products: productsCounts,
            orders: ordersCount,
        };

        // Cache the actual charts object
        myCache.set(key, JSON.stringify(charts));
    }

    return res.status(200).json({
        success: true,
        charts,
    });
});

// controller function for line chart
export const getLineCharts = TryCatch(async(req, res, next) => {

    let charts;
    const key = "admin-line-bars";

    if(myCache.has(key))
        charts = JSON.parse(myCache.get(key) as string);
    else{

        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const baseQuery = {
            createdAt : {
                $gte : twelveMonthsAgo,
                $lte : today,
            },
        };

        // creating the promise function/object

        const [products, users, orders] = await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt","discount","total"]),
        ]);

        const productsCount = getChartData({length:12, today, docArr: products});
        const usersCount = getChartData({length : 12, today, docArr:users});
        const discount = getChartData({length : 12, today, docArr : orders, property : "discount"});
        const revenue = getChartData({length:12, today, docArr : orders, property:"total"});

        charts = {
            user : usersCount,
            product : productsCount,
            discount,
            revenue
        };

        
        myCache.set(key, JSON.stringify(charts));
    };


    return res.status(200).json({
        success : true,
        charts
    });
});

