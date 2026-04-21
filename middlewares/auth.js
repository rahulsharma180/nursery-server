import jwt from 'jsonwebtoken'

const auth = async(request, response, next) =>{
    try {
        const token =
        request.cookies.accessToken || request.headers?.authorization?.split(' ')[1];

      
        if (!token){
            return response.status(401).json({
         message: 'Access token required - Please login',
         error: true,
            success: false     
               })
        }

        const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    // Agar yahan tak aaya matlab decode HAMESHA object hoga


        
 


        // if(!decode){
            
        //   ****** // Yeh line KABHI nahi chalegi!
              // Kyunki agar token invalid tha → upar hi error throw ho gaya
             // Aur catch mein chala gaya **********

        //     return response.status(401).json({
        //         message : 'unauthorized access',
        //         error : true,
        //         success : false
        //     })
        // }

        request.userId = decode.id

        next()
        
    } catch (error) {
        return response.status(401).json({
            message : 'Invalid or expired token - Please login again',
            error : true,
            success : false
        })
        
    }
}

export default auth;