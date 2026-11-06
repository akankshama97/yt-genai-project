const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is required to be added in blacklist"],
        unique: true
    },
}, {
    timestamps: true
});

blacklistTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const tokenBlacklistModel = mongoose.model("blackliatTokens", blacklistTokenSchema);

module.exports = tokenBlacklistModel;