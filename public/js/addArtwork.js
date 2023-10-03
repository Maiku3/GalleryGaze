// Referenced tut 9 demo
let host = ["localhost", "YOUR_OPENSTACK_IP"];

window.addEventListener('load', () => {

    document.getElementById("add").addEventListener("click", addArtwork);

});

function addArtwork() {

    console.log("Adding a new Artwork");
    let name = document.getElementById("name").value;
    let artist = document.getElementById("artist").value;
    let year = document.getElementById("year").value;
    let category = document.getElementById("category").value;
    let medium = document.getElementById("medium").value;
    let description = document.getElementById("description").value;
    let image = document.getElementById("image").value;

    // if a field is empty alert user
    if (name == "" || artist == "" || year == "" || category == "" || medium == "" || description == "" || image == "") {
        alert("Please fill out all fields.");
        return;
    }
    
    let newArtwork = { name: name, artist: artist, year: year, category: category, medium: medium, description: description, image: image };

    fetch(`http://${host[0]}:3000/artworks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newArtwork)
    })
        .then((response) => {
            // Our handler throws an error if the request did not succeed.
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            return response.text();
        })
        .then((responseArtwork) => {
            let artwork = JSON.parse(responseArtwork)
            location.href = `http://${host[0]}:3000/artworks/${artwork._id}`
        })
        // Catch any errors that might happen, and display a message.
        .catch((error) => console.log(error));

}