const userModel = require("../models/user")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist")

/**
 * @name registerUserController
 * @description Register a new user, expects username, email and password in the require
 * @access Public
*/

async function registerUserController(req,res){
    const {username, email, password} = req.body
    if(!username || !email || !password){
        return res.status(400).json({
            message: "Plese provide username, email and password"
        })
    }
    const isUserAlreadyExsits = await userModel.findOne({
        $or: [{username}, {email}]
    })
     if(isUserAlreadyExsits){
        //isUserAleradyExists = username
        return res.status(400).json({
             message:"Account already exists with this email address or username"
        })
     }

     const hash = await bcrypt.hash(password, 10)

     const user = await userModel.create({
        username,
        email,
        password:hash
     })
     const token = jwt.sign(
        {id:user._id, username: user.username},
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
     )
     res.cookie("token", token)

     res.status(201).json({
        message:"User registered successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
     })
    }
    /**
     * @name loginUserController
     * @description login a user, exports email and password in the request body
     * @access Public
     */

    async function loginUserController(req, res){
        const {email, password} = req.body

        const user = await userModel.findOne({email})

        if(!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid){
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }
        const token= jwt.sign(
           {id:user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
     )
     res.cookie("token",token)
     res.status(200).json({
        message: "User loggedIn successfully.",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
     })
    }
/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

async function logoutUserController(req, res){
    const token = req.cookies?.token||req.header?.authorization?.split(' ')[1]||req.body?.token;
    if(!token){
        return res.status(401).json({message: "No token provided, authorization denied"});
        await tokenBlacklistModel.create({token})
}
res.clearCookie("token")
res.status(200).json({
    message: "User logged out succesfully"
})
}
/**
 * @name getMeController
 * @description get the the current logged in user details.
 * @acces private
 */
async function getMeController(req, res){
   const user = await userModel.findById(req.user.id)
   res.status(200).json({
    message: "User details fetched succesfully",
    user:{
       id: user._id,
       username: user.username,
       email:user.email
    }
   })
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}