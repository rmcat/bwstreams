"use strict";

var supportsLocalStorage = typeof(Storage) !== "undefined";
var settings = {
    showRowRaceNone: true,
    showRowRaceProtoss: true,
    showRowRaceTerran: true,
    showRowRaceZerg: true,
    showRowOffline: false,
    showColRace: false,
    showColViewers: true,
    showColPeak: false,
    showColDuration: true,
    showColLastSeen: false,
    autoRefresh: true,
    useFullScreenLinks: false,

    keys: (function() {
        return Object.keys(this).filter(s => typeof(this[s]) == "boolean")
    }),

    visibilityKeys: (function() {
        return this.keys().filter(s => s.substring(0, 4) === "show");
    }),

    loadSettings: function() {
        //console.log("loadSettings");
        var settingKeys = this.keys();
        for (var i = 0; i < settingKeys.length; i++) {
            var setting = settingKeys[i];
            if (supportsLocalStorage && localStorage.hasOwnProperty(setting)) {
                this[setting] = localStorage[setting] === "true";
            }
            var checkboxId = this.settingToCheckboxId(setting);
            var element = $("#" + checkboxId);
            //console.log(setting + ": " + localStorage[setting]);
            if (element.length && element.is(":checked") !== this[setting])
            {
                element.click();
                //console.log("Fired click event");
            }
        }
    },

    saveSettings: function() {
        if (!supportsLocalStorage) {
            //console.log("localStorage not supported");
            return;
        }
        //console.log("saveSettings");
        var settingKeys = this.keys();
        for (var i = 0; i < settingKeys.length; i++) {
            var setting = settingKeys[i];
            localStorage[setting] = Boolean(this[setting]);
            //console.log(setting + ": " + localStorage[setting]);
        }
    },

    settingToCheckboxId: function(s) {
        return "checkbox-" + s.replace(/([A-Z])/g, function (x, y){return "-" + y.toLowerCase()}).replace(/^-/, "");
    },

    settingToClassName: function(s) {
        switch (s) {
            case "showRowRaceNone":
                return "race-none";
            case "showRowRaceProtoss":
                return "race-protoss";
            case "showRowRaceTerran":
                return "race-terran";
            case "showRowRaceZerg":
                return "race-zerg";
            case "showRowOffline":
                return "stream-row-offline";
            case "showColRace":
                return "stream-col-race";
            case "showColViewers":
                return "stream-col-viewers";
            case "showColPeak":
                return "stream-col-peak";
            case "showColDuration":
                return "stream-col-duration";
            case "showColLastSeen":
                return "stream-col-last-seen";
            default:
                throw "Unknown value in switch statement: " + setting;
        }
    },
    
    callback: function(setting) {
        if (setting === "autoRefresh") {
            timer.updateTimerStatus();
            return;
        }

        if (setting === "useFullScreenLinks") {
            $("a.stream-link").each(function() {
                var streamLink = $(this).attr("href");
                var streamId = streamLink.split("/")[3];
                var updatedStreamLink = getStreamUrl(streamId, settings["useFullScreenLinks"]);
                $(this).attr("href", updatedStreamLink);
            });
            return;
        }
        
        var className = this.settingToClassName(setting); 
        if (this[setting]) {
            if (setting === "showRowOffline") {
                var showRaceSettings = this.keys().filter(s => s.substring(0, 11) === "showRowRace");
                for (var i = 0; i < showRaceSettings.length; i++) {
                    var showRateSetting = showRaceSettings[i];
                    if (this[showRateSetting]) {
                        var query = "." + className + "." + this.settingToClassName(showRateSetting);
                        $(query).show();
                    }
                }
            } else if (setting.substring(0, 11) === "showRowRace" && !this["showRowOffline"]) {
                $("." + className + ".stream-row-online").show();
            } else {
                $("." + className).show();
            }
        } else {
            $("." + className).hide();
        }
    }
};

function getStreamUrl(streamId, useFullScreenLink) {
    var url = "http://play.afreecatv.com/" + streamId;
    if (useFullScreenLink) {
        url += "/embed";
    }
    return url;
}

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
            var url = getStreamUrl(stream["id"], settings["useFullScreenLinks"]);

            var cells = [
                [nickname,     { "class": [ "stream-col-nickname" ] } ],
                [raceText,     { "class": [ "stream-col-race", "text-capitalize" ] } ],
                [viewers,      { "class": [ "stream-col-viewers", "text-center" ] } ],
                [maxViewers,   { "class": [ "stream-col-peak", "text-center" ] } ],
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
                    span.innerHTML = "● ";
                    newCell.appendChild(span);
                    var a = document.createElement("a");
                    a.href = url;
                    a.rel = "noreferrer";
                    a.classList.add("stream-link");
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
        $("#icon-refresh").addClass("fa-spin");
        $("#icon-refresh").addClass("active");
        timer.resetTimer();
    },

    refreshComplete: function() {
        replaceTable(this.json["streams"], this.json["last_update"]);
        setLastUpdate(this.json["last_update"]);
        $.bootstrapSortable(true);
        var visibilitySettings = settings.visibilityKeys();
        for (var i = 0; i < visibilitySettings.length; i++) {
            settings.callback(visibilitySettings[i]);
        }
        $("#icon-refresh").removeClass("fa-spin");
        $("#icon-refresh").removeClass("active");
    }
}

var timer = {
    timerDuration: 60,
    timerElapsed: 0,
    timerId: null,

    updateTimerStatus: function() {
        if (settings.autoRefresh && this.timerId == null) {
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
            if (settings.autoRefresh && this.timerElapsed >= this.timerDuration) {
                updater.refreshStreams();
            }
        }).bind(this), 1000);
    }
}

jQuery(document).ready(function($) {
    $("#btn-refresh").click(function() {
        updater.refreshStreams();
    });

    var visibilitySettings = settings.visibilityKeys();
    for (var i = 0; i < visibilitySettings.length; i++) {
        (function() {
            var setting = visibilitySettings[i];
            var checkboxId = settings.settingToCheckboxId(setting);
            $("#" + checkboxId).click(function() {
                settings[setting] = $("#" + checkboxId).is(":checked");
                settings.callback(setting);
            });
        })();
    }

    $("#checkbox-auto-refresh").click(function() {
        settings["autoRefresh"] = $("#checkbox-auto-refresh").is(":checked");
        settings.callback("autoRefresh");
    });

    $("#checkbox-use-full-screen-links").click(function() {
        settings["useFullScreenLinks"] = $("#checkbox-use-full-screen-links").is(":checked");
        settings.callback("useFullScreenLinks");
    });

    settings.loadSettings();

    watch(settings, settings.keys(), function(){
        settings.saveSettings();
    });

    updater.refreshStreams();
});
