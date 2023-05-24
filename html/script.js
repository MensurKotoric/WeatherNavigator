function getCoordinates(){
    //input
    const city = document.getElementById('city').value;
    //output
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    // fetching via api
    fetch(`https://geocode.maps.co/search?city=${city}`).
    then(res => res.json()).
    then(data => {
        latitude.value = data[0].lat;
        longitude.value = data[0].lon;
    });
}