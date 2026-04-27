import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { createCategory, getCategoriesCount, getCategories, getSubCategoriesCount, uploadImages, getCategory, removeImageFromCloudinary, updateCategory, deleteCategory } from "../controllers/category.controller.js";


const categoryRouter = Router ()
categoryRouter.post('/uploadImages',auth,upload.array('images'), uploadImages)
categoryRouter.post('/create',auth,createCategory)
categoryRouter.get('/', getCategories)
categoryRouter.get('/get/count',auth, getCategoriesCount)
categoryRouter.get('/get/subcategories/count', getSubCategoriesCount)
categoryRouter.delete("/deteleImage", auth, removeImageFromCloudinary);
categoryRouter.put("/updateCategory/:id", auth, updateCategory);
categoryRouter.delete("/deletecategory/:id",auth,deleteCategory);
categoryRouter.get("/:id",getCategory);





export default categoryRouter;