let darkMode = null;

// search by pressing enter in input tag
function start(dark) {
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
    darkMode = dark;
    const checkbox = document.getElementById("checkbox")
    checkbox.addEventListener("change", () => {
        localStorage.setItem("city",  document.getElementById("city").value);
        darkMode = !darkMode;
        if(darkMode){
            window.location = "darkmodeVersion.html";
        } else {
            window.location = "index.html";
        }
    })
    const tempCity = localStorage.getItem("city");
    if(tempCity != null){
        document.getElementById("city").value = tempCity;
        if(!(tempCity === "")){
            getCoordinates();
        }
    }
}

// close bootstrap modal by pressing enter
function check(e, buttonPressed) {
    if (e.key === "Enter" || buttonPressed) {
        $('#errorCity').modal('hide');
        $('#city').focus();
    }
}

function getCoordinates() {
    //input
    let city = document.getElementById('city').value;
    //output
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    // api key
    const key = 'a36e28109dbcd70e15694d4fa726f64f';
    // change st. to sankt for city name
    if (city.toLowerCase().includes("st.")) {
        city = city.toLowerCase().replace("st.", "sankt");
    }
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${key}`).then(res => res.json()).then(data => {
        let founded = false;
        // every is a foreach loop, but if return false it break the loop and if true it continuous the loop
        // go through all possible city names and check if one city name equals to the input city name
        data.every(d => {
            if (d.name.toLowerCase().includes(city.toLowerCase())) {
                founded = true;
                latitude.value = d.lat;
                longitude.value = d.lon;
                getData(d.lat, d.lon, d.name.toLowerCase().includes(city.toLowerCase()) ? d.name + " {" + d.country + "}" : d.local_names.de + " {" + d.country + "}");
                return false;
            } else if (d.local_names.de != null) {
                if (d.local_names.de.toLowerCase().includes(city.toLowerCase())) {
                    founded = true;
                    latitude.value = d.lat;
                    longitude.value = d.lon;
                    getData(d.lat, d.lon, d.name.toLowerCase().includes(city.toLowerCase()) ? d.name + " {" + d.country + "}" : d.local_names.de + " {" + d.country + "}");
                    return false;
                }
            }
            return true;
        });
        // if the city is not found, an error is thrown
        if (!founded) {
            throw Error();
        }
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
    if (!darkMode) {
        out.innerHTML = `
        <div class="card" style="color: #4B515D; border-radius: 25px;">
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
    } else {
        out.innerHTML = `
                 <div class="card text-white" style="border-radius: 25px;background-color: rgb(32,43,59);">
                   <div class="card-body p-4">
                    <div class="d-flex">
                        <h6 class="flex-grow-1">${city}</h6>
                        <h6>${time}</h6>
                    </div>
                    <div class="d-flex flex-column text-center mt-5 mb-4">
                        <h6 class="display-4 mb-0 font-weight-bold">${temperature}°C</h6>
                        <span class="small">${info}</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1" style="font-size: 1rem;">
                            <div>
                                <i class="fas fa-wind fa-fw" style="color: #868B94;"></i> <span class="ms-1">${windSpeed} km/h</span>
                            </div>
                            <div>
                                <i class="fas fa-tint fa-fw" style="color: #868B94;"></i> <span class="ms-1">${relativeHumidity}%</span>
                            </div>
                             <div>
                                <i class="fas fa-cloud-rain fa-fw" style="color: #868B94;"></i> <span class="ms-1">${precipitation}%</span>
                            </div>
                        </div>
                        <div>
                            <img src=${icon} width="100px">
                        </div>
                    </div>
                 </div>
        `;
    }
}

function showHighChartsPerWeek(days, temperature, city) {
    if (!darkMode) {
        Highcharts.chart('week', {
            chart: {
                borderRadius: 25,
                borderColor: '#D2D2D2',
                borderWidth: 1,
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
    } else {
        Highcharts.chart('week', {
            chart: {
                borderRadius: 25,
                backgroundColor: '#202B3B',
                type: 'spline',
                style: {
                    color: '#ffffff',
                },
            },
            title: {
                text: 'Weekly Temperature',
                style: {
                    color: '#ffffff',
                },
            },
            exporting: {
                buttons: {
                    contextButton: {
                        symbolStroke: "white",
                        theme: {
                            fill: "#202B3B",
                        }
                    }
                },
            },
            subtitle: {
                text: 'Source: ' +
                    '<a style="color:white" href="https://open-meteo.com" ' +
                    'target="_blank">Open-Metro.com</a>',
                style: {
                    color: '#ffffff',
                },
            },
            xAxis: {
                categories: days,
                accessibility: {
                    description: 'Weekdays',
                    style: {
                        color: '#ffffff',
                    }
                },
                labels: {
                    style: {
                        color: '#ffffff',
                    }
                },
                title: {
                    style: {
                        color: '#ffffff',
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Temperature',
                    style: {
                        color: '#ffffff',
                    }
                },
                labels: {
                    formatter: function () {
                        return this.value + '°';
                    },
                    style: {
                        color: '#ffffff',
                    }
                }
            },
            tooltip: {
                crosshairs: true,
                shared: true,
                backgroundColor: 'black',
                style: {
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
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
                data: temperature,
            }]
        });
    }
}

function showHighChartsPerDay(temperature, city) {
    if (!darkMode) {
        Highcharts.chart('day', {
            chart: {
                borderRadius: 20,
                borderColor: '#D2D2D2',
                borderWidth: 1,
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
    } else {
        Highcharts.chart('day', {
            chart: {
                borderRadius: 25,
                backgroundColor: '#202B3B',
                type: 'spline',
                style: {
                    color: '#ffffff',
                }
            },
            exporting: {
                buttons: {
                    contextButton: {
                        symbolStroke: "white",
                        theme: {
                            fill:"#202B3B",
                        }
                    }
                },
            },
            title: {
                text: 'Daily Temperature',
                style: {
                    color: '#ffffff',
                }
            },
            subtitle: {
                text: 'Source: ' +
                    '<a style="color: white" href="https://open-meteo.com" ' +
                    'target="_blank">Open-Metro.com</a>',
                style: {
                    color: '#ffffff',
                }
            },
            xAxis: {
                categories: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
                    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
                accessibility: {
                    description: 'Hours of a Day',
                    style: {
                        color: '#ffffff',
                    },
                },
                labels: {
                    style: {
                        color: '#ffffff',
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Temperature',
                    style: {
                        color: '#ffffff',
                    }
                },
                labels: {
                    formatter: function () {
                        return this.value + '°';
                    },
                    style: {
                        color: '#ffffff',
                    }
                }
            },
            tooltip: {
                crosshairs: true,
                shared: true,
                backgroundColor: 'black',
                style: {
                    color:'#ffffff',
                    fontWeight: 'bold',
                }
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

}