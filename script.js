$(document).ready(function() {

  // -------------------------------------------------------------
  // 1. HEADLINE FEATURE: Philippine Regions & Sub-Cities (PSGC API)
  // -------------------------------------------------------------
  function loadPhRegions() {
    $("#regions-container").html('<p class="loading-state">Fetching Philippine regions data...</p>');

    $.getJSON("https://psgc.gitlab.io/api/regions/", function(regionsArray) {
      $("#regions-container").empty();

      regionsArray.forEach(function(region) {
        $("#regions-container").append(`
          <div class="region-card" data-code="${region.code}">
            <h4>${region.name}</h4>
            <p><strong>Code Name:</strong> ${region.regionName}</p>
            <p><strong>PSGC Code:</strong> ${region.code}</p>
            <span class="click-hint">👇 Click to view cities & municipalities</span>
            <div class="cities-container"></div>
          </div>
        `);
      });

      $(".region-card").on("click", function() {
        var regionCode = $(this).attr("data-code");
        var citiesBox = $(this).find(".cities-container");

        if (citiesBox.children().length > 0) {
          citiesBox.empty();
        } else {
          citiesBox.html('<p class="loading-state">Loading cities...</p>');

          var citiesUrl = "https://psgc.gitlab.io/api/regions/" + regionCode + "/cities-municipalities/";

          $.getJSON(citiesUrl, function(citiesArray) {
            citiesBox.empty();

            if (citiesArray.length === 0) {
              citiesBox.append('<p class="widget-desc">No cities found under this region.</p>');
            } else {
              citiesBox.append('<div class="cities-list-box"><strong>Localities:</strong><br></div>');
              
              citiesArray.forEach(function(city) {
                citiesBox.find(".cities-list-box").append(`
                  <span class="city-tag">${city.name}</span>
                `);
              });
            }
          })
          .fail(function() {
            citiesBox.html('<p class="error-state">Failed to load cities.</p>');
          });
        }
      });

    })
    .fail(function() {
      $("#regions-container").html('<p class="error-state">Failed to load Philippine regions.</p>');
    });
  }

  loadPhRegions();
  $("#btn-load-regions").on("click", function() {
    loadPhRegions();
  });


  // -------------------------------------------------------------
  // 2. WIDGET 1: City Live Weather Search (Open-Meteo Geocoding + Weather API)
  // -------------------------------------------------------------
  function fetchWeatherForCity(cityName) {
    $("#weather-content").html('<p class="loading-state">Searching coordinates for ' + cityName + '...</p>');

    var geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(cityName) + "&count=1";

    $.getJSON(geoUrl, function(geoData) {
      if (!geoData.results || geoData.results.length === 0) {
        $("#weather-content").html('<p class="error-state">City not found. Try "Manila", "Cebu", or "Davao".</p>');
      } else {
        var place = geoData.results[0];
        var lat = place.latitude;
        var lng = place.longitude;
        var fullName = place.name + ", " + (place.country || "PH");

        var weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng + "&current=temperature_2m,wind_speed_10m";

        $.getJSON(weatherUrl, function(weatherData) {
          $("#weather-content").empty();

          var currentWeather = [weatherData.current];

          currentWeather.forEach(function(current) {
            $("#weather-content").append(`
              <p style="font-size: 1.8rem; font-weight: bold; color: #0038a8;">${current.temperature_2m} °C</p>
              <p class="widget-desc"><strong>Location:</strong> ${fullName}</p>
              <p class="widget-desc"><strong>Wind Speed:</strong> ${current.wind_speed_10m} km/h</p>
            `);
          });
        })
        .fail(function() {
          $("#weather-content").html('<p class="error-state">Failed to load weather data.</p>');
        });
      }
    })
    .fail(function() {
      $("#weather-content").html('<p class="error-state">Geocoding service unavailable.</p>');
    });
  }

  fetchWeatherForCity("Manila");

  $("#btn-search-weather").on("click", function() {
    var query = $("#weather-city-input").val();
    if (query === "") {
      $("#weather-content").html('<p class="error-state">Please enter a city name first!</p>');
    } else {
      fetchWeatherForCity(query);
    }
  });


  // -------------------------------------------------------------
  // 3. WIDGET 2: Real Travel Photo Search (Openverse API)
  // -------------------------------------------------------------
  $("#btn-search-photo").on("click", function() {
    var searchQuery = $("#photo-input").val();

    if (searchQuery === "") {
      $("#photo-results").html('<p class="error-state">Please enter a location name first!</p>');
    } else {
      $("#photo-results").html('<p class="loading-state">Searching Openverse for real travel photos...</p>');

      var apiUrl = "https://api.openverse.org/v1/images/?q=" + encodeURIComponent(searchQuery) + "&page_size=1";

      $.getJSON(apiUrl, function(data) {
        $("#photo-results").empty();

        var imagesArray = data.results;

        if (imagesArray.length === 0) {
          $("#photo-results").html('<p class="error-state">No photos found. Try "Boracay" or "Palawan".</p>');
        } else {
          imagesArray.forEach(function(imgItem) {
            $("#photo-results").append(`
              <img src="${imgItem.url}" alt="${imgItem.title}" class="travel-img" onerror="this.src='https://picsum.photos/400/250'">
              <p><strong>${imgItem.title || searchQuery}</strong></p>
              <p class="widget-desc">Source: Openverse Public Library</p>
            `);
          });
        }
      })
      .fail(function() {
        $("#photo-results").html('<p class="error-state">Could not connect to photo search service.</p>');
      });
    }
  });


  // -------------------------------------------------------------
  // 4. WIDGET 3: Philippine Retail Fuel & LPG Prices
  // -------------------------------------------------------------
  function loadPhFuelPrices() {
    $("#fuel-content").html('<p class="loading-state">Fetching retail fuel rates...</p>');

    var fuelData = [
      { type: "Unleaded Gasoline (91)", price: "₱64.50 / L" },
      { type: "Premium Gasoline (95)", price: "₱69.80 / L" },
      { type: "Diesel Fuel", price: "₱58.20 / L" },
      { type: "Kerosene", price: "₱72.10 / L" },
      { type: "LPG Tank (11kg)", price: "₱940.00 / tank" }
    ];

    $("#fuel-content").empty();
    $("#fuel-content").append('<p class="widget-desc"><strong>Estimated PH Retail Averages:</strong></p>');

    fuelData.forEach(function(item) {
      $("#fuel-content").append(`
        <div class="list-row">
          <span><strong>${item.type}:</strong></span>
          <span class="price-tag">${item.price}</span>
        </div>
      `);
    });
  }

  loadPhFuelPrices();
  $("#btn-refresh-fuel").on("click", function() {
    loadPhFuelPrices();
  });


  // -------------------------------------------------------------
  // 5. WIDGET 4: UP High-Res Hazard Maps Dataset (eGov PH & UP NOAH)
  // Rendered using .forEach() loop & .append()
  // -------------------------------------------------------------
  function loadPhHazardData() {
    $("#hazard-content").html('<p class="loading-state">Loading hazard parameters...</p>');

    var hazardLayers = [
      { hazard: "Flood Hazard Map", level: "5, 25, 100-Yr Return" },
      { hazard: "Landslide Susceptibility", level: "Debris & Shallow" },
      { hazard: "Storm Surge Inundation", level: "Level 1 to 4" },
      { hazard: "Tsunami Hazard Zone", level: "Coastal Advisory" }
    ];

    $("#hazard-content").empty();

    hazardLayers.forEach(function(item) {
      $("#hazard-content").append(`
        <div class="list-row">
          <span><strong>${item.hazard}:</strong></span>
          <span class="hazard-badge">${item.level}</span>
        </div>
      `);
    });
  }

  loadPhHazardData();


  // -------------------------------------------------------------
  // 6. WIDGET 5: Emergency Hotlines Dataset
  // -------------------------------------------------------------
  function loadPhEmergencyHotlines() {
    $("#hotlines-content").html('<p class="loading-state">Loading emergency contacts...</p>');

    var hotlinesData = [
      { name: "National Emergency", number: "911" },
      { name: "Red Cross Emergency", number: "143" },
      { name: "Philippine National Police", number: "117" },
      { name: "Bureau of Fire Protection", number: "(02) 8426-0219" },
      { name: "NDRRMC Disaster Center", number: "(02) 8911-1406" }
    ];

    $("#hotlines-content").empty();

    hotlinesData.forEach(function(item) {
      $("#hotlines-content").append(`
        <div class="list-row">
          <span><strong>${item.name}</strong></span>
          <span class="hotline-badge-num">${item.number}</span>
        </div>
      `);
    });
  }

  loadPhEmergencyHotlines();
  $("#btn-refresh-hotlines").on("click", function() {
    loadPhEmergencyHotlines();
  });

});