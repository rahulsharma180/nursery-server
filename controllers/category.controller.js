import CategoryModel from "../models/category.model.js";
import { v2 as cloudinary } from 'cloudinary';
import { error } from "console";
import fs from 'fs';
import mongoose from "mongoose";


// Configuration
cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

//Image upload
var imagesArr = [];


export async function uploadImages(request, response) {
    try {

        const images = request.files;

        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false
        };

        // upload new images
        for (let i = 0; i < (images?.length || 0); i++) {

            const uploadResult = await cloudinary.uploader.upload(images[i].path, options);
            console.log(uploadResult + "dgfdg")
            imagesArr.push(uploadResult.secure_url)


            // Delete file from local uploads folder
            fs.unlinkSync(`uploads/${images[i].filename}`);
        }

        return response.status(200).json({
            images: imagesArr
        });



    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });

    }

}


// create Category

export async function createCategory(request, response) {

    try {

        let category = new CategoryModel({
            name: request.body.name,
            images: imagesArr,
            parentCatName: request.body.parentCatName,
            parentId: request.body.parentId
        });

        category = await category.save();

        // reset images array after saving
        imagesArr = [];

        return response.status(201).json({
            message: 'Category created',
            error: false,
            success: true,
            category: category
        });


    } catch (error) {

        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });

    }

}

// get category

export async function getCategory(request, response) {
    try {

        const categories = await CategoryModel.find();


        const categoryMap = {};

        categories.forEach(cat => {
            categoryMap[cat._id] = { ...cat._doc, children: [] }

        })

        const rootCategories = [];
        categories.forEach(cat => {
            if (cat.parentId) {
                categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
            } else {
                rootCategories.push(categoryMap[cat._id]);
            }
        });

    } catch (error) {

        return response.status(500).json({

            message: error.message || error,
            error: true,
            success: false

        })

    }

}
















