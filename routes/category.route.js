import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { createCategory, getCategoriesCount, getCategory, getSubCategoriesCount, uploadImages } from "../controllers/category.controller.js";


const categoryRouter = Router ()
categoryRouter.post('/uploadImages',auth,upload.array('images'), uploadImages)
categoryRouter.post('/create',auth,createCategory)
categoryRouter.get('/', getCategory)
categoryRouter.get('/get/count', getCategoriesCount)
categoryRouter.get('/get/subcategories/count', getSubCategoriesCount)
categoryRouter.get("/:id", getCategory);




export default categoryRouter;