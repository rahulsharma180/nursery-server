import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { uploadImages } from "../controllers/category.controller.js";


const categoryRouter = Router ()
categoryRouter.post('/uploadImages',auth,upload.array('images'), uploadImages)


export default categoryRouter;