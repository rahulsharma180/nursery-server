import CategoryModel from '../models/category.model.js';
import { v2 as cloudinary } from 'cloudinary';
import { error, log } from 'console';
import fs from 'fs';
import mongoose from 'mongoose';

// Configuration
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

//Image upload
// var imagesArr = [];

export async function uploadImages(request, response) {
  const imagesArr = [];
  try {
    const images = request.files;

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    // upload new images
    for (let i = 0; i < (images?.length || 0); i++) {
      const uploadResult = await cloudinary.uploader.upload(
        images[i].path,
        options
      );
      console.log(uploadResult + 'dgfdg');
      imagesArr.push(uploadResult.secure_url);

      // Delete file from local uploads folder
      fs.unlinkSync(`uploads/${images[i].filename}`);
    }

    return response.status(200).json({
      images: imagesArr,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
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
      parentId: request.body.parentId,
    });

    category = await category.save();

    // reset images array after saving
    imagesArr = [];

    return response.status(201).json({
      message: 'Category created',
      error: false,
      success: true,
      category: category,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// get Categories

export async function getCategories(request, response) {
  try {
    const categories = await CategoryModel.find();

    const categoryMap = {};

    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat._doc, children: [] };
    });

    const rootCategories = [];
    categories.forEach((cat) => {
      if (cat.parentId) {
        categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
      } else {
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    return response.status(200).json({
      message: '',
      error: false,
      success: true,
      data: rootCategories,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get category count
export async function getCategoriesCount(request, response) {
  try {
    const categoryCount = await CategoryModel.countDocuments({
      parentId: null,
    });
    if (!categoryCount) {
      response.status(500).json({
        success: false,
        error: true,
      });
    } else {
      response.send({
        categoryCount: categoryCount,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// get single Category

export async function getCategory(request, response) {
  try {
    const category = await CategoryModel.findById(request.params.id);

    if (!category) {
      return response.status(500).json({
        message: 'The category with the given ID was not found.',
        error: true,
        succes: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      category: category,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get Subcategory count
export async function getSubCategoriesCount(request, response) {
  try {
    // const categories = await CategoryModel.find();
    // if (!categories) {
    //   response.status(500).json({ success: false, error: true });
    // } else {
    //   const subCatList = [];
    //   for (let cat of categories) {
    //     if (cat.parentId !== null && cat.parentId !== undefined) {
    //       subCatList.push(cat);
    //     }
    //   }

    //   response.send({
    //     SubCategoryCount: subCatList.length,
    //   });
    const subCategoryCount = await CategoryModel.countDocuments({
      parentId: { $exists: true, $ne: null },
    });

    //   response.send({
    //     subCategoryCount: subCategoryCount
    //   });
    return response.status(200).json({
      subCategoryCount: subCategoryCount,
      message: 'Sub category count fetched successfully',
      error: false,
      success: true,
    });

    // }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function removeImageFromCloudinary(request, response) {
  try {
    const imgUrl = request.query.img;

    // Validation
    if (!imgUrl) {
      return response.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // URL se public_id nikalo
    const urlArr = imgUrl.split('/');
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split('.')[0];

    // Validation
    if (!imageName) {
      return response.status(400).json({
        success: false,
        message: 'Invalid image URL',
      });
    }
    console.log(imageName);

    // Cloudinary se delete karo
    const result = await cloudinary.uploader.destroy(imageName);

    return response.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      result: result,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
}

export async function updateCategory(request, response) {
  try {
    const imagesArr = []
    const categoryId = request.params.id;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return response.status(400).json({
    message: 'Invalid category ID', });
    }

    const updateCategoryData = await CategoryModel.findByIdAndUpdate(
      categoryId,

      {
        name: request.body.name,
        images: imagesArr,
        parentCatName: request.body.parentCatName,
        parentId: request.body.parentId,
      },

      { new: true }
    );

    imagesArr = []

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
