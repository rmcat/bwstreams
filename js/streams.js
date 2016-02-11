var streamTableId = "streams_table";

function getTimeSince(date) {
    var now = new Date();
    var delta = now - date;
    var days = Math.floor(delta / (1000 * 60 * 60 * 24));
    var hours = Math.floor(delta / (1000 * 60 * 60));
    var minutes = Math.floor(delta / (1000 * 60));
    var seconds = Math.floor(delta / (1000));
    if (days > 6) {
        return date.toDateString().slice(4);
    } else if (days >= 1) {
        return days + " days ago";
    } else if (hours > 0) {
        return hours + " hours ago";
    } else if (minutes > 0) {
        return minutes + " minutes ago";
    } else {
        return seconds + " seconds ago";
    }
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
                var info = streams[key];
                var game = info["game"];
                if (game != "brood war") {
                    continue;
                }

                var nickname = info["nickname"];
                var race = capitalizeWord(info["game_info"]["race"]);
                var viewers = info["viewers"];
                var maxViewers = info["max_viewers"];
                var isOnline = info["online_since"] !== null;
                var lastSeen = getLastSeenStatus(isOnline, info["last_seen"]);
                var id = info["id"];
                var url = "http://play.afreeca.com/" + id + "/embed"

                var newRow = newTbody.insertRow(-1);
                var rowText = [ nickname, race, viewers, maxViewers, lastSeen ];
                for (var i = 0; i < rowText.length; i++)
                {
                    var textNode = document.createTextNode(rowText[i]);
                    var newCell = newRow.insertCell(-1);
                    newCell.appendChild(textNode);
                }
            }
        }

        var table = document.getElementById(streamTableId);
        var oldTbody = document.getElementById(streamTableId).getElementsByTagName("tbody")[0];

        table.replaceChild(newTbody, oldTbody);
    });
}

createStreamTable();

