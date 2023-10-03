// Referenced from tut9 demo
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Define the Schema for a user
const userSchema = Schema({
	username: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	artist: {
		type: Boolean,
		required: true,
	},
	following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});


userSchema.methods.findArtworks = function (callback) {
	this.model("Post").find()
		.where("user").equals(this._id)
		.populate("artwork")
		.exec(callback);
};

userSchema.methods.findReviews = function (callback) {
	this.model("Review").find()
		.where("user").equals(this._id)
		.populate("artwork")
		.exec(callback);
};

// find reviewed artworks by user
userSchema.methods.findReviewedArtworks = function (callback) {
	this.model("Review").find()
		.where("user").equals(this._id)
		.populate("artwork")
		.exec(callback);
};

//Export the default so it can be imported
module.exports = mongoose.model("User", userSchema);