const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token:{
        type:String,
        require:[true, "token is required to be added in blacklist"]
        }, 
      },  {
            timestamps: true
})

const tokenBlacklistModel = mongoose.model("blackliatTokens", blacklistTokenSchema)

module.exports = tokenBlacklistModel;