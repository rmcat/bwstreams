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

function replaceTable(streams) {
    var idTableStreams = "streams";
    var newTbody = document.createElement("tbody");

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

var updater = {
    json: null,

    refreshStreams: function() {
        this.refreshStarted();
        var promise = $.getJSON('/streams.json');
        promise.done((function(data) {
            this.json = data;
            this.refreshComplete();
        }).bind(this));
    },

    refreshStarted: function() {
        $("#btn-refresh").addClass("fa-spin");
        $("#btn-refresh").addClass("active");
        timer.resetTimer();
    },

    refreshComplete: function() {
        replaceTable(this.json.streams);
        setLastUpdate(this.json.last_update);
        $.bootstrapSortable(true);
        updateOfflineVisibility();
        $("#btn-refresh").removeClass("fa-spin");
        $("#btn-refresh").removeClass("active");
    }
}

var timer = {
    timerEnabled: false,
    timerDuration: 120,
    timerElapsed: 0,
    timerId: null,

    updateTimerStatus: function() {
        this.timerEnabled = $("#checkbox-autorefresh").is(":checked");
        if (this.timerEnabled && this.timerId == null) {
            this.startTimer();
        }
    },

    resetTimer: function() {
        this.timerElapsed = 0;
    },

    stopTimer: function() {
        if (this.timerId != null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    },

    startTimer: function() {
        this.timerId = setInterval((function() {
            ++this.timerElapsed;
            if (this.timerEnabled && this.timerElapsed >= this.timerDuration) {
                updater.refreshStreams();
            }
        }).bind(this), 1000);
    }
}

jQuery(document).ready(function($) {
    updater.refreshStreams();
    timer.updateTimerStatus();

    $("#btn-refresh").click(function() {
        updater.refreshStreams();
    });

    $("#checkbox-show-offline").click(function() {
        updateOfflineVisibility();
    });

    $("#checkbox-autorefresh").click(function() {
        timer.updateTimerStatus();
    });
});
