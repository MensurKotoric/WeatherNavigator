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
        });
}
function htmlSideOfWeatherData(city,temperature, min, max, windSpeed, precipitation, cloudCoverHigh){
    const out = document.getElementById('output');
    let icon = '';
    if(cloudCoverHigh >= 90){
        icon = 'styles/thunderstormicon.png';
    } else if(precipitation >= 5){
        icon = 'styles/rainyicon.png';
    } else {
        icon = 'styles/sunnyicon.png';
    }
    out.innerHTML = `
     <div class="card" style="flex-direction: row">
          <img class="mt-2 rounded mx-auto d-block card-img-top" src="${icon}" style="width: 300px">
          <div class="card-body text-center">
            <h3 class="card-title text-danger">${city}</h3>
            <h5 class="card-text">Current temperature [°C]: ${temperature}</h5>
            <h5 class="card-text">Min [°C]: ${min}</h5>
            <h5 class="card-text">Max [°C]: ${max}</h5>
            <h5 class="card-text">Wind speed [km/h]: ${windSpeed}</h5>
            <h5 class="card-text">Precipitation [mm]: ${precipitation}</h5>
          </div>
     </div>`;
}