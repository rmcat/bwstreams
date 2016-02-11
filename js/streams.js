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

function createTableHeader(colHeaders) {
    var tr = document.createElement("tr");
    for (var i in colHeaders) {
        var th = document.createElement("th");
        th.appendChild(document.createTextNode(colHeaders[i]));
        tr.appendChild(th);
    }
    return tr;
}

function capitalizeWord(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createStreamTable() {
    loadJSON(function(response) {
        var json = JSON.parse(response);
        var oldTable = document.getElementById(streamTableId);
        var newTable = oldTable.cloneNode();
        newTable.appendChild(createTableHeader(["Streamer", "Race", "Viewers", "High", "Last Seen"]));
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

                var tr = document.createElement("tr");
                var td = document.createElement("td");
                td.appendChild(document.createTextNode(nickname));
                tr.appendChild(td);
                td = document.createElement("td");
                td.appendChild(document.createTextNode(race));
                tr.appendChild(td);
                td = document.createElement("td");
                td.appendChild(document.createTextNode(viewers));
                tr.appendChild(td);
                td = document.createElement("td");
                td.appendChild(document.createTextNode(maxViewers));
                tr.appendChild(td);
                td = document.createElement("td");
                td.appendChild(document.createTextNode(lastSeen));
                tr.appendChild(td);
                newTable.appendChild(tr);
            }
        }
        oldTable.parentNode.replaceChild(newTable, oldTable);
    });
}

function clearTable() {
    var table = document.getElementById(streamTableId);
    var rows = table.rows;
    var i = rows.length;
    while (--i > 0) {
        table.deleteRow(i);
    }
}

createStreamTable();

