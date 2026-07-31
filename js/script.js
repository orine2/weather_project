$(function () {
    function getWeatherInfo(code) {
        if (code === 0) return { icon: 'icons/clear-day.svg', label: '맑음', theme: 'sunny' };
        if (code === 1) return { icon: 'icons/partly-cloudy-day.svg', label: '대체로 맑음', theme: 'sunny' };
        if (code === 2) return { icon: 'icons/cloudy.svg', label: '구름 조금', theme: 'cloudy' };
        if (code === 3) return { icon: 'icons/overcast.svg', label: '흐림', theme: 'cloudy' };
        if (code === 45 || code === 48) return { icon: 'icons/fog.svg', label: '안개', theme: 'foggy' };
        if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
            return { icon: 'icons/rain.svg', label: '비', theme: 'rainy' };
        }
        if ([71, 73, 75, 77, 85, 86].includes(code)) {
            return { icon: 'icons/snow.svg', label: '눈', theme: 'snowy' };
        }
        if ([95, 96, 99].includes(code)) {
            return { icon: 'icons/thunderstorms.svg', label: '뇌우', theme: 'thunder' };
        }
        return { icon: 'icons/thermometer.svg', label: '알 수 없음', theme: 'sunny' };
    }
    function safeRound(value, suffix) {
        if(value === null || value === undefined) return '-';
        return Math.round(value) + (suffix || "") ;
    }
    function formatClock(isoTIme) {
        return isoTIme.split("T")[1];
    }

    
    function showStatus(msg) {
        $("#statusMsg").text(msg).prop("hidden", false);
        $("#tabBar").prop("hidden",true);
        $("#panel-summary").prop("hidden",true);
        $("#panel-hourly").prop("hidden",true)
    }
    function showError(msg) {
        showStatus(" 🚨" +msg);
    }

    function loadWeather(lat, lon, dispalyName) {
        showStatus("날씨 정보를 불러오는 중입니다......");

        $.getJSON("https://api.open-meteo.com/v1/forecast", {
            latitude: lat,
            longitude: lon,
            current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature",
            daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
            forecast_days: 5,
            timezone:"auto"
        })
        .done(function(data) {
            renderWeather(data,dispalyName);
            showResult();
        })
        .fail(function() {
            showError("날씨 정보를 가져오지 못했습니다. 잠시후 다시 시도해주세요");
        })
    }

    function renderWeather(data,dispalyName) {
        console.log(data);

        const cur= data.current;
        const info= getWeatherInfo(cur.weather_code);
        console.log(info);

        $("body").data("data-weather", info.theme);

        $('#locationName').text(dispalyName);
        
        $('#updatedTime').text(cur.time.replace('T',' ') + ' 기준');

        $('#weatherIcon').attr('src', info.icon);
        $('#temperature').text(Math.round(cur.temperature_2m) + '°');
        $('#weatherDesc').text(info.label);
        $('#feelslike').text(Math.round(cur.apparent_temperature) + '°');
        $('#humidity').text(Math.round(cur.relative_humidity_2m) + '%');
        $('#windspeed').text(Math.round(cur.wind_speed_10m) + 'km/h');
        $('#preciprob').text(safeRound(data.daily.precipitation_probability_max[0], '%'));
        $('#sunriseTime').text(formatClock(data.daily.sunrise[0]));
        $('#sunsetTime').text(formatClock(data.daily.sunset[0]));


        const WEEKDAY =["일","월","화","수","목","금","토"];

        let cards="";

        for(let i = 0; i <data.daily.time.length; i++) {
            const dayInfo = getWeatherInfo(data.daily.weather_code[i]);
            let label="";
            if(i ===0) label = "오늘";
            else if(i=== 1) label = "내일";
            else WEEKDAY[new Date(data.daily.time[i]).getDay()];
            cards +=
        
            `<div class="forecast-card">
                    <p class="forecast-label">오늘</p>
                    <img src="${dayInfo.icon}" alt="" class="forecast-icon">
                    <p class="forecast-max">${Math.round(data.daily.temperature_2m_max[i])}°</p>
                    <p class="forecast-min">${Math.round(data.daily.temperature_2m_min[i])}°</p>
                    <p class="forecast-precip">☔${Math.round(data.daily.precipitation_probability_max[i])}%</p>
                </div>`
                
        }
        $("#forecastRow").html(cards);



    }

    function showResult() {
        $("#statusMsg").prop("hidden",true);
        $("#tabBar").prop("hidden",false);

        const activeTab= $(".tab-btn.active").data("tab") || "summary";
        $("#panel-summary").prop("hidden", activeTab !== "summary");
        $("#panel-hourly").prop("hidden", activeTab !== "hourly");
    }

    loadWeather( 37.5665, 126.9780, "서울");

    $("searchForm").on("submit",function(e) {
        e.preventDeafult();

    });
    $("#tabBar").on("click", ".tab-btn" , function(){
        const tab= $(this).data("tab");

        $(".tab-btn").removeClass("active").attr("aria-selceted", "false");
        $(this).addClass("active").attr("aria-selected", "true");
        $("#panel-summary").prop("hidden",tab !== "summary");
        $("#panel-hourly").prop("hidden",tab !== "hourly");

    });

    
    

});



