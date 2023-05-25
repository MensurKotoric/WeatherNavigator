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
        getData(data[0].lat, data[0].lon);
    });
}

function getData(lat, long) {
    //TODO get latitude and longitude from Input
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`)
        .then(res => res.json())
        .then(d => {
            const tableBody = document.querySelector('#currentData tbody');
            const row = tableBody.insertRow();
            row.innerHTML = `
                        <td>${d.latitude}</td>
                        <td>${d.longitude}</td>
                        <td>${d.current_weather.temperature}</td>
                        <td>${d.current_weather.time}</td>
                        <td>${d.current_weather.windspeed}</td>`
        })
}