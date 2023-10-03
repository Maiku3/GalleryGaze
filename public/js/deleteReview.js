let host = ["localhost", "YOUR_OPENSTACK_IP"];

window.addEventListener('load', () => {
    document.getElementById("delete").addEventListener("click", deleteReview);
});

// Function to delete review
function deleteReview() {
    // send delete request to delete review to server
    let reviewId = window.location.href.split("/")[4];

    fetch(`http://${host[0]}:3000/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((response) => {
            // Our handler throws an error if the request did not succeed.
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.text();
        })
        .then((responseArtwork) => {
            let response = JSON.parse(responseArtwork)
            // redirect to artwork page
            window.location.href = `http://${host[0]}:3000/artworks/${response._id}`;
        })
        // Catch any errors that might happen, and display a message.
        .catch((error) => console.log(error));
}



