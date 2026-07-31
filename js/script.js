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

    function showScreen(name) {
        $("screen-home").prop("hidden", name !== "home")
        $("screen-detail").prop("hidden", name !== "detail")

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

    function showResult() {
        $("#statusMsg").prop("hidden",true);
        $("#tabBar").prop("hidden",false);

        const activeTab= $(".tab-btn.active").data("tab") || "summary";
        $("#panel-summary").prop("hidden", activeTab !== "summary");
        $("#panel-hourly").prop("hidden", activeTab !== "hourly");
    }

    

    $("searchForm").on("submit",function(e) {
        e.preventDeafult();

    });


    $("#backBtn").on("click", function() {
        showScreen("home");
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

});



