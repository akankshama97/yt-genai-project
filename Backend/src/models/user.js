const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true, "username already taken"],
        required: true,
    },
    
    email:{
        type:String,
        uniqe:[true, "Account already exists with email address"],
        require:true,
    },

    password: {
        type:String,
        require:true
    }
})
const user = mongoose.model("users", userSchema)
module.exports = user