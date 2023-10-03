let host = ["localhost", "YOUR_OPENSTACK_IP"];

window.addEventListener('load', () => {
    document.getElementById("addReview").addEventListener("click", addReview);
});

function addReview() {
    let rating = document.getElementById("rating").value;
    let review = document.getElementById("review").value;
    // get artwork id from url
    let artworkId = window.location.href.split("/")[4];
    console.log("artworkId: " + artworkId);

    // if review field is empty, alert user
    if (review == "") {
        alert("Please enter a review.");
        return;
    }
    let newReview = { rating: rating, review: review };

    fetch(`http://${host[0]}:3000/artworks/${artworkId}/createReview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
    })
        .then((response) => {
            // Our handler throws an error if the request did not succeed.
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.text();
        })
        .then((responseReview) => {
            let review = JSON.parse(responseReview)
            // reload page
            window.location.reload();
        })
        // Catch any errors that might happen, and display a message.
        .catch((error) => console.log(error));

}

