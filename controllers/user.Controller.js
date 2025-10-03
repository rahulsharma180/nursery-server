//  import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
// import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
// import generatedAccessToken from '../utils/generatedAccessToken.js'
// import genertedRefreshToken from '../utils/generatedRefreshToken.js'
// import uploadImageClodinary from '../utils/uploadImageClodinary.js'
// import generatedOtp from '../utils/generatedOtp.js'
// import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'


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

        
        // validateing email and password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please Enter a valid E-mail" })
        }
        
         

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }
        //  console.log("Password hai ye :", password);
        //  console.log("Password hai jo ja rhe :", decryptedPassword); 
        //hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(decryptedPassword, salt);


        // ✅ Debugging - Check Hashed Password
        // console.log("Hashed Password:", hashedPassword);

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword
        })

        const user = await newUser.save()


              const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo : email,
            subject : "Verify email from binkeyit",
            html : verifyEmailTemplate({
                name,
                url : VerifyEmailUrl
            })
        })



        const token = createToken(user._id)
        res.json({ success: true, token })



    } catch (error) {
        console.error(error); // server pe log for debugging
        return res.status(500).json({
            message : error.message || error,
            error : true,
            success : false 
        }); 
    }

}