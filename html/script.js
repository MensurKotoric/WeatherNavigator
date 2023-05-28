// search by pressing enter in input tag
function start() {
    $('#city').focus(); // jQuery  | equal to document.getElementById('city').focus()
    document.getElementById("city").addEventListener("submit", function (event) {
        event.preventDefault();
    });
    document.getElementById("city").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            getCoordinates();
        }
    });
}
// close bootstrap modal by pressing enter
function check(e, buttonPressed){
    if(e.key === "Enter" || buttonPressed){
        $('#errorCity').modal('hide');
        $('#city').focus();
    }
}

function getCoordinates() {
    //input
    const city = document.getElementById('city').value;
    //output
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    // fetching via api
    fetch(`https://geocode.maps.co/search?city=${city}`).then(res => res.json()).then(data => {
        latitude.value = data[0].lat;
        longitude.value = data[0].lon;
        getData(data[0].lat, data[0].lon, city);
    }).catch(err => {
        // clear fault input
        document.getElementById('city').value = '';
        // show message boostrap modal
        if (document.getElementById('city').value == '') {
            $('#errorCity').modal('show');
        }
    });
}

function getData(lat, long, city) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode&timezone=Europe/Berlin&daily=temperature_2m_max,temperature_2m_min`)
        .then(res => res.json())
        .then(d => {
            // get current hour
            let hour = d.current_weather.time;
            hour = parseInt(hour.substring(hour.length - 5, hour.length - 3));
            // show basic information on a bootstrap card
            // get current time
            let time = new Date();
            htmlSideOfWeatherData(city, time.toString().substring(16, 21), d.current_weather.temperature, d.daily.temperature_2m_min[0], d.daily.temperature_2m_max[0], d.current_weather.windspeed, d.hourly.relativehumidity_2m[hour], d.hourly.precipitation_probability[hour], d.hourly.weathercode[hour]);

            // data for hourly temperature diagram
            let temperatureHourly = []; // array of temperature, index equal hour
            let indexOfHighestTemp = 0; // get hour with the highest temperature
            for (let i = 0; i <= 23; i++) {
                temperatureHourly.push(d.hourly.temperature_2m[i]);
                if (i > 0) {
                    if (d.hourly.temperature_2m[indexOfHighestTemp] <= d.hourly.temperature_2m[i]) {
                        indexOfHighestTemp = i;
                    }
                }
            }
            // change design for the current point in the diagram
            temperatureHourly[hour] = {y: d.hourly.temperature_2m[hour], marker: {radius: 10, fillColor: 'red'}};
            // change desing for the highest temperature point in the diagram
            temperatureHourly[indexOfHighestTemp] = {
                y: d.hourly.temperature_2m[indexOfHighestTemp],
                marker: {symbol: 'url(styles/sunIconForHighChart.png)'}
            };
            showHighChartsPerDay(temperatureHourly, city);

            // data for weekly temperature diagram
            let temperatureDaily = []; // array of temperature, index equal day
            let dayNames = [];          // day names of the dates
            let indexHighTempDay = 0; // get day with the highest temperature
            for (let i = 0; i <= 6; i++) {
                const day = dayjs(d.daily.time[i]); // convert date to a day name
                dayNames.push(day.$d.toString().substring(0, 10));
                temperatureDaily.push(d.daily.temperature_2m_max[i]);
                if (i > 0) {
                    if (d.daily.temperature_2m_max[indexHighTempDay] <= d.daily.temperature_2m_max[i]) {
                        indexHighTempDay = i;
                    }
                }
            }
            // change design for the current point in the diagram
            temperatureDaily[0] = {y: d.daily.temperature_2m_max[0], marker: {radius: 10, fillColor: 'red'}};
            // change desing for the highest temperature point in the diagram
            temperatureDaily[indexHighTempDay] = {
                y: d.daily.temperature_2m_max[indexHighTempDay],
                marker: {symbol: 'url(styles/sunIconForHighChart.png)'}
            };
            showHighChartsPerWeek(dayNames, temperatureDaily, city);
        });
}

function htmlSideOfWeatherData(city, time, temperature, min, max, windSpeed, relativeHumidity, precipitation, weatherCode) {
    const out = document.getElementById('output');
    let icon = '';
    let info = '';
    if (weatherCode >= 90) { // stormy
        icon = 'styles/thunderstormicon.png';
        info = 'stormy';
    } else if (precipitation >= 80) { // rainy
        icon = 'styles/rainyicon.png';
        info = 'rainy';
    } else {
        icon = 'styles/sunnyicon.png'; //sunny
        info = 'sunny';
    }
    out.innerHTML = `
        <div class="card" style="color: #4B515D; border-radius: 35px;">
          <div class="card-body p-4">
            <div class="d-flex">
              <h6 class="flex-grow-1">${city}</h6>
              <h6>${time}</h6>
            </div>

            <div class="d-flex flex-column text-center mt-5 mb-4">
              <h6 class="display-4 mb-0 font-weight-bold" style="color: #1C2331;">${temperature}°C</h6>
              <span class="small" style="color: #868B94">${info}</span>
            </div>

            <div class="d-flex align-items-center">
              <div class="flex-grow-1" style="font-size: 1rem;">
                <div><i class="fas fa-wind fa-fw" style="color: #868B94;"></i> <span class="ms-1">${windSpeed} km/h
                  </span></div>
                <div><i class="fas fa-tint fa-fw" style="color: #868B94;"></i> <span class="ms-1">${relativeHumidity}%</span>
                </div>
                <div><i class="fas fa-cloud-rain fa-fw" style="color: #868B94;"></i> <span class="ms-1">${precipitation}%</span>
                </div>
              </div>
              <div>
                <img src=${icon}
                  width="100px">
              </div>
            </div>

          </div>
        </div>`;
}

function showHighChartsPerWeek(days, temperature, city) {
    Highcharts.chart('week', {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Weekly Temperature'
        },
        subtitle: {
            text: 'Source: ' +
                '<a href="https://open-meteo.com" ' +
                'target="_blank">Open-Metro.com</a>'
        },
        xAxis: {
            categories: days,
            accessibility: {
                description: 'Weekdays'
            }
        },
        yAxis: {
            title: {
                text: 'Temperature'
            },
            labels: {
                formatter: function () {
                    return this.value + '°';
                }
            }
        },
        tooltip: {
            crosshairs: true,
            shared: true
        },
        plotOptions: {
            spline: {
                marker: {
                    radius: 4,
                    lineColor: '#666666',
                    lineWidth: 1
                }
            }
        },
        series: [{
            name: city,
            marker: {
                symbol: 'diamond'
            },
            data: temperature
        }]
    });
}

function showHighChartsPerDay(temperature, city) {
    Highcharts.chart('day', {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Daily Temperature'
        },
        subtitle: {
            text: 'Source: ' +
                '<a href="https://open-meteo.com" ' +
                'target="_blank">Open-Metro.com</a>'
        },
        xAxis: {
            categories: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
                '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            accessibility: {
                description: 'Hours of a Day'
            }
        },
        yAxis: {
            title: {
                text: 'Temperature'
            },
            labels: {
                formatter: function () {
                    return this.value + '°';
                }
            }
        },
        tooltip: {
            crosshairs: true,
            shared: true
        },
        plotOptions: {
            spline: {
                marker: {
                    radius: 4,
                    lineColor: '#666666',
                    lineWidth: 1
                }
            }
        },
        series: [{
            name: city,
            marker: {
                symbol: 'diamond'
            },
            data: temperature
        }]
    });

}