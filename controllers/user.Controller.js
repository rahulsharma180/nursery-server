//  import sendEmail from '../config/sendEmail.js'
import userModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import verificationEmail from "../utils/verifyEmailTemplate.js";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import { decrypt } from "dotenv";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

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

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        error: true,
        success: false,
        message: "Invalid password",
      });
    }

    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    await UserModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
    });

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

        const removerefreshToken = await UserModel.findByIdAndUpdate(userid, {
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
