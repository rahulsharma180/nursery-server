import CategoryModel from "../models/category.model";
import  { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


// Configuration
cloudinary.config({ 
    cloud_name: process.env.cloudinary_Config_Cloud_Name, 
    api_key: process.env.cloudinary_Config_api_key, 
    api_secret: process.env.cloudinary_Config_api_secret, 
    secure : true,
});

//Image upload
var imagesArr = [];


export async function uploadImages(request , response) {
    try {
        
    } catch (error) {
        response.status(400).json(

            {
                message : error.status || error,
                error : "true",
                success : false
            }
        )

    }

}