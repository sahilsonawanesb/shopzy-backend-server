// making routes over here as follows..
import express from "express";
import { deleteUser, getAllUser, getUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();
// app.use(express.json());

// route - api/v1/user/new
app.post("/new", newUser);

// route - api/v1/user/all
app.get('/all', adminOnly(), getAllUser);

// // route - api/v1/user/getuser/:id
app.get('/:id', getUser);

// // ru=ote - api/vi/user/deleteUser/:id;
app.delete('/:id', adminOnly(), deleteUser);

// combining the above routes using the app.route method as follows..
// app.route(":/id").get(getUser).delete(deleteUser);
export default app;