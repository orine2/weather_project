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
    function formatHourLabel(isoTime) { 
        let time = isoTime.split("T")[1];
        const hour = parseInt(time.split(":") [0]);
        const period = hour < 12 ? "오전" : "오후";

        let h12= hour % 12;
        if(h12 == 0) h12 = 12;
        return period + " " +h12 + "시";
    }


    function degToCompass (deg) { 
        if(deg== null || deg === undefined) return "";

        const dirs = [
            "북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동",
            "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"
        ];

        return dirs[Math.round(deg / 22.5) % 16];
    }

    function uvLabel (uv) {
        if(uv < 3) return "낮음";
        if(uv < 6) return "보통";
        if(uv < 8) return "높음";
        if(uv < 11) return "매우 높음";
        return "위험";
    }
    

    const FALLBACK_CITIES = {
        
        '서울': { lat: 37.5665, lon: 126.9780 },
        '부산': { lat: 35.1796, lon: 129.0756 },
        '대구': { lat: 35.8714, lon: 128.6014 },
        '인천': { lat: 37.4563, lon: 126.7052 },
        '광주': { lat: 35.1595, lon: 126.8526 },
        '대전': { lat: 36.3504, lon: 127.3845 },
        '울산': { lat: 35.5384, lon: 129.3114 },
        '세종': { lat: 36.4800, lon: 127.2890 },
        '수원': { lat: 37.2636, lon: 127.0286 },
        '고양': { lat: 37.6584, lon: 126.8320 },
        '용인': { lat: 37.2411, lon: 127.1776 },
        '성남': { lat: 37.4449, lon: 127.1388 },
        '청주': { lat: 36.6424, lon: 127.4890 },
        '전주': { lat: 35.8242, lon: 127.1480 },
        '천안': { lat: 36.8151, lon: 127.1139 },
        '포항': { lat: 36.0190, lon: 129.3435 },
        '창원': { lat: 35.2281, lon: 128.6811 },
        '제주': { lat: 33.4996, lon: 126.5312 },
        '춘천': { lat: 37.8813, lon: 127.7298 },
        '강릉': { lat: 37.7519, lon: 128.8761 },
        '순천': { lat: 34.9505, lon: 127.4878 }
};



    const HOME_CITIES = ['서울', '부산', '대구', '인천', '광주', '대전', '제주', '순천'];

    function showScreen(name) {
        $("#screen-home").prop("hidden", name !== "home")
        $("#screen-detail").prop("hidden", name !== "detail")

        if(name === "home") {
            $("body"). attr("data-weather", "sunny");
        }
    }

    function openDetail(lat, lon, name) {
        
        showScreen("detail");
        loadWeather(lat, lon, name);
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
            hourly: 'temperature_2m,apparent_temperature,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,dew_point_2m,cloud_cover,visibility',
            daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
            forecast_days: 5,
            timezone:"auto"
        })
        .done(function(data) {
            renderWeather(data,dispalyName);
            renderHourly(data);
            showResult();
        })
        .fail(function() {
            showError("날씨 정보를 가져오지 못했습니다. 잠시후 다시 시도해주세요");
        })
    }
    function loadCityList() {
        const lat = HOME_CITIES.map(function(name) {return FALLBACK_CITIES[name].lat}).join(",");
        const lon = HOME_CITIES.map(function(name) {return FALLBACK_CITIES[name].lon}).join(",");

         $.getJSON("https://api.open-meteo.com/v1/forecast", {
            latitude: lat,
            longitude: lon,
            current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature",
            hourly: 'temperature_2m,apparent_temperature,weather_code,precipitation_probability,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,dew_point_2m,cloud_cover,visibility',
            daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
            forecast_days: 5,
            timezone:"auto"
         })
         .done(function(results){
            let rows="";

            let hotIdx = 0;

            let coldIdx = 0;

            for(let i = 0; i <results.length; i++) {
                const name = HOME_CITIES[i];
                const city = FALLBACK_CITIES[name];

                rows +=cityRowTML(
                    name,
                    city.lat,
                    city.lon,
                    results[i].current.weather_code,
                    results[i].current.temperature_2m
                );

                if(results[i].daily.temperature_2m_max[0] > results[hotIdx].daily.temperature_2m_max [0]) {
                    hotIdx = i;

                }
                if(results[i].daily.temperature_2m_min[0] < results[coldIdx].daily.temperature_2m_min [0]) {
                    coldIdx = i;
                }
            }


            $("#cityList").html(rows);

            const hotName = HOME_CITIES[hotIdx];
            const coldName = HOME_CITIES[coldIdx];
            const hotCity = FALLBACK_CITIES[hotName];
            const coldCity = FALLBACK_CITIES[coldName];


            $("#hotCity").data({
                name:hotName,
                lat:hotCity.lat,
                lon:hotCity.lon
            });
            $("#hotCity .extream-value")
                .html(hotName + " " + safeRound(results[hotIdx].daily.temperature_2m_max[0]) +"°");
            
            
            $("#coldCity")
            .data({name: coldName, lat:coldCity.lat, lon:coldCity.lon})
            .find(".extream-value")
            .html(coldName+ " " + safeRound(results[coldIdx].daily.temperature_2m_min[0]) + "°");

         })
         .fail(function() {alert("주요 도시 날씨를 불러오지 못했습니다.")});

        console.log(lat+ "," +lon);
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
            else label = WEEKDAY[new Date(data.daily.time[i]).getDay()];
            cards +=
            `<div class="forecast-card">
                    <p class="forecast-label">${label}</p>
                    <img src="${dayInfo.icon}" alt="" class="forecast-icon">
                    <p class="forecast-max">${Math.round(data.daily.temperature_2m_max[i])}°</p>
                    <p class="forecast-min">${Math.round(data.daily.temperature_2m_min[i])}°</p>
                    <p class="forecast-precip">☔${Math.round(data.daily.precipitation_probability_max[i])}%</p>
                </div>`
                
        }
        $("#forecastRow").html(cards);
    }
    
    function renderHourly(data) {
        const hourly = data.hourly;
        const HOURT_TO_SHOW = 12;

        let startIndex = 0;
        for(let h = 0; h < hourly.time.length; h++) {
            if(hourly.time[h] >= data.current.time) {
                startIndex =h;
                break;
            }
        }

        let rows = "";
        for(let n = 0; n< HOURT_TO_SHOW; n++) {
            const idx = startIndex + n;
            if(idx >= hourly.time.length) break;

            const info =getWeatherInfo(hourly.weather_code[idx]);

            const uv = hourly.uv_index[idx];
            const uvText = (uv === null || uv === undefined) ? "-": uv.toFixed(1) + "(" + uvLabel(uv) +")";
            const vis = hourly.visibility [idx];
            const visText = (vis === null || vis === undefined) ? "-" : (vis/1000).toFixed(1) + "km";
        

        rows +=
            `<div class="hour-row">
                <button type="button" class="hour-row-head" aria-expanded="false">
                    <span class="hour-main">
                        <span class="hour-time-col">
                            <span class="hour-time">${formatHourLabel(hourly.time[idx])}</span>
                            <span class="hour-desc">${info.label}</span>
                        </span>
                        <img src="${info.icon}" alt="" class= "hour-icon">
                        <span class="hour-temp">${safeRound(hourly.temperature_2m[idx])}°</span>
                        <span class="hour-realfeel">${safeRound(hourly.apparent_temperature[idx])}°</span>
                        <span class="hour-precip">${safeRound(hourly.precipitation_probability[idx])}%</span>
                    </span>
                    <span class="hour-side">
                        <span class="hour-chevron">▼</span>
                    </span>
                </button>

                <div class="hour-detail">
                    <div class="hour-detail-item"><span>바람</span><strong>${degToCompass(hourly.wind_direction_10m[idx])}${safeRound(hourly.wind_speed_10m[idx])}km/h</strong></div>
                    <div class="hour-detail-item"><span>습도</span><strong>${safeRound(hourly.relative_humidity_2m[idx])}%</strong></div>
                    <div class="hour-detail-item"><span>자외선지수</span><strong>${uvText}</strong></div>
                    <div class="hour-detail-item"><span>이슬점</span><strong>${safeRound(hourly.dew_point_2m[idx])}°</strong></div>
                    <div class="hour-detail-item"><span>구름량</span><strong>${safeRound(hourly.cloud_cover[idx])}%</strong></div>
                    <div class="hour-detail-item"><span>가시거리</span><strong>${visText}</strong></div>
                </div>
            </div>`
        }
        $("#hourlyList").html(rows).find(".hour-detail").hide();
    }

    function cityRowTML(name, lat, lon, weatherCode, temp) {
        const info = getWeatherInfo(weatherCode);

        return `<button type="button" class="city-row" data-name="${name}" data-lat="${lat}" data-lon="${lon}">
                        <span class="city-row-name">${name}</span>
                        <span class="city-row-weather">
                            <img src="${info.icon}" alt="" class="city-row-icon">
                            <span class="city-row-temp">${safeRound(temp)}℃</span>
                            <span class="city-row-chevron"></span>
                        </span>
                    </button>`
    }

    function showResult() {
        $("#statusMsg").prop("hidden",true);
        $("#tabBar").prop("hidden",false);

        const activeTab= $(".tab-btn.active").data("tab") || "summary";
        $("#panel-summary").prop("hidden", activeTab !== "summary");
        $("#panel-hourly").prop("hidden", activeTab !== "hourly");
    }

    function searchCity(rawQuery) {
        const query =$.trim(rawQuery);
        if(!query) return;
        
        
        if(FALLBACK_CITIES[query]) {
            const c= FALLBACK_CITIES[query];
            $("#cityInput").val("");
            openDetail(c.lat, c.lon, query);
            return;
        }

        showScreen("detail");
        showStatus(`"${query}"`);
        
        $.getJSON("https://gecording.")
        
    }

    
    
    
    $("#searchForm").on("submit",function(e) {
        e.preventDefault();
        searchCity($("#cityInput"). val());

    });

    $(".page-content").on("click",".city-row, .extream-card", function (){
        const btn = $(this);
        openDetail(btn.data("lat"), btn.data("lon"),btn.data("name"));
        console.log([btn.data("lat"), btn.data("lon"),btn.data("name")]);
    })


    $("#backBtn").on("click", function() {
        showScreen("home");
        loadCityList();
    });
    $("#tabBar").on("click", ".tab-btn" , function(){
        const tab= $(this).data("tab");

        $(".tab-btn").removeClass("active").attr("aria-selceted", "false");
        $(this).addClass("active").attr("aria-selected", "true");
        $("#panel-summary").prop("hidden",tab !== "summary");
        $("#panel-hourly").prop("hidden",tab !== "hourly");

    });

    $("#hourlyList").on("click", ".hour-row-head", function() {
        const row = $(this).closest(".hour-row");
        row.toggleClass("open");
        $(this).attr("aria-expanded", row.hasClass("open") ? "true" : "false");
        row.find(".hour-detail").slideToggle(150);

    });

  //  loadWeather( 35.1796, 129.0756 , "부산");

//35.1796, lon: 129.0756 

    showScreen("home");
    loadCityList();

});



