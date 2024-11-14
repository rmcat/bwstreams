"use strict";

var supportsLocalStorage = typeof Storage !== "undefined";
var settings = {
  showRowRaceNone: true,
  showRowRaceProtoss: true,
  showRowRaceTerran: true,
  showRowRaceZerg: true,
  showRowOffline: false,
  showColRace: false,
  showColViewers: true,
  showColDuration: true,

  keys: function () {
    return Object.keys(this).filter((s) => typeof this[s] == "boolean");
  },

  visibilityKeys: function () {
    return this.keys().filter((s) => s.substring(0, 4) === "show");
  },

  loadSettings: function () {
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
      if (element.length && element.is(":checked") !== this[setting]) {
        element.click();
        //console.log("Fired click event");
      }
    }
  },

  saveSettings: function () {
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

  settingToCheckboxId: function (s) {
    return (
      "checkbox-" +
      s
        .replace(/([A-Z])/g, function (x, y) {
          return "-" + y.toLowerCase();
        })
        .replace(/^-/, "")
    );
  },

  settingToClassName: function (s) {
    switch (s) {
      case "showRowRaceNone":
        return "race-caster";
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

  callback: function (setting) {
    var className = this.settingToClassName(setting);
    if (this[setting]) {
      if (setting === "showRowOffline") {
        var showRaceSettings = this.keys().filter(
          (s) => s.substring(0, 11) === "showRowRace"
        );
        for (var i = 0; i < showRaceSettings.length; i++) {
          var showRateSetting = showRaceSettings[i];
          if (this[showRateSetting]) {
            var query =
              "." + className + "." + this.settingToClassName(showRateSetting);
            $(query).show();
          }
        }
      } else if (
        setting.substring(0, 11) === "showRowRace" &&
        !this["showRowOffline"]
      ) {
        $("." + className + ".stream-row-online").show();
      } else {
        $("." + className).show();
      }
    } else {
      $("." + className).hide();
    }
  },
};

function replaceTable(streams, updateTime) {
  var idTableStreams = "streams";
  var newTbody = document.createElement("tbody");

  let idCounter = 0;
  for (var stream of streams) {
    if (stream["alias"] === "") {
      continue;
    }
    var nickname = stream["alias"];
    var race = stream["race"];
    var raceText = race ? race : "";
    var viewers = stream["viewers"];
    var isOnline = stream["startTime"] !== null;
    var durationText = "offline";
    var durationValue = 0;
    if (stream["startTime"] !== null) {
      var duration = moment.duration(
        moment(updateTime).diff(moment(stream["startTime"]))
      );
      durationText = duration.humanize();
      durationValue = duration.asMinutes();
    }
    var url = stream["link"];
    var broadcast = stream["image"];

    var cells = [
      [nickname, { class: ["stream-col-nickname"] }],
      [raceText, { class: ["stream-col-race", "text-capitalize"] }],
      [viewers, { class: ["stream-col-viewers", "text-center"] }],
      [
        durationText,
        {
          class: ["stream-col-duration", "text-center"],
          "data-value": durationValue,
        },
      ],
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
        let id = "preview_" + idCounter++;
        var span = document.createElement("span");
        var raceAnchor = document.createElement("a");
        raceAnchor.classList.add("race-emoji");
        raceAnchor.classList.add("race-emoji-popover");
        raceAnchor.setAttribute("triggerId", id);
        raceAnchor.innerHTML =
          race == "zerg"
            ? "🦂"
            : race == "protoss"
            ? "🛸"
            : race == "terran"
            ? "🌎"
            : "📺";
        var linkAnchor = document.createElement("a");
        linkAnchor.id = id;
        linkAnchor.href = url;
        linkAnchor.rel = "noreferrer";
        linkAnchor.classList.add("stream-link");
        linkAnchor.appendChild(document.createTextNode(text));
        if (broadcast) {
          // Hover preview for desktop
          linkAnchor.setAttribute("data-image", broadcast);
          linkAnchor.setAttribute("data-placement", "right");
          linkAnchor.setAttribute(
            "data-content",
            "<img src='" + broadcast + "' width='470' height='270'>"
          );
          linkAnchor.setAttribute("data-html", "true");
          linkAnchor.setAttribute("data-trigger", "hover");
          linkAnchor.setAttribute("data-toggle", "popover");
          linkAnchor.setAttribute("tabindex", "0");
          linkAnchor.setAttribute("title", "");
        }

        span.appendChild(raceAnchor);
        span.appendChild(document.createTextNode(" "));
        span.appendChild(linkAnchor);
        newCell.appendChild(span);
      } else {
        newCell.appendChild(document.createTextNode(text));
      }
    }
  }

  var table = document.getElementById(idTableStreams);
  var oldTbody = document
    .getElementById(idTableStreams)
    .getElementsByTagName("tbody")[0];
  table.replaceChild(newTbody, oldTbody);
}

function setLastUpdate(timeStr) {
  $("#text-last-updated").text(moment(timeStr).format("lll"));
}

var previewDiv = $("#preview");
var previewImage = $("#preview-image");
var divShown = false;
var updater = {
  json: null,

  refreshStreams: function () {
    this.refreshStarted();
    var promise = $.getJSON("http://localhost:8081/streams.json");
    promise.done(
      function (data) {
        this.json = data;
        this.refreshComplete();
      }.bind(this)
    );
  },

  refreshStarted: function () {
    $("#icon-refresh").addClass("fa-spin");
    $("#icon-refresh").addClass("active");
  },

  refreshComplete: function () {
    let hidePopovers = function () {
      $(".popover").popover("hide");
    };

    hidePopovers();

    replaceTable(this.json["streams"], this.json["updateTime"]);

    // Preload images only on mouse movement
    document.addEventListener(
      "mousemove",
      () => {
        let streams = Object.entries(this.json["streams"]);
        let images = streams.map((s) => s[1].image).filter((image) => image);
        images.forEach((image) => {
          new Image().src = image;
        });
      },
      { once: true }
    );

    setLastUpdate(this.json["updateTime"]);

    $.bootstrapSortable(true);
    var visibilitySettings = settings.visibilityKeys();
    for (var i = 0; i < visibilitySettings.length; i++) {
      settings.callback(visibilitySettings[i]);
    }
    $("#icon-refresh").removeClass("fa-spin");
    $("#icon-refresh").removeClass("active");

    $('[data-toggle="popover"]').popover();

    $(".race-emoji-popover").click(function (e) {
      hidePopovers();
      let triggerId = $(this).attr("triggerId");
      $("#" + triggerId).popover("toggle");
      e.stopPropagation();
    });

    $("html").click(hidePopovers);
  },
};

jQuery(document).ready(function ($) {
  $("#btn-refresh").click(function () {
    updater.refreshStreams();
  });

  var visibilitySettings = settings.visibilityKeys();
  for (var i = 0; i < visibilitySettings.length; i++) {
    (function () {
      var setting = visibilitySettings[i];
      var checkboxId = settings.settingToCheckboxId(setting);
      $("#" + checkboxId).click(function () {
        settings[setting] = $("#" + checkboxId).is(":checked");
        settings.callback(setting);
      });
    })();
  }

  settings.loadSettings();

  watch(settings, settings.keys(), function () {
    settings.saveSettings();
  });

  updater.refreshStreams();
});
