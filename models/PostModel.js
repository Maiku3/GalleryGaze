const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let postedSchema = Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User' },
	artwork: { type: Schema.Types.ObjectId, ref: 'Artwork' },
});

module.exports = mongoose.model("Post", postedSchema);
