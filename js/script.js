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

    $("searchForm").on("submit",function(e) {
        e.preventDeafult();

    });
    $("#tabBar").on("click", ".tab-btn" , function(){
        const tab= $(this).data("tab");

        $(".tab-btn").removeClass("active").attr("aria-selceted", "false");
        $(this).addClass("active").attr("aria-selected", "true");
        $("panel-summary").prop("hidden",tab !== "summary");
        $("panel-hourly").prop("hidden",tab !== "hourly");

    });
    

});



