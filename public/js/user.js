let host = ["localhost", "YOUR_OPENSTACK_IP"];

window.addEventListener('load', () => {

});

// function when user click follow button
function follow() {
    // make post request with userid in current url to follow user
    fetch(`http://${host[0]}:3000/users/${window.location.href.split("/")[4]}/follow`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userid: window.location.href.split("/")[4] })
    }).then(res => {
        if (res.status == 200) {
            // refresh page
            window.location.reload();
        }
    });
}

// function when user click unfollow button
function unfollow() {
    // make delete request with userid in current url to unfollow user
    fetch(`http://${host[0]}:3000/users/${window.location.href.split("/")[4]}/unfollow`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userid: window.location.href.split("/")[4] })
    }).then(res => {
        if (res.status == 200) {
            // refresh page
            window.location.reload();
        }
    });
}

function becomeArtist() {
    // make put request to become an artist
    fetch(`http://${host[0]}:3000/becomeArtist`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artist: true })
    }).then(res => {
        if (res.status == 200) {
            // alert you have become an artist
            alert("You have become an artist.");
            window.location.reload();
        }
        else if (res.status == 404) {
            alert("You need to post at least one artwork to become an artist.");
            // redirect to add artwork page
            window.location.href = `http://${host[0]}:3000/addArtwork`;
        }
    });
}

function becomePatron() {
    // make put request to unbecome an artist
    fetch(`http://${host[0]}:3000/becomePatron`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artist: false })
    }).then(res => {
        if (res.status == 200) {
            // refresh page
            window.location.reload();
        }
    });
}