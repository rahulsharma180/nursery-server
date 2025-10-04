//  import sendEmail from '../config/sendEmail.js'
import userModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verificationEmail from "../utils/verifyEmailTemplate.js";
import jwt from 'jsonwebtoken'
import sendEmailFun from "../config/sendEmail.js";


//register user
const registerUserController = async (req, res) => {
    let { name, password, email } = req.body;
    try {

          if(!name || !email || !password){
            return response.status(400).json({
                message : "provide email, name, password",
                error : true,
                success : false
            })
        }

        
        //checking use exits or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, 
                  error : true,
                message: "User already exists" })
        }

        
        // // validateing email and password
        // if (!validator.isEmail(email)) {
        //     return res.json({ success: false, message: "Please Enter a valid E-mail" })
        // }
        
         

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }
        //  console.log("Password hai ye :", password);
        //  console.log("Password hai jo ja rhe :", decryptedPassword); 

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();


        //hashing user password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt);


        // ✅ Debugging - Check Hashed Password
        // console.log("Hashed Password:", hashedPassword);

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            otp: verifyCode,
            otpExpires: Date.now() + 600000,
        })


        console.log("Attempting to save user:", {
            name: newUser.name,
            email: newUser.email,
            otp: newUser.otp,
            otpExpires: newUser.otpExpires
        });

    const save = await newUser.save(); // ✅ Save the new user
        console.log("User saved successfully:", save._id);
        console.log("Full saved user object:", JSON.stringify(save, null, 2));


      // Send verification email (non-blocking)
        try {
            await sendEmailFun({
                sendTo: email,
                subject: 'Verify your email - EcommerceAppMERN',
                text: '',
                html: verificationEmail(name, verifyCode)
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
            message: 'User registered successfully! Please verify your email.',
            success: true,
            error: false,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                verify_email: newUser.verify_email
            }
        });


    } catch (error) {
        console.error(error); // server pe log for debugging
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false 
        }); 
    }

};

export {registerUserController}

export async function verifyEmailController(request, response) {
    try {
        const { email, otp } = request.body;

        const user = await userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return response.status(400).json({
                error: true,
                success: false,
                message: 'User not found'
            });
        }

        if (user.verify_email) {
            return response.status(400).json({
                error: true,
                success: false,
                message: 'Email already verified'
            });
        }

        const isCodeValid = user.otp === otp;
        const isNotExpired = user.otpExpires > Date.now();

        if (isCodeValid && isNotExpired) {
            user.verify_email = true;
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            return response.status(200).json({
                error: false,
                success: true,
                message: 'Email verified successfully'
            });

        } else if (!isCodeValid) {
            return response.status(400).json({
                error: true,
                success: false,
                message: 'Invalid OTP'
            });
        } else {
            return response.status(400).json({
                error: true,
                success: false,
                message: 'OTP expired'
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || 'Something went wrong',
            error: true,
            success: false
        });
    }
}
