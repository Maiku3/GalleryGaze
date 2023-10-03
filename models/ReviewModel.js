const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let reviewSchema = Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    artwork: { type: Schema.Types.ObjectId, ref: 'Artwork' },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: checkReview
    },
    review: {
        type: String,
        required: checkReview
    }
});

function checkReview(){
    return this.rating || this.review;
}

module.exports = mongoose.model("Review", reviewSchema);
