//  import sendEmail from '../config/sendEmail.js'
import userModel from "../models/user.model.js";
import bcryptjs, { hash } from "bcryptjs";
import verificationEmail from "../utils/verifyEmailTemplate.js";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import { decrypt } from "dotenv";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



// Configuration
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});


//register user
const registerUserController = async (req, res) => {
  let { name, password, email } = req.body;
  try {
    //   if(!name || !email || !password){
    //     return req.status(400).json({
    //         message : "provide email, name, password",
    //         error : true,
    //         success : false
    //     })

    if (!name || !email || !password) {
      const missingFields = [];

      if (!name) missingFields.push("name");
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");

      return res.status(400).json({
        message: `Please provide ${missingFields.join(", ")}`,
        error: true,
        success: false,
      });
    }

    //checking use exits or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        error: true,
        message: "User already exists",
      });
    }

    // // validateing email and password
    // if (!validator.isEmail(email)) {
    //     return res.json({ success: false, message: "Please Enter a valid E-mail" })
    // }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }
    //  console.log("Password hai ye :", password);
    //  console.log("Password hai jo ja rhe :", decryptedPassword);

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    //hashing user password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // ✅ Debugging - Check Hashed Password
    // console.log("Hashed Password:", hashedPassword);

    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
      otp: verifyCode,
      otpExpires: Date.now() + 600000,
    });

    console.log("Attempting to save user:", {
      name: newUser.name,
      email: newUser.email,
      otp: newUser.otp,
      otpExpires: newUser.otpExpires,
    });

    const save = await newUser.save(); // ✅ Save the new user
    console.log("User saved successfully:", save._id);
    console.log("Full saved user object:", JSON.stringify(save, null, 2));

    // Send verification email (non-blocking)
    try {
      await sendEmailFun({
        sendTo: email,
        subject: "Verify your email - EcommerceAppMERN",
        text: "",
        html: verificationEmail(name, verifyCode),
      });
    } catch (err) {
      console.log("Email send failed:", err.message);
    }

    // Create JWT
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return res.status(201).json({
      message: "User registered successfully! Please verify your email.",
      success: true,
      error: false,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        verify_email: newUser.verify_email,
      },
    });
  } catch (error) {
    console.error(error); // server pe log for debugging
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export { registerUserController };

export async function verifyEmailController(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "User not found",
      });
    }

    if (user.verify_email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Email already verified",
      });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.verify_email = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(200).json({
        error: false,
        success: true,
        message: "Email verified successfully",
      });
    } else if (!isCodeValid) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Invalid OTP",
      });
    } else {
      return res.status(400).json({
        error: true,
        success: false,
        message: "OTP expired",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
}

export async function loginController(req, res) {
  try {
    let { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "Active") {
      return res.status(400).json({
        message: "Contact the admin",
        error: true,
        success: false,
      });
    }

    if (user.verify_email !== true) {
      return res.status(400).json({
        message: "Your Email is not verify yet please verify your email first",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        error: true,
        success: false,
        message: "Invalid password",
      });
    }

    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    await userModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
    });
    // const now = new Date();
    //     const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    //   await userModel.findByIdAndUpdate(user._id, {
    //           last_login_date: istTime,
    // });



    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({
      error: false,
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
}

export async function logoutController(req, res) {
  try {
    const userid = req.userId; //auth middlewares

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    };

    res.clearCookie('accessToken', cookiesOption);
    res.clearCookie('refreshToken', cookiesOption);

    const removerefreshToken = await userModel.findByIdAndUpdate(userid, {
      refresh_token: ''
    });

    return res.json({
      message: 'Logout successfully',
      error: false,
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}




// //Image upload
// var imagesArr = [];
export async function userAvatarController(request, response) {
  try {

    //Image upload
    let imagesArr = [];
    const userId = request.userId;  //auth middleware Only logged-in user updates their avatar
    const images = request.files; // multiple file uploads

    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return response.status(404).json({
        message: 'User not found',
        error: true,
        success: false
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar) {
      const urlArr = user.avatar.split('/');  // array bn rh h
      const image = urlArr[urlArr.length - 1]; // array mai se last item nikal rh h
      const imageName = image.split('.')[0]; //file extension remove kar rahe hain
      if (imageName) {
        await cloudinary.uploader.destroy(imageName); //uploaded file ko delete karna
      }
    }
    // 🔄 TL;DR Deep Version

    // 1. URL se last part nikalte hain → file name with extension

    // 2. Extension hata ke public ID nikalte hain

    // 3. Safety check → agar valid hai, delete karte hain Cloudinary se

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false
    };

    // Upload new images
    for (let i = 0; i < (images?.length || 0); i++) {
      const uploadResult = await cloudinary.uploader.upload(images[i].path, options);
      imagesArr.push(uploadResult.secure_url);

      // Delete file from local uploads folder
      fs.unlinkSync(`uploads/${images[i].filename}`);
      console.log(request.files[i].filename)
    }


    // // bad way of 

    //         for (let i = 0 ; i < images?.length; i++) {
    // const img = await cloudinary.uploader.upload(
    // images[i].path,
    // options,
    // function (error, result) {
    // console.log(result)

    // imagesArr.push(result.secure_url);
    // fs.unlinkSync(`uploads/${request.files[i].filename}`);
    // console.log(request.files[i].filename)
    // }
    // );
    // }



    // Update user avatar
    user.avatar = imagesArr[0] || user.avatar;
    await user.save();

    return response.status(200).json({
      _id: userId,
      avatar: user.avatar
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

//  best way to update avtar bs delete old data or user check lgna h bs
// //upload user avatar
// export async  function uploadAvatar(request,response){
//     try {
//         const userId = request.userId // auth middlware
//         const image = request.file  // multer middleware

//       const user = await UserModel.findById(userId);
//  ye add krna tha bs
// if (!user) {
//   return res.status(404).json({ message: "User not found", error: true });
// }

// // Delete old avatar from Cloudinary
// if (user.avatar) {
//   const urlArr = user.avatar.split("/");
//   const imageName = urlArr[urlArr.length - 1].split(".")[0];
//   await cloudinary.uploader.destroy(imageName);
// }

//         const upload = await uploadImageClodinary(image)

//         const updateUser = await UserModel.findByIdAndUpdate(userId,{
//             avatar : upload.url
//         })

//         return response.json({
//             message : "upload profile",
//             success : true,
//             error : false,
//             data : {
//                 _id : userId,
//                 avatar : upload.url
//             }
//         })

//     } catch (error) {
//         return response.status(500).json({
//             message : error.message || error,
//             error : true,
//             success : false
//         })
//     }
// }


//Remove image from cloudinary

export async function removeImageFromClodinary(request, response) {
  try {
    const imgUrl = request.query.img;
    if (!imgUrl) {
      return response.status(400).json({ message: 'Image URL is required' });
    }

    const urlArr = imgUrl.split('/');
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split('.')[0]; // public_id expected by Cloudinary

    if (!imageName) {
      return response.status(400).json({ message: 'Invalid image URL' });
    }
    const result = await cloudinary.uploader.destroy(imageName);

    return response.status(200).json({
      message: 'Image deleted successfully',
      result: result.result,
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || 'Failed to delete image',
    });
  }
}



export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId; // from auth middleware
    const { name, email, mobile, password } = request.body;

    const userExist = await userModel.findById(userId);
    if (!userExist) {
      return response.status(400).send('The user cannot be updated!')
    }


    let verifyCode = null;

    if (email && email !== userExist.email) {
      verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    let hashPassword;
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashPassword = await bcryptjs.hash(password, salt);
    } else {
      hashPassword = userExist.password;
    }


    const updateUser = await userModel.findByIdAndUpdate(
      userId,
      {
        name: name,
        mobile: mobile,
        email: email,
        verify_email: email !== userExist.email ? false : true,
        password: hashPassword,
        otp: verifyCode ? verifyCode : null,
        // otp: verifyCode!=="" ? verifyCode : null,

        otpExpires: verifyCode ? Date.now() + 600000 : null
      },
      { new: true }
    );
    if (email && email !== userExist.email) {
      // send verification email
      await sendEmailFun({
        sendTo: email,
        subject: 'Verify email from EcommerceMERNApp',
        text: '',
        html: verificationEmail(name, verifyCode)
      });
    }
    return response.json({
      message: 'User updated successfully',
      error: false,
      success: true,
      user: updateUser
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    })
  }

}