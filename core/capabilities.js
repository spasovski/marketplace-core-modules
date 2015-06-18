define('core/capabilities', ['core/settings'], function(settings) {
    function safeMatchMedia(query) {
        var m = window.matchMedia(query);
        return !!m && m.matches;
    }

    var osInfo = {
        windows: {
            name: 'Windows', regex: /Windows NT/, slug: 'windows',
        },
        mac: {
            name: 'Mac OS X', regex: /Macintosh/, slug: 'mac',
            // FIXME: We still want to get the version number.
            // name: 'Mac OS X', regex: /Mac OS X 10[_\.](\d+)/, slug: 'mac',
        },
        // FIXME: Check for android first as it claims to be Linux.
        linux: {
            name: 'Linux', regex: /Linux/, slug: 'linux',
        },
        android: {
            name: 'Android', regex: /Android/, slug: 'android',
        },
    };

    function detectOS(navigator) {
        navigator = navigator || window.navigator;
        var matchData;
        var os;
        var osNames = Object.keys(osInfo);
        for (var i = 0; i < osNames.length; i++) {
            os = osInfo[osNames[i]];
            matchData = os.regex.exec(navigator.userAgent);
            if (matchData) {
                return {
                    name: os.name,
                    slug: os.slug,
                    // Return `undefined` not `NaN` if we don't detect version.
                    version: matchData[1] && parseInt(matchData[1], 10),
                };
            }
        }
        return {};
    }

    var static_caps = {
        'JSON': window.JSON && typeof JSON.parse === 'function',
        'debug': document.location.href.indexOf('dbg') >= 0,
        'debug_in_page': document.location.href.indexOf('dbginpage') >= 0,
        'console': window.console && typeof window.console.log === 'function',
        'packaged': window.location.protocol === 'app:',
        'iframed': window.top !== window.self,
        'replaceState': typeof history.replaceState === 'function',
        'chromeless': !!(window.locationbar && !window.locationbar.visible),
        'userAgent': navigator.userAgent,
        'widescreen': function() { return safeMatchMedia('(min-width: 710px)'); },
        'android': navigator.userAgent.indexOf('Android') !== -1,
        'firefoxAndroid': navigator.userAgent.indexOf('Firefox') !== -1 && navigator.userAgent.indexOf('Android') !== -1,
        'touch': !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch),
        'performance': !!(window.performance || window.msPerformance || window.webkitPerformance || window.mozPerformance),
        'navPay': !!navigator.mozPay,
        'webactivities': !!(navigator.setMessageHandler || navigator.mozSetMessageHandler),
        'firefoxOS': navigator.mozApps && navigator.mozApps.installPackage &&
                     navigator.userAgent.indexOf('Android') === -1 &&
                     (navigator.userAgent.indexOf('Mobile') !== -1 || navigator.userAgent.indexOf('Tablet') !== -1),
        'phantom': !!navigator.userAgent.match(/(Phantom|Slimer)/),  // Don't use this if you can help it.
        'detectOS': detectOS,
        'os': detectOS(),
    };

    function mockWebApps() {
        return static_caps.phantom || settings.mockWebApps;
    }

    function supportsWebApps() {
        return mockWebApps() ||
            !!(navigator.mozApps && navigator.mozApps.install);
    }

    function supportsPackagedWebApps() {
        return mockWebApps() ||
            !!(navigator.mozApps && navigator.mozApps.installPackage);
    }

    // We want to make this dynamic for our UI tests but if
    // Object.defineProperty does not exist this isn't a UI test and we don't
    // need it to be dynamic.
    if (Object.defineProperty) {
        Object.defineProperty(static_caps, 'webApps', {get: supportsWebApps});
        Object.defineProperty(static_caps, 'packagedWebApps',
                              {get: supportsPackagedWebApps});
    } else {
        static_caps.webApps = supportsWebApps();
        static_caps.packagedWebApps = supportsPackagedWebApps();
    }

    static_caps.nativeFxA = function() {
        return (static_caps.firefoxOS && window.location.protocol === 'app:' &&
                navigator.userAgent.match(/rv:(\d{2})/)[1] >= 34);

    };
    static_caps.yulelogFxA = function() {
        return (static_caps.firefoxOS && window.top !== window.self &&
                settings.switches.indexOf('native-firefox-accounts') !== -1 &&
                navigator.userAgent.match(/rv:(\d{2})/)[1] >= 34);
    };
    static_caps.fallbackFxA = function() {
        return (!(static_caps.nativeFxA() || static_caps.yulelogFxA()));
    };

    /* Returns device platform name without the form factor ('dev' API parameter). */
    static_caps.device_platform = function(caps) {
        caps = caps || static_caps;
        if (caps.firefoxOS) {
            return 'firefoxos';
        } else if (caps.android) {
            return 'android';
        } else if (['windows', 'mac', 'linux'].indexOf(caps.os.slug) !== -1) {
            return 'desktop';
        } else {
            return 'other';
        }
    };

    /* Returns device form factor alone, i.e. 'tablet' or 'mobile' ('device' API parameter).
     * Only supported for Android currently. */
    static_caps.device_formfactor = function(caps) {
        caps = caps || static_caps;
        if (caps.firefoxAndroid || caps.device_platform() === 'other') {
            if (caps.widescreen()) {
                return 'tablet';
            }
            return 'mobile';
        }
        return '';
    };

    /* Returns full device type information, e.g. 'android-mobile' or 'firefoxos' as exposed by the API. */
    static_caps.device_type = function(caps) {
        var device_platform = static_caps.device_platform(caps);
        var device_formfactor = static_caps.device_formfactor(caps);

        if (device_platform && device_formfactor) {
            return device_platform + '-' + device_formfactor;
        }
        return device_platform;
    };

    // OS X requires some extra work to install apps that aren't from the
    // App Store. See bug 1112275 for more info.
    static_caps.osXInstallIssues = static_caps.os.slug === 'mac' &&
                                   static_caps.os.version >= 9;

    return static_caps;

});
