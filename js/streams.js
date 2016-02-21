"use strict";

function getLastSeenStatus(isOnline, lastSeen) {
    if (isOnline) {
        return "Now";
    } else if (lastSeen === null) {
        return "Never";
    } else {
        return moment(lastSeen).fromNow();
    }
}

function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", "/streams.json", true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

function refreshStreams() {
    refreshStarted();
    loadJSON(function(response) {
        var hideOffline = $(".offline").size() > 0 && $(".offline :hidden").size() > 0;

        var newTbody = document.createElement("tbody");

        var json = JSON.parse(response);
        var streams = json.streams;
        for (var key in streams) {
            if (key.substring(0, 8) != "afreeca_") {
                continue;
            }
            if (streams.hasOwnProperty(key)) {
                var stream = streams[key];
                var game = stream["game"];
                if (game != "brood war") {
                    continue;
                }

                var nickname = stream["nickname"];
                var race = stream["game_info"]["race"];
                var viewers = stream["viewers"];
                var maxViewers = stream["max_viewers"];
                var isOnline = stream["online_since"] !== null;
                var lastSeenText = getLastSeenStatus(isOnline, stream["last_seen"]);
                var lastSeenValue = stream["last_seen"] || 0;
                var url = "http://play.afreeca.com/" + stream["id"] + "/embed";

                var cells = [
                    [nickname, { "class": [ "race-" + (race || "none") ] }],
                    [race, { "class": [ "text-capitalize" ] } ],
                    [viewers, { "class": [ "text-right" ] } ],
                    [maxViewers, { "class": [ "text-right" ] } ],
                    [lastSeenText, { "class": [ "text-center" ], "data-value": lastSeenValue } ],
                ];

                var newRow = newTbody.insertRow(-1);
                newRow.classList.add(isOnline ? "online" : "offline");
                newRow.classList.add("race-" + (race || "none"));
                for (var i = 0; i < cells.length; i++) {
                    var text = cells[i][0];
                    var data = cells[i][1];
                    var newCell = newRow.insertCell(-1);
                    var linkText = document.createTextNode(text);
                    if (data !== null) {
                        for (var key in data) {
                            if (data.hasOwnProperty(key)) {
                                if (key === "class") {
                                    for (var j = 0; j < data[key].length; j++) {
                                        newCell.classList.add(data[key][j]);
                                    }
                                } else if (key.slice(0, 5) === "data-") {
                                    newCell.setAttribute(key, data[key]);
                                }
                            }
                        }
                    }
                    var a = document.createElement("a");
                    a.href = url;
                    a.appendChild(linkText);
                    newCell.appendChild(a);
                }
            }
        }

        var idTableStreams = "streams";
        var table = document.getElementById(idTableStreams);
        var oldTbody = document.getElementById(idTableStreams).getElementsByTagName("tbody")[0];
        table.replaceChild(newTbody, oldTbody);

        $.bootstrapSortable(true);

        refreshComplete(json.last_update);
    });
}

function refreshStarted() {
    $("#btn-refresh").addClass("fa-spin");
    $("#btn-refresh").addClass("active");
}

function refreshComplete(lastUpdateTimeStr) {
    updateOfflineVisibility();
    $("#btn-refresh").removeClass("fa-spin");
    $("#btn-refresh").removeClass("active");
    setLastUpdate(lastUpdateTimeStr);
}

function updateOfflineVisibility() {
    if ($("#checkbox-show-offline").is(":checked")) {
        $(".offline").show();
    } else {
        $(".offline").hide();
    }
}

function setLastUpdate(timeStr) {
    $("#text-last-updated").text(moment(timeStr).format("lll"));
}

var timerEnabled = false;
var timerDuration = 120;
var timerElapsed = 0;
var timerId = null;

function updateTimerStatus() {
    timerEnabled = $("#checkbox-autorefresh").is(":checked");
    if (timerEnabled && timerId == null) {
        startTimer();
    }
}

function resetTimer() {
    timerElapsed = 0;
}

function stopTimer() {
    if (timerId != null) {
        clearInterval(timerId);
        timerId = null;
    }
}

function startTimer() {
    timerId = setInterval(function() {
        ++timerElapsed;
        if (timerEnabled && timerElapsed >= timerDuration) {
            refreshStreams();
        }
    }, 1000);
}

jQuery(document).ready(function($) {
    refreshStreams();
    updateTimerStatus();

    $("#btn-refresh").click(refreshStreams);

    $("#checkbox-show-offline").click(updateOfflineVisibility);

    $("#checkbox-autorefresh").click(updateTimerStatus);
});
