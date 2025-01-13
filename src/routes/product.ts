import  express  from "express";
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getSingleProducts, newProduct, updateProduct } from "../controllers/product.js";
import  {singleUpload}  from "../middlewares/multer.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// To Create New Product Route - api/v1/product/new
app.post("/new", adminOnly(), singleUpload, newProduct);

// To Get all Products/Search with filters Route -api/v1/product/all
app.get("/all", getAllProducts);

// To get last 10 products - api/v1/product/latest
app.get("/latest",getLatestProducts);

// To get all unique categories - api/v1/product/categories
app.get("/categories", getAllCategories);

// To get all admin products - api/v1/product/new
app.get("/admin-products", adminOnly(),getAdminProducts);

// To get all admin products - api/v1/product/singleProduct
app.route("/:id").get(getSingleProducts)
    .put(adminOnly(),singleUpload, updateProduct)
    .delete(adminOnly(),deleteProduct);

export default app;