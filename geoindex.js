// Universal function to load weather data based on parameter and coordinates
async function getLatitudeLongitude(cityName) {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
    }
    const data = await response.json();
    if (data.results.length === 0) {
        throw new Error("No results found for the city.");
    }
    return { latitude: data.results[0].latitude, longitude: data.results[0].longitude };
}
function displayCoordinates(latitude, longitude) {
    document.getElementById("result").innerText = `Latitude: ${latitude}, Longitude: ${longitude}`;
}

function handleButtonPress() {
    const cityName = document.getElementById("cityInput").value.trim();

    if (cityName === "") {
        alert("Please enter a city name.");
        return;
    }

    try {
        getLatitudeLongitude(cityName)
            .then(({ latitude, longitude }) => {
                displayCoordinates(latitude, longitude);
            })
            .catch(error => {
                console.error('Error fetching coordinates:', error.message);
            });
    } catch (error) {
        console.error('Error handling selection:', error.message);
    }
}

document.getElementById("fetchCoordinates").addEventListener("click", handleButtonPress);

async function handleSelection() {
    const intervalDropdown = document.getElementById("interval");
    const interval = intervalDropdown.options[intervalDropdown.selectedIndex].value;

    // Get the selected value from the dropdown for parameter
    const dropdown = document.getElementById("param");
    const selectedOption = dropdown.options[dropdown.selectedIndex].value;

    const cityName = document.getElementById("cityInput").value.trim();

    if (cityName === "") {
        alert("Please enter a city name.");
        return;
    }

    try {
        // Get latitude and longitude for the city
        const { latitude, longitude } = await getLatitudeLongitude(cityName);

        // Call loadWeatherData with the obtained coordinates, selected parameter, and interval
        loadWeatherData(selectedOption, interval, latitude, longitude);
    } catch (error) {
        console.error('Error handling selection:', error.message);
    }
}
async function loadWeatherData(parameter, interval, latitude, longitude) {
    try {
        const { timeArray, dataArray } = await fetchDataForChart(parameter, interval, latitude, longitude);
        createChart(timeArray, dataArray, parameter);
        displayStatistics(dataArray);
    } catch (error) {
        console.error('Error loading weather data:', error.message);
    }
}

async function fetchData(parameter, callback, latitude, longitude) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${parameter}&past_days=7`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();
        callback(data, parameter);
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

async function fetchDataForChart(parameter, interval, latitude, longitude) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${parameter}&past_days=${interval}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();
        const timeArray = data.hourly.time; // Extract the last 20 time data points
        const dataArray = data.hourly[parameter]; // Extract the last 20 data points
        return { timeArray, dataArray };
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return { timeArray: [], dataArray: [] };
    }
}


// Rest of your code...

function displayStatistics(dataArray) {
    document.getElementById('mean').innerText = `Mean: ${calculateMean(dataArray)}`;
    document.getElementById('median').innerText = `Median: ${calculateMedian(dataArray)}`;
    document.getElementById('mode').innerText = `Mode: ${calculateMode(dataArray)}`;
    document.getElementById('range').innerText = `Range: ${calculateRange(dataArray)}`;
    document.getElementById('standartDeviation').innerText = `Standard Deviation: ${calculateStandardDeviation(dataArray)}`;
    document.getElementById('minMax').innerText = `Min: ${calculateMinMax(dataArray).min}, Max: ${calculateMinMax(dataArray).max}`;
}

function createChart(timeArray, dataArray, parameter) {
    const ctx = document.getElementById('chart').getContext('2d');

    // Destroy previous chart if it exists
    if(window.myChart !== undefined){
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeArray,
            datasets: [{
                label: parameter,
                data: dataArray,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: parameter
                    }
                }]
            }
        }
    });
}

async function fetchDataForChart(parameter, interval, latitude, longitude) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${parameter}&past_days=${interval}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();
        const timeArray = data.hourly.time; // Extract the last 20 time data points
        const dataArray = data.hourly[parameter]; // Extract the last 20 data points
        return { timeArray, dataArray };
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return { timeArray: [], dataArray: [] };
    }
}

// Calculate Mean
function calculateMean(dataArray) {
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    return sum / dataArray.length;
}

// Calculate Median
function calculateMedian(dataArray) {
    const sortedArray = [...dataArray].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedArray.length / 2);
    if (sortedArray.length % 2 === 0) {
        return (sortedArray[middleIndex - 1] + sortedArray[middleIndex]) / 2;
    } else {
        return sortedArray[middleIndex];
    }
}

// Calculate Mode
function calculateMode(dataArray) {
    const countMap = {};
    let maxCount = 0;
    let mode;

    dataArray.forEach(value => {
        countMap[value] = (countMap[value] || 0) + 1;
        if (countMap[value] > maxCount) {
            maxCount = countMap[value];
            mode = value;
        }
    });

    return mode;
}

// Calculate Range
function calculateRange(dataArray) {
    const max = Math.max(...dataArray);
    const min = Math.min(...dataArray);
    return max - min;
}

// Calculate Standard Deviation
function calculateStandardDeviation(dataArray) {
    const mean = calculateMean(dataArray);
    const squaredDifferences = dataArray.map(value => (value - mean) ** 2);
    const variance = calculateMean(squaredDifferences);
    return Math.sqrt(variance);
}

// Calculate Min and Max
function calculateMinMax(dataArray) {
    const min = Math.min(...dataArray);
    const max = Math.max(...dataArray);
    return { min, max };
}
