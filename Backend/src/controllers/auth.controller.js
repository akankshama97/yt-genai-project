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
    try {
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
        const isProduction = process.env.NODE_ENV === "production" || req.secure || req.headers['x-forwarded-proto'] === 'https';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        };
        res.cookie("token", token, cookieOptions);

        return res.status(201).json({
            message:"User registered successfully",
            token,
            user:{
                id: user._id,
                username: user.username || user.name || user.email.split('@')[0],
                email: user.email
            }
        })
    } catch (err) {
        console.error("Register controller error:", err);
        return res.status(500).json({
            message: "Registration failed",
            error: err.message
        });
    }
}
    /**
     * @name loginUserController
     * @description login a user, exports email and password in the request body
     * @access Public
     */

    async function loginUserController(req, res){
        try {
            const {email, password} = req.body
            if (!email || !password) {
                return res.status(400).json({
                    message: "Please provide email and password"
                });
            }

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
                {id:user._id, username: user.username || user.name},
                process.env.JWT_SECRET,
                {expiresIn: "1d"}
            )
            const isProduction = process.env.NODE_ENV === "production" || req.secure || req.headers['x-forwarded-proto'] === 'https';
            const cookieOptions = {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 24 * 60 * 60 * 1000
            };
            res.cookie("token", token, cookieOptions);
            return res.status(200).json({
                message: "User loggedIn successfully.",
                token,
                user:{
                    id: user._id,
                    username: user.username || user.name,
                    email: user.email
                }
            })
        } catch (err) {
            console.error("Login controller error:", err);
            return res.status(500).json({
                message: "Login failed",
                error: err.message
            });
        }
    }
/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

async function logoutUserController(req, res){
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1] || req.body?.token;
        if(!token){
            return res.status(401).json({message: "No token provided, authorization denied"});
        }
        await tokenBlacklistModel.create({ token });
        const isProduction = process.env.NODE_ENV === "production" || req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });
        return res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error logging out",
            error: err.message
        });
    }
}
/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res){
    try {
        const user = await userModel.findById(req.user.id);
        if(!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            message: "User details fetched successfully",
            user:{
                id: user._id,
                username: user.username || user.name || user.email.split('@')[0],
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: "Unable to fetch user details",
            error: err.message
        });
    }
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}