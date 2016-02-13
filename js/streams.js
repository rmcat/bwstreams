var streamTableId = "streams_table";

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
    if (hours < 60) {
        return getTimeString(hours, "hour");
    }
    var days = Math.floor(delta / (1000 * 60 * 60 * 24));
    return getTimeString(days, "day");
}

function getLastSeenStatus(onlineSince, lastSeen) {
    if (lastSeen === null) {
        return "Never";
    } else if (onlineSince !== null) {
        return "Now";
    } else {
        return getTimeSince(new Date(lastSeen));
    }
}

var streamList = (function() {
    var displayHidden = false;
});

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

function capitalizeWord(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createStreamTable() {
    loadJSON(function(response) {
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
                var race = capitalizeWord(stream["game_info"]["race"]);
                var viewers = stream["viewers"];
                var maxViewers = stream["max_viewers"];
                var lastSeenText = getLastSeenStatus(stream["online_since"], stream["last_seen"]);
                var lastSeenValue = stream["last_seen"] === null ? 0 : stream["last_seen"];
                var url = "http://play.afreeca.com/" + stream["id"] + "/embed";

                var textValueList = [
                    [nickname, null],
                    [race, null],
                    [viewers, null],
                    [maxViewers, null],
                    [lastSeenText, lastSeenValue],
                ];

                var newRow = newTbody.insertRow(-1);
                for (var i = 0; i < textValueList.length; i++) {
                    var text = textValueList[i][0];
                    var value = textValueList[i][1];
                    var newCell = newRow.insertCell(-1);
                    var textNode = document.createTextNode(text);
                    if (value !== null) {
                        newCell.setAttribute("data-value", value);
                    }
                    newCell.appendChild(textNode);
                }
            }
        }

        var table = document.getElementById(streamTableId);
        var oldTbody = document.getElementById(streamTableId).getElementsByTagName("tbody")[0];
        table.replaceChild(newTbody, oldTbody);

        $.bootstrapSortable(false);
    });
}

createStreamTable();

