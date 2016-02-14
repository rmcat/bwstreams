"use strict";

var idTableStreams = "streams";


function getTimeSince(date) {
    function getTimeString(unit, unitName) {
        if (unit != 1) {
            unitName = unitName + "s";
        }
        return unit + " " + unitName + " ago";
    }
    var now = new Date();
    var delta = now - date;
    var seconds = Math.floor(delta / (1000));
    if (seconds < 60) {
        return getTimeString(seconds, "second");
    }
    var minutes = Math.floor(delta / (1000 * 60));
    if (minutes < 60) {
        return getTimeString(minutes, "minute");
    }
    var hours = Math.floor(delta / (1000 * 60 * 60));
    if (hours < 24) {
        return getTimeString(hours, "hour");
    }
    var days = Math.floor(delta / (1000 * 60 * 60 * 24));
    return getTimeString(days, "day");
}

function getLastSeenStatus(isOnline, lastSeen) {
    if (isOnline) {
        return "Now";
    } else if (lastSeen === null) {
        return "Never";
    } else {
        return getTimeSince(new Date(lastSeen));
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

        var table = document.getElementById(idTableStreams);
        var oldTbody = document.getElementById(idTableStreams).getElementsByTagName("tbody")[0];
        table.replaceChild(newTbody, oldTbody);

        $.bootstrapSortable(true);

        if (hideOffline) {
            $(".offline").hide();
        }
    });
}

jQuery(document).ready(function($) {
    refreshStreams();

    $("#btn-refresh").click(refreshStreams);

    $("#btn-toggle-offline").click(function() {
        $(".offline").toggle();
    });

    $("#btn-debug").click(function() {
        // Debug
    });
});
