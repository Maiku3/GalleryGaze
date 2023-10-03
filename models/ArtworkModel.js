// Referenced from tut9 demo
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Define the Schema for a artwork, all fields are required
const artworkSchema = Schema({
    name: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    medium: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    }
});

//Export the default so it can be imported
module.exports = mongoose.model("Artwork", artworkSchema);

