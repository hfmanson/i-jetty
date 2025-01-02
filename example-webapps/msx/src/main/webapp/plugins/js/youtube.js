/******************************************************************************/
//YouTubePlayer v0.0.7
//(c) 2024 Benjamin Zachey
//related API: https://developers.google.com/youtube/iframe_api_reference
/******************************************************************************/
function YouTubePlayer() {
    var player = null;
    var body = null;
    var ready = false;
    var ended = false;
    var error = false;
    var waitingForUser = false;
    var waitingForUserCounter = 0;
    var instance = this;

    //--------------------------------------------------------------------------
    //Player Options
    //--------------------------------------------------------------------------
    var showRelatedContent = false;
    var hasQualities = function() {
        var qualities = instance.getQualities();
        return qualities != null && qualities.length > 0;
    };
    var normalizeQuality = function(quality) {
        if (TVXTools.isFullStr(quality)) {
            if (quality == "hd2160" || quality == "4k" || quality == "uhd" || quality == "2160p" || quality == "hd1440" || quality == "1440p") {
                return "highres";
            } else if (quality == "hd1080" || quality == "shd" || quality == "1080p") {
                return "hd1080";
            } else if (quality == "hd720" || quality == "hd" || quality == "720p") {
                return "hd720";
            } else if (quality == "large" || quality == "480p") {
                return "large";
            } else if (quality == "medium" || quality == "360p") {
                return "medium";
            } else if (quality == "small" || quality == "240p") {
                return "small";
            }
        }
        return "default";
    };
    var getQualityName = function(quality) {
        if (TVXTools.isFullStr(quality)) {
            if (quality == "hd2160") {
                return "2160p";
            } else if (quality == "hd1440") {
                return "1440p";
            } else if (quality == "hd1080") {
                return "1080p";
            } else if (quality == "hd720") {
                return "720p";
            } else if (quality == "large") {
                return "480p";
            } else if (quality == "medium") {
                return "360p";
            } else if (quality == "small") {
                return "240p";
            } else if (quality == "tiny") {
                return "144p";
            } else if (quality == "auto") {
                return "Auto";
            }
            return "Unknown (" + quality + ")";
        }
        return "Unknown";
    };
    var displayQuality = function(quality) {
        return quality == "hd2160" ||
                quality == "hd1440" ||
                quality == "hd1080" ||
                quality == "hd720" ||
                quality == "large" ||
                quality == "medium" ||
                quality == "small" ||
                quality == "auto";
    };
    var getCurrentQualityName = function() {
        return getQualityName(instance.getQuality());
    };
    var createQualityPanel = function() {
        //Note: It is not possible anymore to change or preselect the YouTube quality for embedded players (please see update "October 24, 2019" on this page: https://developers.google.com/youtube/iframe_api_reference)
        //However, since this was a great feature (and might be reactivated in the future), we are keeping this setting available (and only disabling it).
        var quality = instance.getQuality();
        var qualities = instance.getQualities();
        var items = [];
        if (qualities != null && qualities.length > 0) {
            for (var i = 0; i < qualities.length; i++) {
                var q = qualities[i];
                if (TVXTools.isFullStr(q) && displayQuality(q)) {
                    var selected = q === quality;
                    items.push({
                        focus: selected,
                        label: getQualityName(q),
                        extensionIcon: selected ? "check" : "blank",
                        //action: selected ? "back" : "[back|player:commit:message:quality:" + q + "]"
                        action: selected ? "back" : "info:Changing the quality is currently not supported by YouTube."
                    });
                }
            }
        }
        var compress = items.length > 6;
        return {
            cache: false,
            reuse: false,
            compress: compress,
            headline: "Quality",
            template: {
                enumerate: false,
                type: "control",
                layout: compress ? "0,0,10,1" : "0,0,8,1"
            },
            items: items
        };
    };
    var hasSpeeds = function() {
        var speeds = instance.getSpeeds();
        return speeds != null && speeds.length > 0;
    };
    var getSpeedName = function(speed) {
        return speed == 1 ? "Normal" : "x" + speed;
    };
    var getCurrentSpeedName = function() {
        return getSpeedName(instance.getSpeed());
    };
    var createSpeedPanel = function() {
        var speed = instance.getSpeed();
        var speeds = instance.getSpeeds();
        var items = [];
        if (speeds != null && speeds.length > 0) {
            for (var i = 0; i < speeds.length; i++) {
                var s = speeds[i];
                if (TVXTools.isNum(s)) {
                    var selected = s === speed;
                    items.push({
                        focus: selected,
                        label: getSpeedName(s),
                        extensionIcon: selected ? "check" : "blank",
                        action: selected ? "back" : "[back|player:commit:message:speed:" + s + "]"
                    });
                }
            }
        }
        var compress = items.length > 6;
        return {
            cache: false,
            reuse: false,
            compress: compress,
            headline: "Speed",
            template: {
                enumerate: false,
                type: "control",
                layout: compress ? "0,0,10,1" : "0,0,8,1"
            },
            items: items
        };
    };
    var createUpdateObject = function(id) {
        var action = null;
        if (id == "quality") {
            action = hasQualities() ? "panel:request:player:quality" : "info:The quality cannot be changed at the moment.";
        } else if (id == "speed") {
            action = hasSpeeds() ? "panel:request:player:speed" : "info:The speed cannot be changed at the moment.";
        }
        return {
            type: "airtime",
            duration: 1000,
            execute: {
                action: action
            },
            over: {
                action: "player:commit:message:update:" + id
            }
        };
    };
    var createOptionsPanel = function() {
        return {
            cache: false,
            reuse: false,
            headline: "Options",
            template: {
                enumerate: false,
                type: "control",
                layout: "0,0,8,1"
            },
            items: [{
                    id: "quality",
                    icon: "videocam",
                    label: "Quality",
                    extensionLabel: getCurrentQualityName(),
                    action: "live",
                    live: createUpdateObject("quality")
                }, {
                    id: "speed",
                    icon: "slow-motion-video",
                    label: "Speed",
                    extensionLabel: getCurrentSpeedName(),
                    action: "live",
                    live: createUpdateObject("speed")
                }, {
                    display: showRelatedContent,
                    offset: "0,0.25,0,0",
                    icon: "pageview",
                    label: "Related Content",
                    action: "player:content"
                }]
        };
    };
    var handleMessage = function(message) {
        if (TVXTools.isFullStr(message)) {
            if (message.indexOf("update:") == 0) {
                var updateMessage = message.substr(7);
                var extensionLabel = null;
                if (updateMessage == "quality") {
                    extensionLabel = getCurrentQualityName();
                } else if (updateMessage == "speed") {
                    extensionLabel = getCurrentSpeedName();
                }
                TVXVideoPlugin.executeAction("update:panel:" + updateMessage, {
                    extensionLabel: extensionLabel,
                    live: createUpdateObject(updateMessage)
                });
            } else if (message.indexOf("quality:") == 0) {
                instance.setQuality(message.substr(8));
            } else if (message.indexOf("speed:") == 0) {
                instance.setSpeed(TVXTools.strToNum(message.substr(6), 1));
            } else {
                TVXVideoPlugin.warn("Unknown plugin message: '" + message + "'");
            }
        }
    };
    var createResponseData = function(dataId) {
        if (TVXTools.isFullStr(dataId)) {
            if (dataId == "options") {
                return createOptionsPanel();
            } else if (dataId == "quality") {
                return createQualityPanel();
            } else if (dataId == "speed") {
                return createSpeedPanel();
            }
        }
        return null;
    };
    //--------------------------------------------------------------------------

    var getErrorText = function(errorCode) {
        switch (errorCode) {
            case 2:
                return "Video ID is invalid";
            case 5:
                return "Video cannot be played";
            case 100:
                return "Video was not found";
            case 101:
            case 150:
                return "Video cannot be played in embedded mode";
        }
        return "Unknown error has occurred";
    };
    var getBody = function() {
        if (body == null) {
            body = $("body");
        }
        return body;
    };
    var showBody = function() {
        getBody().css("visibility", "");
    };
    var hideBody = function() {
        getBody().css("visibility", "hidden");
    };
    var onReady = function() {
        if (player != null && !ready) {
            ready = true;
            waitingForUser = false;
            waitingForUserCounter = 0;
            showBody();
            TVXVideoPlugin.debug("YouTube player ready");
            TVXVideoPlugin.applyVolume();
            TVXVideoPlugin.startPlayback();
        }
    };
    var onError = function(event) {
        if (event != null && !error) {
            error = true;
            var errorCode = TVXTools.strToNum(event.data, -1);
            TVXVideoPlugin.error("YouTube player error: " + getErrorText(errorCode) + " (Code: " + errorCode + ")");
        }
    };
    var onResize = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.setSize(window.innerWidth, window.innerHeight);
        }
    };
    var onStateChange = function(event) {
        if (event != null) {
            if (event.data == YT.PlayerState.PLAYING) {
                TVXVideoPlugin.setState(TVXVideoState.PLAYING);
            } else if (event.data == YT.PlayerState.PAUSED) {
                TVXVideoPlugin.setState(TVXVideoState.PAUSED);
            } else if (event.data == YT.PlayerState.ENDED) {
                if (!ended) {
                    ended = true;
                    hideBody();
                    TVXVideoPlugin.debug("YouTube video ended");
                    TVXVideoPlugin.stopPlayback();
                }
            }
        }
    };
    var onPlaybackRateChange = function(event) {
        if (event != null) {
            TVXVideoPlugin.setSpeed(event.data);
        }
    };
    this.init = function() {
        hideBody();
    };
    this.ready = function() {
        TVXVideoPlugin.debug("Video plugin ready");
        var id = TVXServices.urlParams.get("id");
        if (TVXTools.isFullStr(id)) {
            showRelatedContent = TVXServices.urlParams.getNum("related", 0) == 1;
            player = new YT.Player("player", {
                videoId: id,
                //width: TVXVideoPlugin.getWidth(),
                //height: TVXVideoPlugin.getHeight(),
                width: window.innerWidth,
                height: window.innerHeight,
                suggestedQuality: normalizeQuality(TVXServices.urlParams.get("quality")),
                playerVars: {
                    autoplay: 1, //Enable autoplay
                    loop: 0, //Disable loop
                    rel: 0, //Hide relative videos
                    fs: 0, //Hide fullscreen button
                    showinfo: 0, //Hide infos
                    controls: 0, //Hide controls
                    disablekb: 1, //Disable keyboard
                    iv_load_policy: 3, //Hide annotations
                    modestbranding: 1, //Hide logo
                    playsinline: 1 //Enable inline playback
                },
                events: {
                    onReady: onReady,
                    onError: onError,
                    onStateChange: onStateChange,
                    onPlaybackRateChange: onPlaybackRateChange
                }
            });
            $(window).resize(onResize);
        } else {
            TVXVideoPlugin.warn("YouTube video ID is missing or empty");
        }
    };
    this.dispose = function() {
        //Note: Check ready state before calling player functions
        if (player != null) {
            if (ready) {
                player.destroy();
            }
            player = null;
        }
    };
    this.getState = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            var state = player.getPlayerState();
            switch (state) {
                case YT.PlayerState.ENDED:
                    return TVXVideoState.STOPPED;
                case YT.PlayerState.PLAYING:
                    return TVXVideoState.PLAYING;
                case YT.PlayerState.PAUSED:
                    return TVXVideoState.PAUSED;
                case YT.PlayerState.BUFFERING:
                    return TVXVideoState.PLAYING;
                case YT.PlayerState.CUED:
                    return TVXVideoState.PLAYING;
            }
        }
        return TVXVideoState.STOPPED;
    };
    this.getUpdateState = function() {
        if (ready && !ended && !error && !waitingForUser &&
                TVXVideoPlugin.getState() == TVXVideoState.PLAYING &&
                TVXVideoPlugin.getPosition() == 0) {
            var state = this.getState();
            if (state == TVXVideoState.STOPPED) {
                waitingForUser = waitingForUserCounter++ > 0;
            } else if (state == TVXVideoState.PAUSED) {
                waitingForUser = true;
            }
            if (waitingForUser) {
                TVXVideoPlugin.debug("YouTube player must be started by user");
                return TVXVideoState.PAUSED;
            }
        }
        return null;
    };
    this.play = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.playVideo();
        }
    };
    this.pause = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.pauseVideo();
        }
    };
    this.stop = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.stopVideo();
        }
    };
    this.getDuration = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getDuration();
        }
        return 0;
    };
    this.getPosition = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getCurrentTime();
        }
        return 0;
    };
    this.setPosition = function(position) {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.seekTo(position, true);
        }
    };
    this.setVolume = function(volume) {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.setVolume(volume);
        }
    };
    this.getVolume = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getVolume();
        }
        return 100;
    };
    this.setMuted = function(muted) {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            if (muted) {
                player.mute();
            } else {
                player.unMute();
            }
        }
    };
    this.isMuted = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.isMuted();
        }
        return false;
    };
    this.getSpeed = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getPlaybackRate();
        }
        return 1;
    };
    this.getSpeeds = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getAvailablePlaybackRates();
        }
        return [1];
    };
    this.setSpeed = function(speed) {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.setPlaybackRate(speed);
        }
    };
    this.setSize = function(width, height) {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.setSize(width, height);
        }
    };
    this.getQuality = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getPlaybackQuality();
        }
        return null;
    };
    this.getQualities = function() {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            return player.getAvailableQualityLevels();
        }
        return null;
    };
    this.setQuality = function(quality) {
        //Note: Check ready state before calling player functions
        if (player != null && ready) {
            player.setPlaybackQuality(quality);
        }
    };
    this.getUpdateData = function() {
        return {
            state: this.getUpdateState(),
            position: this.getPosition(),
            duration: this.getDuration(),
            speed: this.getSpeed()
        };
    };
    this.handleData = function(data) {
        handleMessage(data.message);
    };
    this.handleRequest = function(dataId, data, callback) {
        callback(createResponseData(dataId));
    };
}
/******************************************************************************/

/******************************************************************************/
//Setup
/******************************************************************************/
TVXPluginTools.startInitService();
window.onYouTubeIframeAPIReady = function() {
    TVXPluginTools.stopInitService();
};
TVXPluginTools.onReady(function() {
    TVXVideoPlugin.setupPlayer(new YouTubePlayer());
    TVXVideoPlugin.init();
});
/******************************************************************************/