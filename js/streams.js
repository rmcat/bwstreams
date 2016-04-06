"use strict";

var supportsLocalStorage = typeof(Storage) !== "undefined";
var settings = {
    showOffline: false,
    showRace: false,
    showViewers: true,
    showHigh: false,
    showDuration: true,
    showLastSeen: true,
    autoRefresh: true,
    resetSettings: function() {
        this.showOffline = false;
        this.showRace = false;
        this.showViewers = true;
        this.showHigh = false;
        this.showDuration: true,
        this.showLastSeen = true;
        this.autoRefresh = true;
    },
    loadSettings: function() {
        if (!supportsLocalStorage) {
            console.log("localStorage not supported");
            return;
        }
        console.log("Loading settings from localStorage");
        for (var setting in this) {
            if (!this.hasOwnProperty(setting) || typeof(this[setting]) != "boolean") {
                continue;
            }
            if (!localStorage.hasOwnProperty(setting)) {
                continue;
            }
            this[setting] = localStorage[setting] === "true";
            console.log(setting + ": " + this[setting]);
        }
    },
    saveSettings: function() {
        if (!supportsLocalStorage) {
            console.log("localStorage not supported");
            return;
        }
        console.log("Saving settings to localStorage");
        for (var setting in this) {
            if (!this.hasOwnProperty(setting) || typeof(this[setting]) != "boolean") {
                continue;
            }
            localStorage[setting] = Boolean(this[setting]);
            console.log(setting + ": " + localStorage[setting]);
        }
    },
    printSettings: function() {
        for (var setting in this) {
            if (this.hasOwnProperty(setting) && typeof(this[setting]) == "boolean") {
                console.log(setting + ": " + this[setting]);
            }
        }
    }
}

var visibilities = {
    "checkbox-show-offline": "stream-row-offline",
    "checkbox-show-race": "stream-col-race",
    "checkbox-show-viewers": "stream-col-viewers",
    "checkbox-show-high": "stream-col-high",
    "checkbox-show-duration": "stream-col-duration",
    "checkbox-show-last-seen": "stream-col-last-seen",
};

function getLastSeenStatus(isOnline, lastSeen) {
    if (isOnline) {
        return "online";
    } else if (lastSeen === null) {
        return "never seen";
    } else {
        return moment(lastSeen).fromNow();
    }
}

function replaceTable(streams, updateTime) {
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
            var raceText = race ? race : "";
            var viewers = stream["viewers"];
            var maxViewers = stream["max_viewers"];
            var isOnline = stream["online_since"] !== null;
            var durationText = "offline";
            var durationValue = 0;
            if (stream["online_since"] !== null) {
                var duration = moment.duration(moment(updateTime).diff(moment(stream["online_since"])));
                durationText = duration.humanize();
                durationValue = duration.asMinutes();
            }
            var lastSeenText = getLastSeenStatus(isOnline, stream["last_seen"]);
            var lastSeenValue = stream["last_seen"] || 0;
            var url = "http://play.afreeca.com/" + stream["id"] + "/embed";

            var cells = [
                [nickname,     { "class": [ "stream-col-nickname" ] } ],
                [raceText,     { "class": [ "stream-col-race", "text-capitalize" ] } ],
                [viewers,      { "class": [ "stream-col-viewers", "text-center" ] } ],
                [maxViewers,   { "class": [ "stream-col-high", "text-center" ] } ],
                [durationText, { "class": [ "stream-col-duration", "text-center" ], "data-value": durationValue } ],
                [lastSeenText, { "class": [ "stream-col-last-seen", "text-center" ], "data-value": lastSeenValue } ],
            ];

            var newRow = newTbody.insertRow(-1);
            newRow.classList.add(isOnline ? "stream-row-online" : "stream-row-offline");
            newRow.classList.add("race-" + (race || "none"));
            for (var i = 0; i < cells.length; i++) {
                var text = cells[i][0];
                var data = cells[i][1];
                var newCell = newRow.insertCell(-1);
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
                if (i == 0) {
                    var span = document.createElement("span");
                    span.innerHTML = "⚫ ";
                    newCell.appendChild(span);
                    var a = document.createElement("a");
                    a.href = url;
                    a.rel = "noreferrer";
                    a.appendChild(document.createTextNode(text));
                    newCell.appendChild(a);
                } else {
                    newCell.appendChild(document.createTextNode(text));
                }
            }
        }
    }

    var table = document.getElementById(idTableStreams);
    var oldTbody = document.getElementById(idTableStreams).getElementsByTagName("tbody")[0];
    table.replaceChild(newTbody, oldTbody);
}

function updateVisibility(checkboxId, className) {
    if ($("#" + checkboxId).is(":checked")) {
        $("." + className).show();
    } else {
        $("." + className).hide();
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
        replaceTable(this.json["streams"], this.json["last_update"]);
        setLastUpdate(this.json["last_update"]);
        $.bootstrapSortable(true);
        for (var checkboxId in visibilities) {
            if (visibilities.hasOwnProperty(checkboxId)) {
                updateVisibility(checkboxId, visibilities[checkboxId]);
            }
        }
        $("#btn-refresh").removeClass("fa-spin");
        $("#btn-refresh").removeClass("active");
    }
}

var timer = {
    timerEnabled: false,
    timerDuration: 60,
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
    settings.loadSettings();

    $("#btn-refresh").click(function() {
        updater.refreshStreams();
    });

    for (var checkboxId in visibilities) {
        (function() {
            var key = checkboxId;
            var value = visibilities[key];
            if (visibilities.hasOwnProperty(key)) {
                $("#" + key).click(function() {
                    updateVisibility(key, value);
                });
            }
        })();
    }

    $("#checkbox-autorefresh").click(function() {
        timer.updateTimerStatus();
    });

    updater.refreshStreams();
    timer.updateTimerStatus();
});
