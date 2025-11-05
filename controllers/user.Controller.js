//  import sendEmail from '../config/sendEmail.js'
import userModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import verificationEmail from '../utils/verifyEmailTemplate.js';
import jwt from 'jsonwebtoken';
import sendEmailFun from '../config/sendEmail.js';
import { decrypt } from 'dotenv';
import validator from "validator";
import generateAccessToken from '../utils/generateAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';

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
    //     return res.status(400).json({
    //         message : "provide email, name, password",
    //         error : true,
    //         success : false
    //     })

    if (!name || !email || !password) {
      const missingFields = [];

      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');

      return res.status(400).json({
        message: `Please provide ${missingFields.join(', ')}`,
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
        message: 'User already exists',
      });
    }

    // validateing email and password
    if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Please Enter a valid E-mail" })
    }

    if (password.length < 8) {
      return res.status(409).json({
        success: false,
        message: 'Please enter a strong password',
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

    console.log('Attempting to save user:', {
      name: newUser.name,
      email: newUser.email,
      otp: newUser.otp,
      otpExpires: newUser.otpExpires,
    });

    const save = await newUser.save(); // ✅ Save the new user
    console.log('User saved successfully:', save._id);
    console.log('Full saved user object:', JSON.stringify(save, null, 2));

    // Send verification email (non-blocking)
    try {
      await sendEmailFun({
        sendTo: email,
        subject: 'Verify your email - EcommerceAppMERN',
        text: '',
        html: verificationEmail(name, verifyCode),
      });
    } catch (err) {
      console.log('Email send failed:', err.message);
      console.error("Email failed:", err.message);
  await userModel.findByIdAndDelete(newUser._id);
  return res.status(500).json({
    success: false,
    message: "Registration failed — unable to send verification email.",
  });
    }

    // // Create JWT unused 
    // const token = jwt.sign(
    //   { email: newUser.email, id: newUser._id },
    //   process.env.JSON_WEB_TOKEN_SECRET_KEY
    // );

    return res.status(201).json({
      message: 'User registered successfully! Please verify your email.',
      success: true,
      error: false,
      // token,
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
        message: 'User not found',
      });
    }

    if (user.verify_email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email already verified',
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
        message: 'Email verified successfully',
      });
    } else if (!isCodeValid) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid OTP',
      });
    } else {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'OTP expired',
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Something went wrong',
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
        message: 'Email and password are required',
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'Active') {
      return res.status(400).json({
        message: 'Contact the admin',
        error: true,
        success: false,
      });
    }

    if (user.verify_email !== true) {
      return res.status(400).json({
        message: 'Your Email is not verify yet please verify your email first',
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'Invalid password',
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Login successful',
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
      message: error.message || 'Something went wrong',
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
      sameSite: 'None',
    };

    res.clearCookie('accessToken', cookiesOption);
    res.clearCookie('refreshToken', cookiesOption);

    const removerefreshToken = await userModel.findByIdAndUpdate(userid, {
      refresh_token: '',
    });

    return res.json({
      message: 'Logout successfully',
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// //Image upload
// var imagesArr = [];
export async function userAvatarController(request, response) {
  try {
    //Image upload
    let imagesArr = [];
    const userId = request.userId; //auth middleware Only logged-in user updates their avatar
    const images = request.files; // multiple file uploads

    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return response.status(404).json({
        message: 'User not found',
        error: true,
        success: false,
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar) {
      const urlArr = user.avatar.split('/'); // array bn rh h
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
      overwrite: false,
    };

    // Upload new images
    for (let i = 0; i < (images?.length || 0); i++) {
      const uploadResult = await cloudinary.uploader.upload(
        images[i].path,
        options
      );
      imagesArr.push(uploadResult.secure_url);

      // Delete file from local uploads folder
      fs.unlinkSync(`uploads/${images[i].filename}`);
      console.log(request.files[i].filename);
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
      avatar: user.avatar,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
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
      return response.status(400).send('The user cannot be updated!');
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

        otpExpires: verifyCode ? Date.now() + 600000 : null,
      },
      { new: true }
    );
    if (email && email !== userExist.email) {
      // send verification email
      await sendEmailFun({
        sendTo: email,
        subject: 'Verify email from EcommerceMERNApp',
        text: '',
        html: verificationEmail(name, verifyCode),
      });
    }
    return response.json({
      message: 'User updated successfully',
      error: false,
      success: true,
      user: updateUser,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function forgotPasswordController(request, response) {
  try {
    const { email } = request.body;

    const userExist = await userModel.findOne({ email });
    if (!userExist) {
      return response.status(400).json({
        message: 'Email not available',
        error: true,
        success: false,
      });
    } else {
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

      const user = userExist;

      user.forgot_password_otp = verifyCode;
      (user.forgot_password_expiry = Date.now() + 600000), // 10 minutes validity
        await user.save(); //Tab use karte hain jab aapke paas model ka object hai aur usko modify karna hai

      //   user.otp = verifyCode;
      //   user.otpExpires = Date.now() + 600000;

      // ⚠️ Ye lines intentionally comment ki gayi hain:
      // user.otp = verifyCode;
      // user.otpExpires = Date.now() + 600000;
      // 👉 Reason:
      // Ye fields (otp, otpExpires) signup/email verification ke liye hoti hain.
      // Agar inhe forgot password ke liye bhi use karenge to OTP conflict ho sakta hai —
      // matlab ek process ka OTP dusre process me galti se verify ho jayega.
      //
      // 🧠 Example:
      // Dono (email verify OTP `user.otp` aur forgot password OTP `user.otp`)
      // agar ek hi field me store honge, to system confuse ho sakta hai —
      // jaise galat OTP verify ho jana.
      //
      // ✅ Isliye humne forgot password ke liye alag fields banayi hain:
      // 'forgot_password_otp' aur 'forgot_password_expiry'

      console.log(user._id);

      // ✅ Hum yahan 'findByIdAndUpdate()' ka use kar rahe hain instead of 'user.save()'
      // Kyunki:
      // 1️⃣ findByIdAndUpdate direct database me ek specific field update karta hai (fast & atomic)
      // 2️⃣ user.save() poori document ko reload karke save karta hai — unnecessary overhead hota hai
      // 3️⃣ Is case me hume sirf OTP aur expiry update karni hai, isliye direct update best option hai

      // const expireTime = new Date() + 60 * 60 * 1000 // 1hr ye string m save hoga

      // await userModel.findByIdAndUpdate(user._id, {
      //   forgot_password_otp: verifyCode,
      //   // forgot_password_expiry : new Date(expireTime).toISOString()
      //   forgot_password_expiry: Date.now() + 600000, // 10 minutes validity
      // })

      await sendEmailFun({
        sendTo: email,
        subject: 'Verify OTP from EcommerceMERNApp',
        text: '',
        html: verificationEmail(user.name, verifyCode),
      });

      return response.json({
        message: 'Check your email',
        error: false,
        success: true,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || 'Something went wrong',
      error: true,
      success: false,
    });
  }
}

export async function verifyForgotPasswordOtp(request, response) {
  try {
    const { email, otp } = request.body;

    if (!email || !otp) {
      return response.status(400).json({
        message: 'Provide required fields: emails, otp.',
        error: true,
        success: false,
      });
    }

     const user = await userModel.findOne({email})

      if(!user){
        return response.status(400).json({
          message: "Email not Available",
          error : true,
          success : false
        })
      }

      //  const currentTime = new Date().toISOString()

      //   if(user.forgot_password_expiry < currentTime  ){
      //       return response.status(400).json({
      //           message : "Otp is expired",
      //           error : true,
      //           success : false
      //       })
      //   }

      if(user.forgot_password_expiry < Date.now()){
        return response.status(400).json({
          message: "Otp is Expired",
          error : true,
          success : false
        })
      }


      if(otp.trim()!== user.forgot_password_otp){ //🧠 otp.trim() kya karta hai? 👉 trim() ek JavaScript string method hai
        return response.status(400).json({         // jo kisi string ke aage aur peeche ke space (whitespace) hata deta hai.
          message: "Invaild Otp", 
          error : true,
          success : false
        })

      }

        //****************** */ Clear OTP fields after successful verification*************


        // user.forgot_password_otp = "";
        // user.forgot_password_expiry = "";
        // await user.save();

     const updateUser = await userModel.findByIdAndUpdate(user?._id,{
            // forgot_password_otp : "", // isko bhi null kar liya kiu ki defult value null set kiya h module m, string m maja nhi aarh th
            forgot_password_otp : null, 

            // forgot_password_expiry : "",
           forgot_password_expiry: null, // 👈 clearly null

          // Ab dekho 👇

          //   forgot_password_otp → String field hai
          //   → isme "" (empty string) perfectly valid hai.

          //   forgot_password_expiry → Date field hai
          //   → isme "" (empty string) ek invalid date ban jata hai.
          //   Mongoose usse null me convert kar deta hai automatically.

          // *****iss liye database mai "" ko null m convert kr rh h**********

        },
      { new: true }   // 👈 important 👈 return updated user object... ye aagar na likhu to user update to hoga lakin turant hi ye old data return kr dega iss liye ye kiya h taki new data mile
      );

      
        return response.json({
            message : "OTP verified successfully",
            error : false,
            success : true
        })
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function resetPassword(request, response) {
  try {
    
    const {email,newPassword,confirmPassword} = request.body;


    if(!email || !newPassword || !confirmPassword){
      return response.status(400).json({
                message: 'Provide required fields: email, newPassword, confirmPassword',
                error: true,
                success: false
            });
    }


    const user = await userModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            });
        }
        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "New password and confirm password must be the same",
                error: true,
                success: false
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

          await userModel.findOneAndUpdate(user._id,{
            password : hashPassword
        })
        // user.password = hashPassword;
        // await user.save();

         return response.json({
            message: 'Password updated successfully',
            error: false,
            success: true
        });


  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//refresh token controller
export async function refreshToken(request, response) {
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(' ')[1] //bearer token

        if (!refreshToken) {
            return response.status(401).json({
                message: 'Invalid token',
                error: true,
                success: false
            })
        }

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN)

        if (!verifyToken) {
            return response.status(401).json({
                message: 'token is expired',
                error: true,
                success: false
            })
        }

        const userId = verifyToken?._id;
        const newAccessToken = await generateAccessToken(userId)
        const newRefreshToken = generateRefreshToken(userId);

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }

        response.cookie('accessToken', newAccessToken, cookiesOption)
        response.cookie('refreshToken', newRefreshToken, cookiesOption);

        return response.json({
            message: 'New Access token generated',
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || "Something went wrong",
            error: true,
            success: false
        });
    }
}


//get login user details
export async function userDetails(request,response){
    try {
        const userId  = request.userId

        console.log(userId)

        const user = await userModel.findById(userId).select('-password -refresh_token')

      if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message : 'user details',
            data : user,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : "Something is wrong",
            error : true,
            success : false
        })
    }
}