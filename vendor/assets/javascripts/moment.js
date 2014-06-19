//! moment.js
//! version : 2.7.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
     Constants
     ************************************/

    var moment,
        VERSION = "2.7.0",
    // the global-scope this is NOT the global object in Node.js
        globalScope = typeof global !== 'undefined' ? global : this,
        oldGlobalMoment,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

    // internal storage for language config files
        languages = {},

    // moment internal properties
        momentProperties = {
            _isAMomentObject: null,
            _i : null,
            _f : null,
            _l : null,
            _strict : null,
            _tzm : null,
            _isUTC : null,
            _offset : null,  // optional. Combine with _isUTC
            _pf : null,
            _lang : null  // optional
        },

    // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

    // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

    // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

    // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        parseTokenOrdinal = /\d{1,2}/,

    //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

    // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

    // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

    // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

    // format function strings
        formatFunctions = {},

    // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,   //seconds to minutes
            m: 45,   //minutes to hours
            h: 22,   //hours to days
            dd: 25,  //days to month (month == 1)
            dm: 45,  //days to months (months > 1)
            dy: 345  //days to year
        },

    // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error("Implement me");
        }
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        function printMsg() {
            if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
                console.warn("Deprecation warning: " + msg);
            }
        }
        return extend(function () {
            if (firstTime) {
                printMsg();
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
     Constructors
     ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
     Helpers
     ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function cloneMoment(m) {
        var result = {}, i;
        for (i in m) {
            if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
                result[i] = m[i];
            }
        }

        return result;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                    m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                    m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                    m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                    m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                    m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                    m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
     Languages
     ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
     Formatting
     ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
     Parsing
     ************************************/


        // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
            case 'Q':
                return parseTokenOneDigit;
            case 'DDDD':
                return parseTokenThreeDigits;
            case 'YYYY':
            case 'GGGG':
            case 'gggg':
                return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
            case 'Y':
            case 'G':
            case 'g':
                return parseTokenSignedNumber;
            case 'YYYYYY':
            case 'YYYYY':
            case 'GGGGG':
            case 'ggggg':
                return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
            case 'S':
                if (strict) { return parseTokenOneDigit; }
            /* falls through */
            case 'SS':
                if (strict) { return parseTokenTwoDigits; }
            /* falls through */
            case 'SSS':
                if (strict) { return parseTokenThreeDigits; }
            /* falls through */
            case 'DDD':
                return parseTokenOneToThreeDigits;
            case 'MMM':
            case 'MMMM':
            case 'dd':
            case 'ddd':
            case 'dddd':
                return parseTokenWord;
            case 'a':
            case 'A':
                return getLangDefinition(config._l)._meridiemParse;
            case 'X':
                return parseTokenTimestampMs;
            case 'Z':
            case 'ZZ':
                return parseTokenTimezone;
            case 'T':
                return parseTokenT;
            case 'SSSS':
                return parseTokenDigits;
            case 'MM':
            case 'DD':
            case 'YY':
            case 'GG':
            case 'gg':
            case 'HH':
            case 'hh':
            case 'mm':
            case 'ss':
            case 'ww':
            case 'WW':
                return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
            case 'M':
            case 'D':
            case 'd':
            case 'H':
            case 'h':
            case 'm':
            case 's':
            case 'w':
            case 'W':
            case 'e':
            case 'E':
                return parseTokenOneOrTwoDigits;
            case 'Do':
                return parseTokenOrdinal;
            default :
                a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
                return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
            // QUARTER
            case 'Q':
                if (input != null) {
                    datePartArray[MONTH] = (toInt(input) - 1) * 3;
                }
                break;
            // MONTH
            case 'M' : // fall through to MM
            case 'MM' :
                if (input != null) {
                    datePartArray[MONTH] = toInt(input) - 1;
                }
                break;
            case 'MMM' : // fall through to MMMM
            case 'MMMM' :
                a = getLangDefinition(config._l).monthsParse(input);
                // if we didn't find a month name, mark the date as invalid.
                if (a != null) {
                    datePartArray[MONTH] = a;
                } else {
                    config._pf.invalidMonth = input;
                }
                break;
            // DAY OF MONTH
            case 'D' : // fall through to DD
            case 'DD' :
                if (input != null) {
                    datePartArray[DATE] = toInt(input);
                }
                break;
            case 'Do' :
                if (input != null) {
                    datePartArray[DATE] = toInt(parseInt(input, 10));
                }
                break;
            // DAY OF YEAR
            case 'DDD' : // fall through to DDDD
            case 'DDDD' :
                if (input != null) {
                    config._dayOfYear = toInt(input);
                }

                break;
            // YEAR
            case 'YY' :
                datePartArray[YEAR] = moment.parseTwoDigitYear(input);
                break;
            case 'YYYY' :
            case 'YYYYY' :
            case 'YYYYYY' :
                datePartArray[YEAR] = toInt(input);
                break;
            // AM / PM
            case 'a' : // fall through to A
            case 'A' :
                config._isPm = getLangDefinition(config._l).isPM(input);
                break;
            // 24 HOUR
            case 'H' : // fall through to hh
            case 'HH' : // fall through to hh
            case 'h' : // fall through to hh
            case 'hh' :
                datePartArray[HOUR] = toInt(input);
                break;
            // MINUTE
            case 'm' : // fall through to mm
            case 'mm' :
                datePartArray[MINUTE] = toInt(input);
                break;
            // SECOND
            case 's' : // fall through to ss
            case 'ss' :
                datePartArray[SECOND] = toInt(input);
                break;
            // MILLISECOND
            case 'S' :
            case 'SS' :
            case 'SSS' :
            case 'SSSS' :
                datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
                break;
            // UNIX TIMESTAMP WITH MS
            case 'X':
                config._d = new Date(parseFloat(input) * 1000);
                break;
            // TIMEZONE
            case 'Z' : // fall through to ZZ
            case 'ZZ' :
                config._useUTC = true;
                config._tzm = timezoneMinutesFromString(input);
                break;
            // WEEKDAY - human
            case 'dd':
            case 'ddd':
            case 'dddd':
                a = getLangDefinition(config._l).weekdaysParse(input);
                // if we didn't get a weekday name, mark the date as invalid
                if (a != null) {
                    config._w = config._w || {};
                    config._w['d'] = a;
                } else {
                    config._pf.invalidWeekday = input;
                }
                break;
            // WEEK, WEEK DAY - numeric
            case 'w':
            case 'ww':
            case 'W':
            case 'WW':
            case 'd':
            case 'e':
            case 'E':
                token = token.substr(0, 1);
            /* falls through */
            case 'gggg':
            case 'GGGG':
            case 'GGGGG':
                token = token.substr(0, 2);
                if (input) {
                    config._w = config._w || {};
                    config._w[token] = toInt(input);
                }
                break;
            case 'gg':
            case 'GG':
                config._w = config._w || {};
                config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, lang;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            lang = getLangDefinition(config._l);
            dow = lang._week.dow;
            doy = lang._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual zone can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i][0] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
     Relative Time
     ************************************/


        // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < relativeTimeThresholds.s  && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= relativeTimeThresholds.dd && ['dd', days] ||
                days <= relativeTimeThresholds.dm && ['M'] ||
                days < relativeTimeThresholds.dy && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
     Week of Year
     ************************************/


        // firstDayOfWeek       0 = sun, 6 = sat
        //                      the day of the week that starts the week
        //                      (usually sunday or monday)
        // firstDayOfWeekOfYear 0 = sun, 6 = sat
        //                      the first week is the week that contains the first
        //                      of this day of the week
        //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
     Top Level Functions
     ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = cloneMoment(input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = lang;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
            "moment construction falls back to js Date. This is " +
            "discouraged and will be removed in upcoming major " +
            "release. Please refer to " +
            "https://github.com/moment/moment/issues/1407 for more info.",
        function (config) {
            config._d = new Date(config._i);
        });

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = lang;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
        // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function(threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null &&  obj.hasOwnProperty('_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    /************************************
     Moment Prototype
     ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string' && typeof val === 'string') {
                dur = moment.duration(isNaN(+val) ? +input : +val, isNaN(+val) ? val : input);
            } else if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string' && typeof val === 'string') {
                dur = moment.duration(isNaN(+val) ? +input : +val, isNaN(+val) ? val : input);
            } else if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                    (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                    (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                        units === 'minute' ? diff / 6e4 : // 1000 * 60
                        units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                        units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                        units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                        diff < -1 ? 'lastWeek' :
                        diff < 0 ? 'lastDay' :
                        diff < 1 ? 'sameDay' :
                        diff < 2 ? 'nextDay' :
                        diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
                case 'year':
                    this.month(0);
                /* falls through */
                case 'quarter':
                case 'month':
                    this.date(1);
                /* falls through */
                case 'week':
                case 'isoWeek':
                case 'day':
                    this.hours(0);
                /* falls through */
                case 'hour':
                    this.minutes(0);
                /* falls through */
                case 'minute':
                    this.seconds(0);
                /* falls through */
                case 'second':
                    this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: deprecate(
            "moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",
            function (other) {
                other = moment.apply(null, arguments);
                return other < this ? this : other;
            }
        ),

        max: deprecate(
            "moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",
            function (other) {
                other = moment.apply(null, arguments);
                return other > this ? this : other;
            }
        ),

        // keepTime = true means only change the timezone, without affecting
        // the local hour. So 5:31:26 +0300 --[zone(2, true)]--> 5:31:26 +0200
        // It is possible that 5:31:26 doesn't exist int zone +0200, so we
        // adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        zone : function (input, keepTime) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    if (!keepTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                            moment.duration(offset - input, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this._lang._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.lang().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
            daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate("dates accessor is deprecated. Use date instead.", makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate("years accessor is deprecated. Use year instead.", makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
     Duration Prototype
     ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
                this._days * 864e5 +
                (this._months % 12) * 2592e6 +
                toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
     Default Lang
     ************************************/


        // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // moment.js language configuration
// language : Moroccan Arabic (ar-ma)
// author : ElFadili Yassine : https://github.com/ElFadiliY
// author : Abdel Said : https://github.com/abdelsaid

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('ar-ma', {
            months : "ŮŮŘ§ŮŘą_ŮŘ¨ŘąŘ§ŮŘą_ŮŘ§ŘąŘł_ŘŁŘ¨ŘąŮŮ_ŮŘ§Ů_ŮŮŮŮŮ_ŮŮŮŮŮŘ˛_ŘşŘ´ŘŞ_Ř´ŘŞŮŘ¨Řą_ŘŁŮŘŞŮŘ¨Řą_ŮŮŮŘ¨Řą_ŘŻŘŹŮŘ¨Řą".split("_"),
            monthsShort : "ŮŮŘ§ŮŘą_ŮŘ¨ŘąŘ§ŮŘą_ŮŘ§ŘąŘł_ŘŁŘ¨ŘąŮŮ_ŮŘ§Ů_ŮŮŮŮŮ_ŮŮŮŮŮŘ˛_ŘşŘ´ŘŞ_Ř´ŘŞŮŘ¨Řą_ŘŁŮŘŞŮŘ¨Řą_ŮŮŮŘ¨Řą_ŘŻŘŹŮŘ¨Řą".split("_"),
            weekdays : "Ř§ŮŘŁŘ­ŘŻ_Ř§ŮŘĽŘŞŮŮŮ_Ř§ŮŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŮŘŁŘąŘ¨ŘšŘ§ŘĄ_Ř§ŮŘŽŮŮŘł_Ř§ŮŘŹŮŘšŘŠ_Ř§ŮŘłŘ¨ŘŞ".split("_"),
            weekdaysShort : "Ř§Ř­ŘŻ_Ř§ŘŞŮŮŮ_ŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŘąŘ¨ŘšŘ§ŘĄ_ŘŽŮŮŘł_ŘŹŮŘšŘŠ_ŘłŘ¨ŘŞ".split("_"),
            weekdaysMin : "Ř­_Ů_ŘŤ_Řą_ŘŽ_ŘŹ_Řł".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[Ř§ŮŮŮŮ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT",
                nextDay: '[ŘşŘŻŘ§ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                nextWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                lastDay: '[ŘŁŮŘł ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                lastWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "ŮŮ %s",
                past : "ŮŮŘ° %s",
                s : "ŘŤŮŘ§Ů",
                m : "ŘŻŮŮŮŘŠ",
                mm : "%d ŘŻŮŘ§ŘŚŮ",
                h : "ŘłŘ§ŘšŘŠ",
                hh : "%d ŘłŘ§ŘšŘ§ŘŞ",
                d : "ŮŮŮ",
                dd : "%d ŘŁŮŘ§Ů",
                M : "Ř´ŮŘą",
                MM : "%d ŘŁŘ´ŮŘą",
                y : "ŘłŮŘŠ",
                yy : "%d ŘłŮŮŘ§ŘŞ"
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Arabic Saudi Arabia (ar-sa)
// author : Suhail Alkowaileet : https://github.com/xsoh

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'ŮĄ',
            '2': 'Ů˘',
            '3': 'ŮŁ',
            '4': 'Ů¤',
            '5': 'ŮĽ',
            '6': 'ŮŚ',
            '7': 'Ů§',
            '8': 'Ů¨',
            '9': 'ŮŠ',
            '0': 'Ů '
        }, numberMap = {
            'ŮĄ': '1',
            'Ů˘': '2',
            'ŮŁ': '3',
            'Ů¤': '4',
            'ŮĽ': '5',
            'ŮŚ': '6',
            'Ů§': '7',
            'Ů¨': '8',
            'ŮŠ': '9',
            'Ů ': '0'
        };

        return moment.lang('ar-sa', {
            months : "ŮŮŘ§ŮŘą_ŮŘ¨ŘąŘ§ŮŘą_ŮŘ§ŘąŘł_ŘŁŘ¨ŘąŮŮ_ŮŘ§ŮŮ_ŮŮŮŮŮ_ŮŮŮŮŮ_ŘŁŘşŘłŘˇŘł_ŘłŘ¨ŘŞŮŘ¨Řą_ŘŁŮŘŞŮŘ¨Řą_ŮŮŮŮŘ¨Řą_ŘŻŮŘłŮŘ¨Řą".split("_"),
            monthsShort : "ŮŮŘ§ŮŘą_ŮŘ¨ŘąŘ§ŮŘą_ŮŘ§ŘąŘł_ŘŁŘ¨ŘąŮŮ_ŮŘ§ŮŮ_ŮŮŮŮŮ_ŮŮŮŮŮ_ŘŁŘşŘłŘˇŘł_ŘłŘ¨ŘŞŮŘ¨Řą_ŘŁŮŘŞŮŘ¨Řą_ŮŮŮŮŘ¨Řą_ŘŻŮŘłŮŘ¨Řą".split("_"),
            weekdays : "Ř§ŮŘŁŘ­ŘŻ_Ř§ŮŘĽŘŤŮŮŮ_Ř§ŮŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŮŘŁŘąŘ¨ŘšŘ§ŘĄ_Ř§ŮŘŽŮŮŘł_Ř§ŮŘŹŮŘšŘŠ_Ř§ŮŘłŘ¨ŘŞ".split("_"),
            weekdaysShort : "ŘŁŘ­ŘŻ_ŘĽŘŤŮŮŮ_ŘŤŮŘ§ŘŤŘ§ŘĄ_ŘŁŘąŘ¨ŘšŘ§ŘĄ_ŘŽŮŮŘł_ŘŹŮŘšŘŠ_ŘłŘ¨ŘŞ".split("_"),
            weekdaysMin : "Ř­_Ů_ŘŤ_Řą_ŘŽ_ŘŹ_Řł".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return "Řľ";
                } else {
                    return "Ů";
                }
            },
            calendar : {
                sameDay: "[Ř§ŮŮŮŮ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT",
                nextDay: '[ŘşŘŻŘ§ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                nextWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                lastDay: '[ŘŁŮŘł ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                lastWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "ŮŮ %s",
                past : "ŮŮŘ° %s",
                s : "ŘŤŮŘ§Ů",
                m : "ŘŻŮŮŮŘŠ",
                mm : "%d ŘŻŮŘ§ŘŚŮ",
                h : "ŘłŘ§ŘšŘŠ",
                hh : "%d ŘłŘ§ŘšŘ§ŘŞ",
                d : "ŮŮŮ",
                dd : "%d ŘŁŮŘ§Ů",
                M : "Ř´ŮŘą",
                MM : "%d ŘŁŘ´ŮŘą",
                y : "ŘłŮŘŠ",
                yy : "%d ŘłŮŮŘ§ŘŞ"
            },
            preparse: function (string) {
                return string.replace(/[Ű°-Űš]/g, function (match) {
                    return numberMap[match];
                }).replace(/Ř/g, ',');
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                }).replace(/,/g, 'Ř');
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Arabic (ar)
// author : Abdel Said : https://github.com/abdelsaid
// changes in months, weekdays : Ahmed Elkhatib

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'ŮĄ',
            '2': 'Ů˘',
            '3': 'ŮŁ',
            '4': 'Ů¤',
            '5': 'ŮĽ',
            '6': 'ŮŚ',
            '7': 'Ů§',
            '8': 'Ů¨',
            '9': 'ŮŠ',
            '0': 'Ů '
        }, numberMap = {
            'ŮĄ': '1',
            'Ů˘': '2',
            'ŮŁ': '3',
            'Ů¤': '4',
            'ŮĽ': '5',
            'ŮŚ': '6',
            'Ů§': '7',
            'Ů¨': '8',
            'ŮŠ': '9',
            'Ů ': '0'
        };

        return moment.lang('ar', {
            months : "ŮŮŘ§ŮŘą/ ŮŘ§ŮŮŮ Ř§ŮŘŤŘ§ŮŮ_ŮŘ¨ŘąŘ§ŮŘą/ Ř´Ř¨Ř§Řˇ_ŮŘ§ŘąŘł/ Ř˘Ř°Ř§Řą_ŘŁŘ¨ŘąŮŮ/ ŮŮŘłŘ§Ů_ŮŘ§ŮŮ/ ŘŁŮŘ§Řą_ŮŮŮŮŮ/ Ř­Ř˛ŮŘąŘ§Ů_ŮŮŮŮŮ/ ŘŞŮŮŘ˛_ŘŁŘşŘłŘˇŘł/ Ř˘Ř¨_ŘłŘ¨ŘŞŮŘ¨Řą/ ŘŁŮŮŮŮ_ŘŁŮŘŞŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŁŮŮ_ŮŮŮŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŤŘ§ŮŮ_ŘŻŮŘłŮŘ¨Řą/ ŮŘ§ŮŮŮ Ř§ŮŘŁŮŮ".split("_"),
            monthsShort : "ŮŮŘ§ŮŘą/ ŮŘ§ŮŮŮ Ř§ŮŘŤŘ§ŮŮ_ŮŘ¨ŘąŘ§ŮŘą/ Ř´Ř¨Ř§Řˇ_ŮŘ§ŘąŘł/ Ř˘Ř°Ř§Řą_ŘŁŘ¨ŘąŮŮ/ ŮŮŘłŘ§Ů_ŮŘ§ŮŮ/ ŘŁŮŘ§Řą_ŮŮŮŮŮ/ Ř­Ř˛ŮŘąŘ§Ů_ŮŮŮŮŮ/ ŘŞŮŮŘ˛_ŘŁŘşŘłŘˇŘł/ Ř˘Ř¨_ŘłŘ¨ŘŞŮŘ¨Řą/ ŘŁŮŮŮŮ_ŘŁŮŘŞŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŁŮŮ_ŮŮŮŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŤŘ§ŮŮ_ŘŻŮŘłŮŘ¨Řą/ ŮŘ§ŮŮŮ Ř§ŮŘŁŮŮ".split("_"),
            weekdays : "Ř§ŮŘŁŘ­ŘŻ_Ř§ŮŘĽŘŤŮŮŮ_Ř§ŮŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŮŘŁŘąŘ¨ŘšŘ§ŘĄ_Ř§ŮŘŽŮŮŘł_Ř§ŮŘŹŮŘšŘŠ_Ř§ŮŘłŘ¨ŘŞ".split("_"),
            weekdaysShort : "ŘŁŘ­ŘŻ_ŘĽŘŤŮŮŮ_ŘŤŮŘ§ŘŤŘ§ŘĄ_ŘŁŘąŘ¨ŘšŘ§ŘĄ_ŘŽŮŮŘł_ŘŹŮŘšŘŠ_ŘłŘ¨ŘŞ".split("_"),
            weekdaysMin : "Ř­_Ů_ŘŤ_Řą_ŘŽ_ŘŹ_Řł".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return "Řľ";
                } else {
                    return "Ů";
                }
            },
            calendar : {
                sameDay: "[Ř§ŮŮŮŮ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT",
                nextDay: '[ŘşŘŻŘ§ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                nextWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                lastDay: '[ŘŁŮŘł ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                lastWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "ŮŮ %s",
                past : "ŮŮŘ° %s",
                s : "ŘŤŮŘ§Ů",
                m : "ŘŻŮŮŮŘŠ",
                mm : "%d ŘŻŮŘ§ŘŚŮ",
                h : "ŘłŘ§ŘšŘŠ",
                hh : "%d ŘłŘ§ŘšŘ§ŘŞ",
                d : "ŮŮŮ",
                dd : "%d ŘŁŮŘ§Ů",
                M : "Ř´ŮŘą",
                MM : "%d ŘŁŘ´ŮŘą",
                y : "ŘłŮŘŠ",
                yy : "%d ŘłŮŮŘ§ŘŞ"
            },
            preparse: function (string) {
                return string.replace(/[Ű°-Űš]/g, function (match) {
                    return numberMap[match];
                }).replace(/Ř/g, ',');
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                }).replace(/,/g, 'Ř');
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : azerbaijani (az)
// author : topchiyev : https://github.com/topchiyev

    (function (factory) {
        factory(moment);
    }(function (moment) {

        var suffixes = {
            1: "-inci",
            5: "-inci",
            8: "-inci",
            70: "-inci",
            80: "-inci",

            2: "-nci",
            7: "-nci",
            20: "-nci",
            50: "-nci",

            3: "-ĂźncĂź",
            4: "-ĂźncĂź",
            100: "-ĂźncĂź",

            6: "-ncÄą",

            9: "-uncu",
            10: "-uncu",
            30: "-uncu",

            60: "-ÄąncÄą",
            90: "-ÄąncÄą"
        };
        return moment.lang('az', {
            months : "yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr".split("_"),
            monthsShort : "yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek".split("_"),
            weekdays : "Bazar_Bazar ertÉsi_ĂÉrĹÉnbÉ axĹamÄą_ĂÉrĹÉnbÉ_CĂźmÉ axĹamÄą_CĂźmÉ_ĹÉnbÉ".split("_"),
            weekdaysShort : "Baz_BzE_ĂAx_ĂÉr_CAx_CĂźm_ĹÉn".split("_"),
            weekdaysMin : "Bz_BE_ĂA_ĂÉ_CA_CĂź_ĹÉ".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[bugĂźn saat] LT',
                nextDay : '[sabah saat] LT',
                nextWeek : '[gÉlÉn hÉftÉ] dddd [saat] LT',
                lastDay : '[dĂźnÉn] LT',
                lastWeek : '[keĂ§Én hÉftÉ] dddd [saat] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s sonra",
                past : "%s ÉvvÉl",
                s : "birneĂ§É saniyyÉ",
                m : "bir dÉqiqÉ",
                mm : "%d dÉqiqÉ",
                h : "bir saat",
                hh : "%d saat",
                d : "bir gĂźn",
                dd : "%d gĂźn",
                M : "bir ay",
                MM : "%d ay",
                y : "bir il",
                yy : "%d il"
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return "gecÉ";
                } else if (hour < 12) {
                    return "sÉhÉr";
                } else if (hour < 17) {
                    return "gĂźndĂźz";
                } else {
                    return "axĹam";
                }
            },
            ordinal : function (number) {
                if (number === 0) {  // special case for zero
                    return number + "-ÄąncÄą";
                }
                var a = number % 10,
                    b = number % 100 - a,
                    c = number >= 100 ? 100 : null;

                return number + (suffixes[a] || suffixes[b] || suffixes[c]);
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : bulgarian (bg)
// author : Krasen Borisov : https://github.com/kraz

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('bg', {
            months : "ŃĐ˝ŃĐ°ŃĐ¸_ŃĐľĐ˛ŃŃĐ°ŃĐ¸_ĐźĐ°ŃŃ_Đ°ĐżŃĐ¸Đť_ĐźĐ°Đš_ŃĐ˝Đ¸_ŃĐťĐ¸_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐżŃĐľĐźĐ˛ŃĐ¸_ĐžĐşŃĐžĐźĐ˛ŃĐ¸_Đ˝ĐžĐľĐźĐ˛ŃĐ¸_Đ´ĐľĐşĐľĐźĐ˛ŃĐ¸".split("_"),
            monthsShort : "ŃĐ˝Ń_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Đš_ŃĐ˝Đ¸_ŃĐťĐ¸_Đ°Đ˛Đł_ŃĐľĐż_ĐžĐşŃ_Đ˝ĐžĐľ_Đ´ĐľĐş".split("_"),
            weekdays : "Đ˝ĐľĐ´ĐľĐťŃ_ĐżĐžĐ˝ĐľĐ´ĐľĐťĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃŃĐ´Đ°_ŃĐľŃĐ˛ŃŃŃŃĐş_ĐżĐľŃŃĐş_ŃŃĐąĐžŃĐ°".split("_"),
            weekdaysShort : "Đ˝ĐľĐ´_ĐżĐžĐ˝_Đ˛ŃĐž_ŃŃŃ_ŃĐľŃ_ĐżĐľŃ_ŃŃĐą".split("_"),
            weekdaysMin : "Đ˝Đ´_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "D.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[ĐĐ˝ĐľŃ Đ˛] LT',
                nextDay : '[ĐŁŃŃĐľ Đ˛] LT',
                nextWeek : 'dddd [Đ˛] LT',
                lastDay : '[ĐŃĐľŃĐ° Đ˛] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 6:
                            return '[Đ Đ¸ĐˇĐźĐ¸Đ˝Đ°ĐťĐ°ŃĐ°] dddd [Đ˛] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[Đ Đ¸ĐˇĐźĐ¸Đ˝Đ°ĐťĐ¸Ń] dddd [Đ˛] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "ŃĐťĐľĐ´ %s",
                past : "ĐżŃĐľĐ´Đ¸ %s",
                s : "Đ˝ŃĐşĐžĐťĐşĐž ŃĐľĐşŃĐ˝Đ´Đ¸",
                m : "ĐźĐ¸Đ˝ŃŃĐ°",
                mm : "%d ĐźĐ¸Đ˝ŃŃĐ¸",
                h : "ŃĐ°Ń",
                hh : "%d ŃĐ°ŃĐ°",
                d : "Đ´ĐľĐ˝",
                dd : "%d Đ´Đ˝Đ¸",
                M : "ĐźĐľŃĐľŃ",
                MM : "%d ĐźĐľŃĐľŃĐ°",
                y : "ĐłĐžĐ´Đ¸Đ˝Đ°",
                yy : "%d ĐłĐžĐ´Đ¸Đ˝Đ¸"
            },
            ordinal : function (number) {
                var lastDigit = number % 10,
                    last2Digits = number % 100;
                if (number === 0) {
                    return number + '-ĐľĐ˛';
                } else if (last2Digits === 0) {
                    return number + '-ĐľĐ˝';
                } else if (last2Digits > 10 && last2Digits < 20) {
                    return number + '-ŃĐ¸';
                } else if (lastDigit === 1) {
                    return number + '-Đ˛Đ¸';
                } else if (lastDigit === 2) {
                    return number + '-ŃĐ¸';
                } else if (lastDigit === 7 || lastDigit === 8) {
                    return number + '-ĐźĐ¸';
                } else {
                    return number + '-ŃĐ¸';
                }
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Bengali (bn)
// author : Kaushik Gandhi : https://github.com/kaushikgandhi

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'ŕ§§',
                '2': 'ŕ§¨',
                '3': 'ŕ§Š',
                '4': 'ŕ§Ş',
                '5': 'ŕ§Ť',
                '6': 'ŕ§Ź',
                '7': 'ŕ§­',
                '8': 'ŕ§Ž',
                '9': 'ŕ§Ż',
                '0': 'ŕ§Ś'
            },
            numberMap = {
                'ŕ§§': '1',
                'ŕ§¨': '2',
                'ŕ§Š': '3',
                'ŕ§Ş': '4',
                'ŕ§Ť': '5',
                'ŕ§Ź': '6',
                'ŕ§­': '7',
                'ŕ§Ž': '8',
                'ŕ§Ż': '9',
                'ŕ§Ś': '0'
            };

        return moment.lang('bn', {
            months : 'ŕŚŕŚžŕŚ¨ŕ§ŕ§ŕŚžŕŚ°ŕ§_ŕŚŤŕ§ŕŚŹŕ§ŕ§ŕŚžŕŚ°ŕ§_ŕŚŽŕŚžŕŚ°ŕ§ŕŚ_ŕŚŕŚŞŕ§ŕŚ°ŕŚżŕŚ˛_ŕŚŽŕ§_ŕŚŕ§ŕŚ¨_ŕŚŕ§ŕŚ˛ŕŚžŕŚ_ŕŚŕŚŕŚžŕŚ¸ŕ§ŕŚ_ŕŚ¸ŕ§ŕŚŞŕ§ŕŚŕ§ŕŚŽŕ§ŕŚŹŕŚ°_ŕŚŕŚŕ§ŕŚŕ§ŕŚŹŕŚ°_ŕŚ¨ŕŚ­ŕ§ŕŚŽŕ§ŕŚŹŕŚ°_ŕŚĄŕŚżŕŚ¸ŕ§ŕŚŽŕ§ŕŚŹŕŚ°'.split("_"),
            monthsShort : 'ŕŚŕŚžŕŚ¨ŕ§_ŕŚŤŕ§ŕŚŹ_ŕŚŽŕŚžŕŚ°ŕ§ŕŚ_ŕŚŕŚŞŕŚ°_ŕŚŽŕ§_ŕŚŕ§ŕŚ¨_ŕŚŕ§ŕŚ˛_ŕŚŕŚ_ŕŚ¸ŕ§ŕŚŞŕ§ŕŚ_ŕŚŕŚŕ§ŕŚŕ§_ŕŚ¨ŕŚ­_ŕŚĄŕŚżŕŚ¸ŕ§ŕŚŽŕ§'.split("_"),
            weekdays : 'ŕŚ°ŕŚŹŕŚżŕŚŹŕŚžŕŚ°_ŕŚ¸ŕ§ŕŚŽŕŚŹŕŚžŕŚ°_ŕŚŽŕŚŕ§ŕŚŕŚ˛ŕŚŹŕŚžŕŚ°_ŕŚŹŕ§ŕŚ§ŕŚŹŕŚžŕŚ°_ŕŚŹŕ§ŕŚšŕŚ¸ŕ§ŕŚŞŕŚ¤ŕ§ŕŚ¤ŕŚżŕŚŹŕŚžŕŚ°_ŕŚśŕ§ŕŚŕ§ŕŚ°ŕ§ŕŚŹŕŚžŕŚ°_ŕŚśŕŚ¨ŕŚżŕŚŹŕŚžŕŚ°'.split("_"),
            weekdaysShort : 'ŕŚ°ŕŚŹŕŚż_ŕŚ¸ŕ§ŕŚŽ_ŕŚŽŕŚŕ§ŕŚŕŚ˛_ŕŚŹŕ§ŕŚ§_ŕŚŹŕ§ŕŚšŕŚ¸ŕ§ŕŚŞŕŚ¤ŕ§ŕŚ¤ŕŚż_ŕŚśŕ§ŕŚŕ§ŕŚ°ŕ§_ŕŚśŕŚ¨ŕŚż'.split("_"),
            weekdaysMin : 'ŕŚ°ŕŚŹ_ŕŚ¸ŕŚŽ_ŕŚŽŕŚŕ§ŕŚ_ŕŚŹŕ§_ŕŚŹŕ§ŕŚ°ŕŚżŕŚš_ŕŚśŕ§_ŕŚśŕŚ¨ŕŚż'.split("_"),
            longDateFormat : {
                LT : "A h:mm ŕŚ¸ŕŚŽŕ§",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY, LT",
                LLLL : "dddd, D MMMM YYYY, LT"
            },
            calendar : {
                sameDay : '[ŕŚŕŚ] LT',
                nextDay : '[ŕŚŕŚŕŚžŕŚŽŕ§ŕŚŕŚžŕŚ˛] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[ŕŚŕŚ¤ŕŚŕŚžŕŚ˛] LT',
                lastWeek : '[ŕŚŕŚ¤] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s ŕŚŞŕŚ°ŕ§",
                past : "%s ŕŚŕŚŕ§",
                s : "ŕŚŕŚŕŚ ŕŚ¸ŕ§ŕŚŕ§ŕŚ¨ŕ§ŕŚĄ",
                m : "ŕŚŕŚ ŕŚŽŕŚżŕŚ¨ŕŚżŕŚ",
                mm : "%d ŕŚŽŕŚżŕŚ¨ŕŚżŕŚ",
                h : "ŕŚŕŚ ŕŚŕŚ¨ŕ§ŕŚŕŚž",
                hh : "%d ŕŚŕŚ¨ŕ§ŕŚŕŚž",
                d : "ŕŚŕŚ ŕŚŚŕŚżŕŚ¨",
                dd : "%d ŕŚŚŕŚżŕŚ¨",
                M : "ŕŚŕŚ ŕŚŽŕŚžŕŚ¸",
                MM : "%d ŕŚŽŕŚžŕŚ¸",
                y : "ŕŚŕŚ ŕŚŹŕŚŕŚ°",
                yy : "%d ŕŚŹŕŚŕŚ°"
            },
            preparse: function (string) {
                return string.replace(/[ŕ§§ŕ§¨ŕ§Šŕ§Şŕ§Ťŕ§Źŕ§­ŕ§Žŕ§Żŕ§Ś]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            //Bengali is a vast language its spoken 
            //in different forms in various parts of the world.
            //I have just generalized with most common one used
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return "ŕŚ°ŕŚžŕŚ¤";
                } else if (hour < 10) {
                    return "ŕŚśŕŚŕŚžŕŚ˛";
                } else if (hour < 17) {
                    return "ŕŚŚŕ§ŕŚŞŕ§ŕŚ°";
                } else if (hour < 20) {
                    return "ŕŚŹŕŚżŕŚŕ§ŕŚ˛";
                } else {
                    return "ŕŚ°ŕŚžŕŚ¤";
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : breton (br)
// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function relativeTimeWithMutation(number, withoutSuffix, key) {
            var format = {
                'mm': "munutenn",
                'MM': "miz",
                'dd': "devezh"
            };
            return number + ' ' + mutation(format[key], number);
        }

        function specialMutationForYears(number) {
            switch (lastNumber(number)) {
                case 1:
                case 3:
                case 4:
                case 5:
                case 9:
                    return number + ' bloaz';
                default:
                    return number + ' vloaz';
            }
        }

        function lastNumber(number) {
            if (number > 9) {
                return lastNumber(number % 10);
            }
            return number;
        }

        function mutation(text, number) {
            if (number === 2) {
                return softMutation(text);
            }
            return text;
        }

        function softMutation(text) {
            var mutationTable = {
                'm': 'v',
                'b': 'v',
                'd': 'z'
            };
            if (mutationTable[text.charAt(0)] === undefined) {
                return text;
            }
            return mutationTable[text.charAt(0)] + text.substring(1);
        }

        return moment.lang('br', {
            months : "Genver_C'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),
            monthsShort : "Gen_C'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),
            weekdays : "Sul_Lun_Meurzh_Merc'her_Yaou_Gwener_Sadorn".split("_"),
            weekdaysShort : "Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),
            weekdaysMin : "Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),
            longDateFormat : {
                LT : "h[e]mm A",
                L : "DD/MM/YYYY",
                LL : "D [a viz] MMMM YYYY",
                LLL : "D [a viz] MMMM YYYY LT",
                LLLL : "dddd, D [a viz] MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[Hiziv da] LT',
                nextDay : '[Warc\'hoazh da] LT',
                nextWeek : 'dddd [da] LT',
                lastDay : '[Dec\'h da] LT',
                lastWeek : 'dddd [paset da] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "a-benn %s",
                past : "%s 'zo",
                s : "un nebeud segondennoĂš",
                m : "ur vunutenn",
                mm : relativeTimeWithMutation,
                h : "un eur",
                hh : "%d eur",
                d : "un devezh",
                dd : relativeTimeWithMutation,
                M : "ur miz",
                MM : relativeTimeWithMutation,
                y : "ur bloaz",
                yy : specialMutationForYears
            },
            ordinal : function (number) {
                var output = (number === 1) ? 'aĂą' : 'vet';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : bosnian (bs)
// author : Nedim Cholich : https://github.com/frontyard
// based on (hr) translation by Bojan MarkoviÄ

    (function (factory) {
        factory(moment);
    }(function (moment) {

        function translate(number, withoutSuffix, key) {
            var result = number + " ";
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'jedna minuta' : 'jedne minute';
                case 'mm':
                    if (number === 1) {
                        result += 'minuta';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'minute';
                    } else {
                        result += 'minuta';
                    }
                    return result;
                case 'h':
                    return withoutSuffix ? 'jedan sat' : 'jednog sata';
                case 'hh':
                    if (number === 1) {
                        result += 'sat';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'sata';
                    } else {
                        result += 'sati';
                    }
                    return result;
                case 'dd':
                    if (number === 1) {
                        result += 'dan';
                    } else {
                        result += 'dana';
                    }
                    return result;
                case 'MM':
                    if (number === 1) {
                        result += 'mjesec';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'mjeseca';
                    } else {
                        result += 'mjeseci';
                    }
                    return result;
                case 'yy':
                    if (number === 1) {
                        result += 'godina';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'godine';
                    } else {
                        result += 'godina';
                    }
                    return result;
            }
        }

        return moment.lang('bs', {
            months : "januar_februar_mart_april_maj_juni_juli_avgust_septembar_oktobar_novembar_decembar".split("_"),
            monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
            weekdays : "nedjelja_ponedjeljak_utorak_srijeda_Äetvrtak_petak_subota".split("_"),
            weekdaysShort : "ned._pon._uto._sri._Äet._pet._sub.".split("_"),
            weekdaysMin : "ne_po_ut_sr_Äe_pe_su".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD. MM. YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay  : '[danas u] LT',
                nextDay  : '[sutra u] LT',

                nextWeek : function () {
                    switch (this.day()) {
                        case 0:
                            return '[u] [nedjelju] [u] LT';
                        case 3:
                            return '[u] [srijedu] [u] LT';
                        case 6:
                            return '[u] [subotu] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[u] dddd [u] LT';
                    }
                },
                lastDay  : '[juÄer u] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                            return '[proĹĄlu] dddd [u] LT';
                        case 6:
                            return '[proĹĄle] [subote] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[proĹĄli] dddd [u] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "za %s",
                past   : "prije %s",
                s      : "par sekundi",
                m      : translate,
                mm     : translate,
                h      : translate,
                hh     : translate,
                d      : "dan",
                dd     : translate,
                M      : "mjesec",
                MM     : translate,
                y      : "godinu",
                yy     : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : catalan (ca)
// author : Juan G. Hurtado : https://github.com/juanghurtado

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('ca', {
            months : "gener_febrer_marĂ§_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"),
            monthsShort : "gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.".split("_"),
            weekdays : "diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"),
            weekdaysShort : "dg._dl._dt._dc._dj._dv._ds.".split("_"),
            weekdaysMin : "Dg_Dl_Dt_Dc_Dj_Dv_Ds".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay : function () {
                    return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                nextDay : function () {
                    return '[demĂ  a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                nextWeek : function () {
                    return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                lastDay : function () {
                    return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                lastWeek : function () {
                    return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "en %s",
                past : "fa %s",
                s : "uns segons",
                m : "un minut",
                mm : "%d minuts",
                h : "una hora",
                hh : "%d hores",
                d : "un dia",
                dd : "%d dies",
                M : "un mes",
                MM : "%d mesos",
                y : "un any",
                yy : "%d anys"
            },
            ordinal : '%dÂş',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : czech (cs)
// author : petrbela : https://github.com/petrbela

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var months = "leden_Ăşnor_bĹezen_duben_kvÄten_Äerven_Äervenec_srpen_zĂĄĹĂ­_ĹĂ­jen_listopad_prosinec".split("_"),
            monthsShort = "led_Ăşno_bĹe_dub_kvÄ_Ävn_Ävc_srp_zĂĄĹ_ĹĂ­j_lis_pro".split("_");

        function plural(n) {
            return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + " ";
            switch (key) {
                case 's':  // a few seconds / in a few seconds / a few seconds ago
                    return (withoutSuffix || isFuture) ? 'pĂĄr sekund' : 'pĂĄr sekundami';
                case 'm':  // a minute / in a minute / a minute ago
                    return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
                case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'minuty' : 'minut');
                    } else {
                        return result + 'minutami';
                    }
                    break;
                case 'h':  // an hour / in an hour / an hour ago
                    return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
                case 'hh': // 9 hours / in 9 hours / 9 hours ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'hodiny' : 'hodin');
                    } else {
                        return result + 'hodinami';
                    }
                    break;
                case 'd':  // a day / in a day / a day ago
                    return (withoutSuffix || isFuture) ? 'den' : 'dnem';
                case 'dd': // 9 days / in 9 days / 9 days ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'dny' : 'dnĂ­');
                    } else {
                        return result + 'dny';
                    }
                    break;
                case 'M':  // a month / in a month / a month ago
                    return (withoutSuffix || isFuture) ? 'mÄsĂ­c' : 'mÄsĂ­cem';
                case 'MM': // 9 months / in 9 months / 9 months ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'mÄsĂ­ce' : 'mÄsĂ­cĹŻ');
                    } else {
                        return result + 'mÄsĂ­ci';
                    }
                    break;
                case 'y':  // a year / in a year / a year ago
                    return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
                case 'yy': // 9 years / in 9 years / 9 years ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'roky' : 'let');
                    } else {
                        return result + 'lety';
                    }
                    break;
            }
        }

        return moment.lang('cs', {
            months : months,
            monthsShort : monthsShort,
            monthsParse : (function (months, monthsShort) {
                var i, _monthsParse = [];
                for (i = 0; i < 12; i++) {
                    // use custom parser to solve problem with July (Äervenec)
                    _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
                }
                return _monthsParse;
            }(months, monthsShort)),
            weekdays : "nedÄle_pondÄlĂ­_ĂşterĂ˝_stĹeda_Ätvrtek_pĂĄtek_sobota".split("_"),
            weekdaysShort : "ne_po_Ăşt_st_Ät_pĂĄ_so".split("_"),
            weekdaysMin : "ne_po_Ăşt_st_Ät_pĂĄ_so".split("_"),
            longDateFormat : {
                LT: "H.mm",
                L : "DD.Â MM.Â YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd D. MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[dnes v] LT",
                nextDay: '[zĂ­tra v] LT',
                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[v nedÄli v] LT';
                        case 1:
                        case 2:
                            return '[v] dddd [v] LT';
                        case 3:
                            return '[ve stĹedu v] LT';
                        case 4:
                            return '[ve Ätvrtek v] LT';
                        case 5:
                            return '[v pĂĄtek v] LT';
                        case 6:
                            return '[v sobotu v] LT';
                    }
                },
                lastDay: '[vÄera v] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[minulou nedÄli v] LT';
                        case 1:
                        case 2:
                            return '[minulĂŠ] dddd [v] LT';
                        case 3:
                            return '[minulou stĹedu v] LT';
                        case 4:
                        case 5:
                            return '[minulĂ˝] dddd [v] LT';
                        case 6:
                            return '[minulou sobotu v] LT';
                    }
                },
                sameElse: "L"
            },
            relativeTime : {
                future : "za %s",
                past : "pĹed %s",
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : chuvash (cv)
// author : Anatoly Mironov : https://github.com/mirontoli

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('cv', {
            months : "ĐşÄŃĐťĐ°Ń_Đ˝Đ°ŃÄŃ_ĐżŃŃ_Đ°ĐşĐ°_ĐźĐ°Đš_Ă§ÄŃŃĐźĐľ_ŃŃÄ_Ă§ŃŃĐťĐ°_Đ°Đ˛ÄĐ˝_ŃĐżĐ°_ŃÓłĐş_ŃĐ°ŃŃĐ°Đ˛".split("_"),
            monthsShort : "ĐşÄŃ_Đ˝Đ°Ń_ĐżŃŃ_Đ°ĐşĐ°_ĐźĐ°Đš_Ă§ÄŃ_ŃŃÄ_Ă§ŃŃ_Đ°Đ˛_ŃĐżĐ°_ŃÓłĐş_ŃĐ°Ń".split("_"),
            weekdays : "Đ˛ŃŃŃĐ°ŃĐ˝Đ¸ĐşŃĐ˝_ŃŃĐ˝ŃĐ¸ĐşŃĐ˝_ŃŃĐťĐ°ŃĐ¸ĐşŃĐ˝_ŃĐ˝ĐşŃĐ˝_ĐşÄĂ§Đ˝ĐľŃĐ˝Đ¸ĐşŃĐ˝_ŃŃĐ˝ĐľĐşŃĐ˝_ŃÄĐźĐ°ŃĐşŃĐ˝".split("_"),
            weekdaysShort : "Đ˛ŃŃ_ŃŃĐ˝_ŃŃĐť_ŃĐ˝_ĐşÄĂ§_ŃŃĐ˝_ŃÄĐź".split("_"),
            weekdaysMin : "Đ˛Ń_ŃĐ˝_ŃŃ_ŃĐ˝_ĐşĂ§_ŃŃ_ŃĐź".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD-MM-YYYY",
                LL : "YYYY [Ă§ŃĐťŃĐ¸] MMMM [ŃĐšÄŃÄĐ˝] D[-ĐźÄŃÄ]",
                LLL : "YYYY [Ă§ŃĐťŃĐ¸] MMMM [ŃĐšÄŃÄĐ˝] D[-ĐźÄŃÄ], LT",
                LLLL : "dddd, YYYY [Ă§ŃĐťŃĐ¸] MMMM [ŃĐšÄŃÄĐ˝] D[-ĐźÄŃÄ], LT"
            },
            calendar : {
                sameDay: '[ĐĐ°ŃĐ˝] LT [ŃĐľŃĐľŃŃĐľ]',
                nextDay: '[ĐŤŃĐ°Đ˝] LT [ŃĐľŃĐľŃŃĐľ]',
                lastDay: '[ÄĐ˝ĐľŃ] LT [ŃĐľŃĐľŃŃĐľ]',
                nextWeek: '[ĂĐ¸ŃĐľŃ] dddd LT [ŃĐľŃĐľŃŃĐľ]',
                lastWeek: '[ĐŃŃĐ˝Ä] dddd LT [ŃĐľŃĐľŃŃĐľ]',
                sameElse: 'L'
            },
            relativeTime : {
                future : function (output) {
                    var affix = /ŃĐľŃĐľŃ$/i.exec(output) ? "ŃĐľĐ˝" : /Ă§ŃĐť$/i.exec(output) ? "ŃĐ°Đ˝" : "ŃĐ°Đ˝";
                    return output + affix;
                },
                past : "%s ĐşĐ°ŃĐťĐťĐ°",
                s : "ĐżÄŃ-Đ¸Đş Ă§ĐľĐşĐşŃĐ˝Ń",
                m : "ĐżÄŃ ĐźĐ¸Đ˝ŃŃ",
                mm : "%d ĐźĐ¸Đ˝ŃŃ",
                h : "ĐżÄŃ ŃĐľŃĐľŃ",
                hh : "%d ŃĐľŃĐľŃ",
                d : "ĐżÄŃ ĐşŃĐ˝",
                dd : "%d ĐşŃĐ˝",
                M : "ĐżÄŃ ŃĐšÄŃ",
                MM : "%d ŃĐšÄŃ",
                y : "ĐżÄŃ Ă§ŃĐť",
                yy : "%d Ă§ŃĐť"
            },
            ordinal : '%d-ĐźÄŃ',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Welsh (cy)
// author : Robert Allen

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang("cy", {
            months: "Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr".split("_"),
            monthsShort: "Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag".split("_"),
            weekdays: "Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn".split("_"),
            weekdaysShort: "Sul_Llun_Maw_Mer_Iau_Gwe_Sad".split("_"),
            weekdaysMin: "Su_Ll_Ma_Me_Ia_Gw_Sa".split("_"),
            // time formats are the same as en-gb
            longDateFormat: {
                LT: "HH:mm",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY LT",
                LLLL: "dddd, D MMMM YYYY LT"
            },
            calendar: {
                sameDay: '[Heddiw am] LT',
                nextDay: '[Yfory am] LT',
                nextWeek: 'dddd [am] LT',
                lastDay: '[Ddoe am] LT',
                lastWeek: 'dddd [diwethaf am] LT',
                sameElse: 'L'
            },
            relativeTime: {
                future: "mewn %s",
                past: "%s yn Ă´l",
                s: "ychydig eiliadau",
                m: "munud",
                mm: "%d munud",
                h: "awr",
                hh: "%d awr",
                d: "diwrnod",
                dd: "%d diwrnod",
                M: "mis",
                MM: "%d mis",
                y: "blwyddyn",
                yy: "%d flynedd"
            },
            // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
            ordinal: function (number) {
                var b = number,
                    output = '',
                    lookup = [
                        '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                        'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
                    ];

                if (b > 20) {
                    if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                        output = 'fed'; // not 30ain, 70ain or 90ain
                    } else {
                        output = 'ain';
                    }
                } else if (b > 0) {
                    output = lookup[b];
                }

                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : danish (da)
// author : Ulrik Nielsen : https://github.com/mrbase

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('da', {
            months : "januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"),
            monthsShort : "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
            weekdays : "sĂ¸ndag_mandag_tirsdag_onsdag_torsdag_fredag_lĂ¸rdag".split("_"),
            weekdaysShort : "sĂ¸n_man_tir_ons_tor_fre_lĂ¸r".split("_"),
            weekdaysMin : "sĂ¸_ma_ti_on_to_fr_lĂ¸".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd [d.] D. MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[I dag kl.] LT',
                nextDay : '[I morgen kl.] LT',
                nextWeek : 'dddd [kl.] LT',
                lastDay : '[I gĂĽr kl.] LT',
                lastWeek : '[sidste] dddd [kl] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "om %s",
                past : "%s siden",
                s : "fĂĽ sekunder",
                m : "et minut",
                mm : "%d minutter",
                h : "en time",
                hh : "%d timer",
                d : "en dag",
                dd : "%d dage",
                M : "en mĂĽned",
                MM : "%d mĂĽneder",
                y : "et ĂĽr",
                yy : "%d ĂĽr"
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : austrian german (de-at)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensĂşle: https://github.com/Oire
// author : Martin Groller : https://github.com/MadMG

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                'm': ['eine Minute', 'einer Minute'],
                'h': ['eine Stunde', 'einer Stunde'],
                'd': ['ein Tag', 'einem Tag'],
                'dd': [number + ' Tage', number + ' Tagen'],
                'M': ['ein Monat', 'einem Monat'],
                'MM': [number + ' Monate', number + ' Monaten'],
                'y': ['ein Jahr', 'einem Jahr'],
                'yy': [number + ' Jahre', number + ' Jahren']
            };
            return withoutSuffix ? format[key][0] : format[key][1];
        }

        return moment.lang('de-at', {
            months : "JĂ¤nner_Februar_MĂ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort : "JĂ¤n._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
            weekdays : "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
            weekdaysShort : "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
            weekdaysMin : "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            longDateFormat : {
                LT: "HH:mm [Uhr]",
                L : "DD.MM.YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[Heute um] LT",
                sameElse: "L",
                nextDay: '[Morgen um] LT',
                nextWeek: 'dddd [um] LT',
                lastDay: '[Gestern um] LT',
                lastWeek: '[letzten] dddd [um] LT'
            },
            relativeTime : {
                future : "in %s",
                past : "vor %s",
                s : "ein paar Sekunden",
                m : processRelativeTime,
                mm : "%d Minuten",
                h : processRelativeTime,
                hh : "%d Stunden",
                d : processRelativeTime,
                dd : processRelativeTime,
                M : processRelativeTime,
                MM : processRelativeTime,
                y : processRelativeTime,
                yy : processRelativeTime
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : german (de)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensĂşle: https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                'm': ['eine Minute', 'einer Minute'],
                'h': ['eine Stunde', 'einer Stunde'],
                'd': ['ein Tag', 'einem Tag'],
                'dd': [number + ' Tage', number + ' Tagen'],
                'M': ['ein Monat', 'einem Monat'],
                'MM': [number + ' Monate', number + ' Monaten'],
                'y': ['ein Jahr', 'einem Jahr'],
                'yy': [number + ' Jahre', number + ' Jahren']
            };
            return withoutSuffix ? format[key][0] : format[key][1];
        }

        return moment.lang('de', {
            months : "Januar_Februar_MĂ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort : "Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
            weekdays : "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
            weekdaysShort : "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
            weekdaysMin : "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
            longDateFormat : {
                LT: "HH:mm [Uhr]",
                L : "DD.MM.YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[Heute um] LT",
                sameElse: "L",
                nextDay: '[Morgen um] LT',
                nextWeek: 'dddd [um] LT',
                lastDay: '[Gestern um] LT',
                lastWeek: '[letzten] dddd [um] LT'
            },
            relativeTime : {
                future : "in %s",
                past : "vor %s",
                s : "ein paar Sekunden",
                m : processRelativeTime,
                mm : "%d Minuten",
                h : processRelativeTime,
                hh : "%d Stunden",
                d : processRelativeTime,
                dd : processRelativeTime,
                M : processRelativeTime,
                MM : processRelativeTime,
                y : processRelativeTime,
                yy : processRelativeTime
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : modern greek (el)
// author : Aggelos Karalias : https://github.com/mehiel

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('el', {
            monthsNominativeEl : "ÎÎąÎ˝ÎżĎÎŹĎÎšÎżĎ_ÎŚÎľÎ˛ĎÎżĎÎŹĎÎšÎżĎ_ÎÎŹĎĎÎšÎżĎ_ÎĎĎÎŻÎťÎšÎżĎ_ÎÎŹÎšÎżĎ_ÎÎżĎÎ˝ÎšÎżĎ_ÎÎżĎÎťÎšÎżĎ_ÎĎÎłÎżĎĎĎÎżĎ_ÎŁÎľĎĎÎ­ÎźÎ˛ĎÎšÎżĎ_ÎÎşĎĎÎ˛ĎÎšÎżĎ_ÎÎżÎ­ÎźÎ˛ĎÎšÎżĎ_ÎÎľÎşÎ­ÎźÎ˛ĎÎšÎżĎ".split("_"),
            monthsGenitiveEl : "ÎÎąÎ˝ÎżĎÎąĎÎŻÎżĎ_ÎŚÎľÎ˛ĎÎżĎÎąĎÎŻÎżĎ_ÎÎąĎĎÎŻÎżĎ_ÎĎĎÎšÎťÎŻÎżĎ_ÎÎąÎÎżĎ_ÎÎżĎÎ˝ÎŻÎżĎ_ÎÎżĎÎťÎŻÎżĎ_ÎĎÎłÎżĎĎĎÎżĎ_ÎŁÎľĎĎÎľÎźÎ˛ĎÎŻÎżĎ_ÎÎşĎĎÎ˛ĎÎŻÎżĎ_ÎÎżÎľÎźÎ˛ĎÎŻÎżĎ_ÎÎľÎşÎľÎźÎ˛ĎÎŻÎżĎ".split("_"),
            months : function (momentToFormat, format) {
                if (/D/.test(format.substring(0, format.indexOf("MMMM")))) { // if there is a day number before 'MMMM'
                    return this._monthsGenitiveEl[momentToFormat.month()];
                } else {
                    return this._monthsNominativeEl[momentToFormat.month()];
                }
            },
            monthsShort : "ÎÎąÎ˝_ÎŚÎľÎ˛_ÎÎąĎ_ÎĎĎ_ÎÎąĎ_ÎÎżĎÎ˝_ÎÎżĎÎť_ÎĎÎł_ÎŁÎľĎ_ÎÎşĎ_ÎÎżÎľ_ÎÎľÎş".split("_"),
            weekdays : "ÎĎĎÎšÎąÎşÎŽ_ÎÎľĎĎÎ­ĎÎą_Î¤ĎÎŻĎÎˇ_Î¤ÎľĎÎŹĎĎÎˇ_Î Î­ÎźĎĎÎˇ_Î ÎąĎÎąĎÎşÎľĎÎŽ_ÎŁÎŹÎ˛Î˛ÎąĎÎż".split("_"),
            weekdaysShort : "ÎĎĎ_ÎÎľĎ_Î¤ĎÎš_Î¤ÎľĎ_Î ÎľÎź_Î ÎąĎ_ÎŁÎąÎ˛".split("_"),
            weekdaysMin : "ÎĎ_ÎÎľ_Î¤Ď_Î¤Îľ_Î Îľ_Î Îą_ÎŁÎą".split("_"),
            meridiem : function (hours, minutes, isLower) {
                if (hours > 11) {
                    return isLower ? 'ÎźÎź' : 'ÎÎ';
                } else {
                    return isLower ? 'ĎÎź' : 'Î Î';
                }
            },
            longDateFormat : {
                LT : "h:mm A",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendarEl : {
                sameDay : '[ÎŁÎŽÎźÎľĎÎą {}] LT',
                nextDay : '[ÎĎĎÎšÎż {}] LT',
                nextWeek : 'dddd [{}] LT',
                lastDay : '[Î§Î¸ÎľĎ {}] LT',
                lastWeek : function() {
                    switch (this.day()) {
                        case 6:
                            return '[ĎÎż ĎĎÎżÎˇÎłÎżĎÎźÎľÎ˝Îż] dddd [{}] LT';
                        default:
                            return '[ĎÎˇÎ˝ ĎĎÎżÎˇÎłÎżĎÎźÎľÎ˝Îˇ] dddd [{}] LT';
                    }
                },
                sameElse : 'L'
            },
            calendar : function (key, mom) {
                var output = this._calendarEl[key],
                    hours = mom && mom.hours();

                if (typeof output === 'function') {
                    output = output.apply(mom);
                }

                return output.replace("{}", (hours % 12 === 1 ? "ĎĎÎˇ" : "ĎĎÎšĎ"));
            },
            relativeTime : {
                future : "ĎÎľ %s",
                past : "%s ĎĎÎšÎ˝",
                s : "Î´ÎľĎĎÎľĎĎÎťÎľĎĎÎą",
                m : "Î­Î˝Îą ÎťÎľĎĎĎ",
                mm : "%d ÎťÎľĎĎÎŹ",
                h : "ÎźÎŻÎą ĎĎÎą",
                hh : "%d ĎĎÎľĎ",
                d : "ÎźÎŻÎą ÎźÎ­ĎÎą",
                dd : "%d ÎźÎ­ĎÎľĎ",
                M : "Î­Î˝ÎąĎ ÎźÎŽÎ˝ÎąĎ",
                MM : "%d ÎźÎŽÎ˝ÎľĎ",
                y : "Î­Î˝ÎąĎ ĎĎĎÎ˝ÎżĎ",
                yy : "%d ĎĎĎÎ˝ÎšÎą"
            },
            ordinal : function (number) {
                return number + 'Îˇ';
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : australian english (en-au)

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('en-au', {
            months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat : {
                LT : "h:mm A",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "in %s",
                past : "%s ago",
                s : "a few seconds",
                m : "a minute",
                mm : "%d minutes",
                h : "an hour",
                hh : "%d hours",
                d : "a day",
                dd : "%d days",
                M : "a month",
                MM : "%d months",
                y : "a year",
                yy : "%d years"
            },
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~ (number % 100 / 10) === 1) ? 'th' :
                        (b === 1) ? 'st' :
                            (b === 2) ? 'nd' :
                                (b === 3) ? 'rd' : 'th';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : canadian english (en-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('en-ca', {
            months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat : {
                LT : "h:mm A",
                L : "YYYY-MM-DD",
                LL : "D MMMM, YYYY",
                LLL : "D MMMM, YYYY LT",
                LLLL : "dddd, D MMMM, YYYY LT"
            },
            calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "in %s",
                past : "%s ago",
                s : "a few seconds",
                m : "a minute",
                mm : "%d minutes",
                h : "an hour",
                hh : "%d hours",
                d : "a day",
                dd : "%d days",
                M : "a month",
                MM : "%d months",
                y : "a year",
                yy : "%d years"
            },
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~ (number % 100 / 10) === 1) ? 'th' :
                        (b === 1) ? 'st' :
                            (b === 2) ? 'nd' :
                                (b === 3) ? 'rd' : 'th';
                return number + output;
            }
        });
    }));
// moment.js language configuration
// language : great britain english (en-gb)
// author : Chris Gedrim : https://github.com/chrisgedrim

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('en-gb', {
            months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "in %s",
                past : "%s ago",
                s : "a few seconds",
                m : "a minute",
                mm : "%d minutes",
                h : "an hour",
                hh : "%d hours",
                d : "a day",
                dd : "%d days",
                M : "a month",
                MM : "%d months",
                y : "a year",
                yy : "%d years"
            },
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~ (number % 100 / 10) === 1) ? 'th' :
                        (b === 1) ? 'st' :
                            (b === 2) ? 'nd' :
                                (b === 3) ? 'rd' : 'th';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : esperanto (eo)
// author : Colin Dean : https://github.com/colindean
// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('eo', {
            months : "januaro_februaro_marto_aprilo_majo_junio_julio_aĹ­gusto_septembro_oktobro_novembro_decembro".split("_"),
            monthsShort : "jan_feb_mar_apr_maj_jun_jul_aĹ­g_sep_okt_nov_dec".split("_"),
            weekdays : "DimanÄo_Lundo_Mardo_Merkredo_Ä´aĹ­do_Vendredo_Sabato".split("_"),
            weekdaysShort : "Dim_Lun_Mard_Merk_Ä´aĹ­_Ven_Sab".split("_"),
            weekdaysMin : "Di_Lu_Ma_Me_Ä´a_Ve_Sa".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "YYYY-MM-DD",
                LL : "D[-an de] MMMM, YYYY",
                LLL : "D[-an de] MMMM, YYYY LT",
                LLLL : "dddd, [la] D[-an de] MMMM, YYYY LT"
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours > 11) {
                    return isLower ? 'p.t.m.' : 'P.T.M.';
                } else {
                    return isLower ? 'a.t.m.' : 'A.T.M.';
                }
            },
            calendar : {
                sameDay : '[HodiaĹ­ je] LT',
                nextDay : '[MorgaĹ­ je] LT',
                nextWeek : 'dddd [je] LT',
                lastDay : '[HieraĹ­ je] LT',
                lastWeek : '[pasinta] dddd [je] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "je %s",
                past : "antaĹ­ %s",
                s : "sekundoj",
                m : "minuto",
                mm : "%d minutoj",
                h : "horo",
                hh : "%d horoj",
                d : "tago",//ne 'diurno', Äar estas uzita por proksimumo
                dd : "%d tagoj",
                M : "monato",
                MM : "%d monatoj",
                y : "jaro",
                yy : "%d jaroj"
            },
            ordinal : "%da",
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : spanish (es)
// author : Julio NapurĂ­ : https://github.com/julionc

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsShortDot = "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),
            monthsShort = "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_");

        return moment.lang('es', {
            months : "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
            monthsShort : function (m, format) {
                if (/-MMM-/.test(format)) {
                    return monthsShort[m.month()];
                } else {
                    return monthsShortDot[m.month()];
                }
            },
            weekdays : "domingo_lunes_martes_miĂŠrcoles_jueves_viernes_sĂĄbado".split("_"),
            weekdaysShort : "dom._lun._mar._miĂŠ._jue._vie._sĂĄb.".split("_"),
            weekdaysMin : "Do_Lu_Ma_Mi_Ju_Vi_SĂĄ".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD/MM/YYYY",
                LL : "D [de] MMMM [del] YYYY",
                LLL : "D [de] MMMM [del] YYYY LT",
                LLLL : "dddd, D [de] MMMM [del] YYYY LT"
            },
            calendar : {
                sameDay : function () {
                    return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                nextDay : function () {
                    return '[maĂąana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                nextWeek : function () {
                    return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                lastDay : function () {
                    return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                lastWeek : function () {
                    return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "en %s",
                past : "hace %s",
                s : "unos segundos",
                m : "un minuto",
                mm : "%d minutos",
                h : "una hora",
                hh : "%d horas",
                d : "un dĂ­a",
                dd : "%d dĂ­as",
                M : "un mes",
                MM : "%d meses",
                y : "un aĂąo",
                yy : "%d aĂąos"
            },
            ordinal : '%dÂş',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : estonian (et)
// author : Henry Kehlmann : https://github.com/madhenry
// improvements : Illimar Tambek : https://github.com/ragulka

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                's' : ['mĂľne sekundi', 'mĂľni sekund', 'paar sekundit'],
                'm' : ['Ăźhe minuti', 'Ăźks minut'],
                'mm': [number + ' minuti', number + ' minutit'],
                'h' : ['Ăźhe tunni', 'tund aega', 'Ăźks tund'],
                'hh': [number + ' tunni', number + ' tundi'],
                'd' : ['Ăźhe pĂ¤eva', 'Ăźks pĂ¤ev'],
                'M' : ['kuu aja', 'kuu aega', 'Ăźks kuu'],
                'MM': [number + ' kuu', number + ' kuud'],
                'y' : ['Ăźhe aasta', 'aasta', 'Ăźks aasta'],
                'yy': [number + ' aasta', number + ' aastat']
            };
            if (withoutSuffix) {
                return format[key][2] ? format[key][2] : format[key][1];
            }
            return isFuture ? format[key][0] : format[key][1];
        }

        return moment.lang('et', {
            months        : "jaanuar_veebruar_mĂ¤rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember".split("_"),
            monthsShort   : "jaan_veebr_mĂ¤rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets".split("_"),
            weekdays      : "pĂźhapĂ¤ev_esmaspĂ¤ev_teisipĂ¤ev_kolmapĂ¤ev_neljapĂ¤ev_reede_laupĂ¤ev".split("_"),
            weekdaysShort : "P_E_T_K_N_R_L".split("_"),
            weekdaysMin   : "P_E_T_K_N_R_L".split("_"),
            longDateFormat : {
                LT   : "H:mm",
                L    : "DD.MM.YYYY",
                LL   : "D. MMMM YYYY",
                LLL  : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay  : '[TĂ¤na,] LT',
                nextDay  : '[Homme,] LT',
                nextWeek : '[JĂ¤rgmine] dddd LT',
                lastDay  : '[Eile,] LT',
                lastWeek : '[Eelmine] dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s pĂ¤rast",
                past   : "%s tagasi",
                s      : processRelativeTime,
                m      : processRelativeTime,
                mm     : processRelativeTime,
                h      : processRelativeTime,
                hh     : processRelativeTime,
                d      : processRelativeTime,
                dd     : '%d pĂ¤eva',
                M      : processRelativeTime,
                MM     : processRelativeTime,
                y      : processRelativeTime,
                yy     : processRelativeTime
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : euskara (eu)
// author : Eneko Illarramendi : https://github.com/eillarra

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('eu', {
            months : "urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua".split("_"),
            monthsShort : "urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.".split("_"),
            weekdays : "igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata".split("_"),
            weekdaysShort : "ig._al._ar._az._og._ol._lr.".split("_"),
            weekdaysMin : "ig_al_ar_az_og_ol_lr".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "YYYY-MM-DD",
                LL : "YYYY[ko] MMMM[ren] D[a]",
                LLL : "YYYY[ko] MMMM[ren] D[a] LT",
                LLLL : "dddd, YYYY[ko] MMMM[ren] D[a] LT",
                l : "YYYY-M-D",
                ll : "YYYY[ko] MMM D[a]",
                lll : "YYYY[ko] MMM D[a] LT",
                llll : "ddd, YYYY[ko] MMM D[a] LT"
            },
            calendar : {
                sameDay : '[gaur] LT[etan]',
                nextDay : '[bihar] LT[etan]',
                nextWeek : 'dddd LT[etan]',
                lastDay : '[atzo] LT[etan]',
                lastWeek : '[aurreko] dddd LT[etan]',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s barru",
                past : "duela %s",
                s : "segundo batzuk",
                m : "minutu bat",
                mm : "%d minutu",
                h : "ordu bat",
                hh : "%d ordu",
                d : "egun bat",
                dd : "%d egun",
                M : "hilabete bat",
                MM : "%d hilabete",
                y : "urte bat",
                yy : "%d urte"
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Persian Language
// author : Ebrahim Byagowi : https://github.com/ebraminio

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'Űą',
            '2': 'Ű˛',
            '3': 'Űł',
            '4': 'Ű´',
            '5': 'Űľ',
            '6': 'Űś',
            '7': 'Űˇ',
            '8': 'Ű¸',
            '9': 'Űš',
            '0': 'Ű°'
        }, numberMap = {
            'Űą': '1',
            'Ű˛': '2',
            'Űł': '3',
            'Ű´': '4',
            'Űľ': '5',
            'Űś': '6',
            'Űˇ': '7',
            'Ű¸': '8',
            'Űš': '9',
            'Ű°': '0'
        };

        return moment.lang('fa', {
            months : 'ÚŘ§ŮŮŰŮ_ŮŮŘąŰŮ_ŮŘ§ŘąŘł_Ř˘ŮŘąŰŮ_ŮŮ_ÚŮŘŚŮ_ÚŮŘŚŰŮ_Ř§ŮŘŞ_ŘłŮžŘŞŘ§ŮŘ¨Řą_Ř§ÚŠŘŞŘ¨Řą_ŮŮŘ§ŮŘ¨Řą_ŘŻŘłŘ§ŮŘ¨Řą'.split('_'),
            monthsShort : 'ÚŘ§ŮŮŰŮ_ŮŮŘąŰŮ_ŮŘ§ŘąŘł_Ř˘ŮŘąŰŮ_ŮŮ_ÚŮŘŚŮ_ÚŮŘŚŰŮ_Ř§ŮŘŞ_ŘłŮžŘŞŘ§ŮŘ¨Řą_Ř§ÚŠŘŞŘ¨Řą_ŮŮŘ§ŮŘ¨Řą_ŘŻŘłŘ§ŮŘ¨Řą'.split('_'),
            weekdays : 'ŰÚŠ\u200cŘ´ŮŘ¨Ů_ŘŻŮŘ´ŮŘ¨Ů_ŘłŮ\u200cŘ´ŮŘ¨Ů_ÚŮŘ§ŘąŘ´ŮŘ¨Ů_ŮžŮŘŹ\u200cŘ´ŮŘ¨Ů_ŘŹŮŘšŮ_Ř´ŮŘ¨Ů'.split('_'),
            weekdaysShort : 'ŰÚŠ\u200cŘ´ŮŘ¨Ů_ŘŻŮŘ´ŮŘ¨Ů_ŘłŮ\u200cŘ´ŮŘ¨Ů_ÚŮŘ§ŘąŘ´ŮŘ¨Ů_ŮžŮŘŹ\u200cŘ´ŮŘ¨Ů_ŘŹŮŘšŮ_Ř´ŮŘ¨Ů'.split('_'),
            weekdaysMin : 'Ű_ŘŻ_Řł_Ú_Ůž_ŘŹ_Ř´'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return "ŮŘ¨Ů Ř§Ř˛ Ř¸ŮŘą";
                } else {
                    return "Ř¨ŘšŘŻ Ř§Ř˛ Ř¸ŮŘą";
                }
            },
            calendar : {
                sameDay : '[Ř§ŮŘąŮŘ˛ ŘłŘ§ŘšŘŞ] LT',
                nextDay : '[ŮŘąŘŻŘ§ ŘłŘ§ŘšŘŞ] LT',
                nextWeek : 'dddd [ŘłŘ§ŘšŘŞ] LT',
                lastDay : '[ŘŻŰŘąŮŘ˛ ŘłŘ§ŘšŘŞ] LT',
                lastWeek : 'dddd [ŮžŰŘ´] [ŘłŘ§ŘšŘŞ] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'ŘŻŘą %s',
                past : '%s ŮžŰŘ´',
                s : 'ÚŮŘŻŰŮ ŘŤŘ§ŮŰŮ',
                m : 'ŰÚŠ ŘŻŮŰŮŮ',
                mm : '%d ŘŻŮŰŮŮ',
                h : 'ŰÚŠ ŘłŘ§ŘšŘŞ',
                hh : '%d ŘłŘ§ŘšŘŞ',
                d : 'ŰÚŠ ŘąŮŘ˛',
                dd : '%d ŘąŮŘ˛',
                M : 'ŰÚŠ ŮŘ§Ů',
                MM : '%d ŮŘ§Ů',
                y : 'ŰÚŠ ŘłŘ§Ů',
                yy : '%d ŘłŘ§Ů'
            },
            preparse: function (string) {
                return string.replace(/[Ű°-Űš]/g, function (match) {
                    return numberMap[match];
                }).replace(/Ř/g, ',');
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                }).replace(/,/g, 'Ř');
            },
            ordinal : '%dŮ',
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12 // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : finnish (fi)
// author : Tarmo Aidantausta : https://github.com/bleadof

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var numbersPast = 'nolla yksi kaksi kolme neljĂ¤ viisi kuusi seitsemĂ¤n kahdeksan yhdeksĂ¤n'.split(' '),
            numbersFuture = ['nolla', 'yhden', 'kahden', 'kolmen', 'neljĂ¤n', 'viiden', 'kuuden',
                numbersPast[7], numbersPast[8], numbersPast[9]];

        function translate(number, withoutSuffix, key, isFuture) {
            var result = "";
            switch (key) {
                case 's':
                    return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
                case 'm':
                    return isFuture ? 'minuutin' : 'minuutti';
                case 'mm':
                    result = isFuture ? 'minuutin' : 'minuuttia';
                    break;
                case 'h':
                    return isFuture ? 'tunnin' : 'tunti';
                case 'hh':
                    result = isFuture ? 'tunnin' : 'tuntia';
                    break;
                case 'd':
                    return isFuture ? 'pĂ¤ivĂ¤n' : 'pĂ¤ivĂ¤';
                case 'dd':
                    result = isFuture ? 'pĂ¤ivĂ¤n' : 'pĂ¤ivĂ¤Ă¤';
                    break;
                case 'M':
                    return isFuture ? 'kuukauden' : 'kuukausi';
                case 'MM':
                    result = isFuture ? 'kuukauden' : 'kuukautta';
                    break;
                case 'y':
                    return isFuture ? 'vuoden' : 'vuosi';
                case 'yy':
                    result = isFuture ? 'vuoden' : 'vuotta';
                    break;
            }
            result = verbalNumber(number, isFuture) + " " + result;
            return result;
        }

        function verbalNumber(number, isFuture) {
            return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
        }

        return moment.lang('fi', {
            months : "tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesĂ¤kuu_heinĂ¤kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"),
            monthsShort : "tammi_helmi_maalis_huhti_touko_kesĂ¤_heinĂ¤_elo_syys_loka_marras_joulu".split("_"),
            weekdays : "sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"),
            weekdaysShort : "su_ma_ti_ke_to_pe_la".split("_"),
            weekdaysMin : "su_ma_ti_ke_to_pe_la".split("_"),
            longDateFormat : {
                LT : "HH.mm",
                L : "DD.MM.YYYY",
                LL : "Do MMMM[ta] YYYY",
                LLL : "Do MMMM[ta] YYYY, [klo] LT",
                LLLL : "dddd, Do MMMM[ta] YYYY, [klo] LT",
                l : "D.M.YYYY",
                ll : "Do MMM YYYY",
                lll : "Do MMM YYYY, [klo] LT",
                llll : "ddd, Do MMM YYYY, [klo] LT"
            },
            calendar : {
                sameDay : '[tĂ¤nĂ¤Ă¤n] [klo] LT',
                nextDay : '[huomenna] [klo] LT',
                nextWeek : 'dddd [klo] LT',
                lastDay : '[eilen] [klo] LT',
                lastWeek : '[viime] dddd[na] [klo] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s pĂ¤Ă¤stĂ¤",
                past : "%s sitten",
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinal : "%d.",
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : faroese (fo)
// author : Ragnar Johannesen : https://github.com/ragnar123

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('fo', {
            months : "januar_februar_mars_aprĂ­l_mai_juni_juli_august_september_oktober_november_desember".split("_"),
            monthsShort : "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
            weekdays : "sunnudagur_mĂĄnadagur_tĂ˝sdagur_mikudagur_hĂłsdagur_frĂ­ggjadagur_leygardagur".split("_"),
            weekdaysShort : "sun_mĂĄn_tĂ˝s_mik_hĂłs_frĂ­_ley".split("_"),
            weekdaysMin : "su_mĂĄ_tĂ˝_mi_hĂł_fr_le".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D. MMMM, YYYY LT"
            },
            calendar : {
                sameDay : '[Ă dag kl.] LT',
                nextDay : '[Ă morgin kl.] LT',
                nextWeek : 'dddd [kl.] LT',
                lastDay : '[Ă gjĂĄr kl.] LT',
                lastWeek : '[sĂ­Ă°stu] dddd [kl] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "um %s",
                past : "%s sĂ­Ă°ani",
                s : "fĂĄ sekund",
                m : "ein minutt",
                mm : "%d minuttir",
                h : "ein tĂ­mi",
                hh : "%d tĂ­mar",
                d : "ein dagur",
                dd : "%d dagar",
                M : "ein mĂĄnaĂ°i",
                MM : "%d mĂĄnaĂ°ir",
                y : "eitt ĂĄr",
                yy : "%d ĂĄr"
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : canadian french (fr-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('fr-ca', {
            months : "janvier_fĂŠvrier_mars_avril_mai_juin_juillet_aoĂťt_septembre_octobre_novembre_dĂŠcembre".split("_"),
            monthsShort : "janv._fĂŠvr._mars_avr._mai_juin_juil._aoĂťt_sept._oct._nov._dĂŠc.".split("_"),
            weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
            weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
            weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "YYYY-MM-DD",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[Aujourd'hui Ă ] LT",
                nextDay: '[Demain Ă ] LT',
                nextWeek: 'dddd [Ă ] LT',
                lastDay: '[Hier Ă ] LT',
                lastWeek: 'dddd [dernier Ă ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "dans %s",
                past : "il y a %s",
                s : "quelques secondes",
                m : "une minute",
                mm : "%d minutes",
                h : "une heure",
                hh : "%d heures",
                d : "un jour",
                dd : "%d jours",
                M : "un mois",
                MM : "%d mois",
                y : "un an",
                yy : "%d ans"
            },
            ordinal : function (number) {
                return number + (number === 1 ? 'er' : '');
            }
        });
    }));
// moment.js language configuration
// language : french (fr)
// author : John Fischer : https://github.com/jfroffice

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('fr', {
            months : "janvier_fĂŠvrier_mars_avril_mai_juin_juillet_aoĂťt_septembre_octobre_novembre_dĂŠcembre".split("_"),
            monthsShort : "janv._fĂŠvr._mars_avr._mai_juin_juil._aoĂťt_sept._oct._nov._dĂŠc.".split("_"),
            weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
            weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
            weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[Aujourd'hui Ă ] LT",
                nextDay: '[Demain Ă ] LT',
                nextWeek: 'dddd [Ă ] LT',
                lastDay: '[Hier Ă ] LT',
                lastWeek: 'dddd [dernier Ă ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "dans %s",
                past : "il y a %s",
                s : "quelques secondes",
                m : "une minute",
                mm : "%d minutes",
                h : "une heure",
                hh : "%d heures",
                d : "un jour",
                dd : "%d jours",
                M : "un mois",
                MM : "%d mois",
                y : "un an",
                yy : "%d ans"
            },
            ordinal : function (number) {
                return number + (number === 1 ? 'er' : '');
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : galician (gl)
// author : Juan G. Hurtado : https://github.com/juanghurtado

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('gl', {
            months : "Xaneiro_Febreiro_Marzo_Abril_Maio_XuĂąo_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro".split("_"),
            monthsShort : "Xan._Feb._Mar._Abr._Mai._XuĂą._Xul._Ago._Set._Out._Nov._Dec.".split("_"),
            weekdays : "Domingo_Luns_Martes_MĂŠrcores_Xoves_Venres_SĂĄbado".split("_"),
            weekdaysShort : "Dom._Lun._Mar._MĂŠr._Xov._Ven._SĂĄb.".split("_"),
            weekdaysMin : "Do_Lu_Ma_MĂŠ_Xo_Ve_SĂĄ".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay : function () {
                    return '[hoxe ' + ((this.hours() !== 1) ? 'ĂĄs' : 'ĂĄ') + '] LT';
                },
                nextDay : function () {
                    return '[maĂąĂĄ ' + ((this.hours() !== 1) ? 'ĂĄs' : 'ĂĄ') + '] LT';
                },
                nextWeek : function () {
                    return 'dddd [' + ((this.hours() !== 1) ? 'ĂĄs' : 'a') + '] LT';
                },
                lastDay : function () {
                    return '[onte ' + ((this.hours() !== 1) ? 'ĂĄ' : 'a') + '] LT';
                },
                lastWeek : function () {
                    return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'ĂĄs' : 'a') + '] LT';
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : function (str) {
                    if (str === "uns segundos") {
                        return "nuns segundos";
                    }
                    return "en " + str;
                },
                past : "hai %s",
                s : "uns segundos",
                m : "un minuto",
                mm : "%d minutos",
                h : "unha hora",
                hh : "%d horas",
                d : "un dĂ­a",
                dd : "%d dĂ­as",
                M : "un mes",
                MM : "%d meses",
                y : "un ano",
                yy : "%d anos"
            },
            ordinal : '%dÂş',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Hebrew (he)
// author : Tomer Cohen : https://github.com/tomer
// author : Moshe Simantov : https://github.com/DevelopmentIL
// author : Tal Ater : https://github.com/TalAter

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('he', {
            months : "×× ×××¨_×¤××¨×××¨_××¨×Ľ_××¤×¨××_×××_××× ×_××××_×××××Ą×_×Ą×¤××××¨_×××§××××¨_× ×××××¨_××Ś×××¨".split("_"),
            monthsShort : "×× ××ł_×¤××¨×ł_××¨×Ľ_××¤×¨×ł_×××_××× ×_××××_××××ł_×Ą×¤××ł_×××§×ł_× ×××ł_××Ś××ł".split("_"),
            weekdays : "×¨××Š××_×Š× ×_×Š×××Š×_×¨×××˘×_××××Š×_×Š××Š×_×Š××Ş".split("_"),
            weekdaysShort : "××ł_××ł_××ł_××ł_××ł_××ł_×Š×ł".split("_"),
            weekdaysMin : "×_×_×_×_×_×_×Š".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D [×]MMMM YYYY",
                LLL : "D [×]MMMM YYYY LT",
                LLLL : "dddd, D [×]MMMM YYYY LT",
                l : "D/M/YYYY",
                ll : "D MMM YYYY",
                lll : "D MMM YYYY LT",
                llll : "ddd, D MMM YYYY LT"
            },
            calendar : {
                sameDay : '[×××× ×Öž]LT',
                nextDay : '[×××¨ ×Öž]LT',
                nextWeek : 'dddd [××Š×˘×] LT',
                lastDay : '[××Ş××× ×Öž]LT',
                lastWeek : '[××××] dddd [××××¨×× ××Š×˘×] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "××˘×× %s",
                past : "××¤× × %s",
                s : "××Ą×¤×¨ ×Š× ×××Ş",
                m : "××§×",
                mm : "%d ××§××Ş",
                h : "×Š×˘×",
                hh : function (number) {
                    if (number === 2) {
                        return "×Š×˘×Ş×××";
                    }
                    return number + " ×Š×˘××Ş";
                },
                d : "×××",
                dd : function (number) {
                    if (number === 2) {
                        return "××××××";
                    }
                    return number + " ××××";
                },
                M : "××××Š",
                MM : function (number) {
                    if (number === 2) {
                        return "××××Š×××";
                    }
                    return number + " ××××Š××";
                },
                y : "×Š× ×",
                yy : function (number) {
                    if (number === 2) {
                        return "×Š× ×Ş×××";
                    }
                    return number + " ×Š× ××";
                }
            }
        });
    }));
// moment.js language configuration
// language : hindi (hi)
// author : Mayank Singhal : https://github.com/mayanksinghal

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'ŕĽ§',
                '2': 'ŕĽ¨',
                '3': 'ŕĽŠ',
                '4': 'ŕĽŞ',
                '5': 'ŕĽŤ',
                '6': 'ŕĽŹ',
                '7': 'ŕĽ­',
                '8': 'ŕĽŽ',
                '9': 'ŕĽŻ',
                '0': 'ŕĽŚ'
            },
            numberMap = {
                'ŕĽ§': '1',
                'ŕĽ¨': '2',
                'ŕĽŠ': '3',
                'ŕĽŞ': '4',
                'ŕĽŤ': '5',
                'ŕĽŹ': '6',
                'ŕĽ­': '7',
                'ŕĽŽ': '8',
                'ŕĽŻ': '9',
                'ŕĽŚ': '0'
            };

        return moment.lang('hi', {
            months : 'ŕ¤ŕ¤¨ŕ¤ľŕ¤°ŕĽ_ŕ¤Ťŕ¤źŕ¤°ŕ¤ľŕ¤°ŕĽ_ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕĽŕ¤˛_ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕ¤žŕ¤_ŕ¤ŕ¤ŕ¤¸ŕĽŕ¤¤_ŕ¤¸ŕ¤żŕ¤¤ŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤ŕ¤ŕĽŕ¤ŕĽŕ¤Źŕ¤°_ŕ¤¨ŕ¤ľŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤Śŕ¤żŕ¤¸ŕ¤ŽŕĽŕ¤Źŕ¤°'.split("_"),
            monthsShort : 'ŕ¤ŕ¤¨._ŕ¤Ťŕ¤źŕ¤°._ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕĽ._ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛._ŕ¤ŕ¤._ŕ¤¸ŕ¤żŕ¤¤._ŕ¤ŕ¤ŕĽŕ¤ŕĽ._ŕ¤¨ŕ¤ľ._ŕ¤Śŕ¤żŕ¤¸.'.split("_"),
            weekdays : 'ŕ¤°ŕ¤ľŕ¤żŕ¤ľŕ¤žŕ¤°_ŕ¤¸ŕĽŕ¤Žŕ¤ľŕ¤žŕ¤°_ŕ¤Žŕ¤ŕ¤ŕ¤˛ŕ¤ľŕ¤žŕ¤°_ŕ¤ŹŕĽŕ¤§ŕ¤ľŕ¤žŕ¤°_ŕ¤ŕĽŕ¤°ŕĽŕ¤ľŕ¤žŕ¤°_ŕ¤śŕĽŕ¤ŕĽŕ¤°ŕ¤ľŕ¤žŕ¤°_ŕ¤śŕ¤¨ŕ¤żŕ¤ľŕ¤žŕ¤°'.split("_"),
            weekdaysShort : 'ŕ¤°ŕ¤ľŕ¤ż_ŕ¤¸ŕĽŕ¤Ž_ŕ¤Žŕ¤ŕ¤ŕ¤˛_ŕ¤ŹŕĽŕ¤§_ŕ¤ŕĽŕ¤°ŕĽ_ŕ¤śŕĽŕ¤ŕĽŕ¤°_ŕ¤śŕ¤¨ŕ¤ż'.split("_"),
            weekdaysMin : 'ŕ¤°_ŕ¤¸ŕĽ_ŕ¤Žŕ¤_ŕ¤ŹŕĽ_ŕ¤ŕĽ_ŕ¤śŕĽ_ŕ¤ś'.split("_"),
            longDateFormat : {
                LT : "A h:mm ŕ¤Źŕ¤ŕĽ",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY, LT",
                LLLL : "dddd, D MMMM YYYY, LT"
            },
            calendar : {
                sameDay : '[ŕ¤ŕ¤] LT',
                nextDay : '[ŕ¤ŕ¤˛] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[ŕ¤ŕ¤˛] LT',
                lastWeek : '[ŕ¤Şŕ¤żŕ¤ŕ¤˛ŕĽ] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s ŕ¤ŽŕĽŕ¤",
                past : "%s ŕ¤Şŕ¤šŕ¤˛ŕĽ",
                s : "ŕ¤ŕĽŕ¤ ŕ¤šŕĽ ŕ¤ŕĽŕ¤ˇŕ¤Ł",
                m : "ŕ¤ŕ¤ ŕ¤Žŕ¤żŕ¤¨ŕ¤",
                mm : "%d ŕ¤Žŕ¤żŕ¤¨ŕ¤",
                h : "ŕ¤ŕ¤ ŕ¤ŕ¤ŕ¤ŕ¤ž",
                hh : "%d ŕ¤ŕ¤ŕ¤ŕĽ",
                d : "ŕ¤ŕ¤ ŕ¤Śŕ¤żŕ¤¨",
                dd : "%d ŕ¤Śŕ¤żŕ¤¨",
                M : "ŕ¤ŕ¤ ŕ¤Žŕ¤šŕĽŕ¤¨ŕĽ",
                MM : "%d ŕ¤Žŕ¤šŕĽŕ¤¨ŕĽ",
                y : "ŕ¤ŕ¤ ŕ¤ľŕ¤°ŕĽŕ¤ˇ",
                yy : "%d ŕ¤ľŕ¤°ŕĽŕ¤ˇ"
            },
            preparse: function (string) {
                return string.replace(/[ŕĽ§ŕĽ¨ŕĽŠŕĽŞŕĽŤŕĽŹŕĽ­ŕĽŽŕĽŻŕĽŚ]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            // Hindi notation for meridiems are quite fuzzy in practice. While there exists
            // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return "ŕ¤°ŕ¤žŕ¤¤";
                } else if (hour < 10) {
                    return "ŕ¤¸ŕĽŕ¤Źŕ¤š";
                } else if (hour < 17) {
                    return "ŕ¤ŚŕĽŕ¤Şŕ¤šŕ¤°";
                } else if (hour < 20) {
                    return "ŕ¤śŕ¤žŕ¤Ž";
                } else {
                    return "ŕ¤°ŕ¤žŕ¤¤";
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : hrvatski (hr)
// author : Bojan MarkoviÄ : https://github.com/bmarkovic

// based on (sl) translation by Robert SedovĹĄek

    (function (factory) {
        factory(moment);
    }(function (moment) {

        function translate(number, withoutSuffix, key) {
            var result = number + " ";
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'jedna minuta' : 'jedne minute';
                case 'mm':
                    if (number === 1) {
                        result += 'minuta';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'minute';
                    } else {
                        result += 'minuta';
                    }
                    return result;
                case 'h':
                    return withoutSuffix ? 'jedan sat' : 'jednog sata';
                case 'hh':
                    if (number === 1) {
                        result += 'sat';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'sata';
                    } else {
                        result += 'sati';
                    }
                    return result;
                case 'dd':
                    if (number === 1) {
                        result += 'dan';
                    } else {
                        result += 'dana';
                    }
                    return result;
                case 'MM':
                    if (number === 1) {
                        result += 'mjesec';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'mjeseca';
                    } else {
                        result += 'mjeseci';
                    }
                    return result;
                case 'yy':
                    if (number === 1) {
                        result += 'godina';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'godine';
                    } else {
                        result += 'godina';
                    }
                    return result;
            }
        }

        return moment.lang('hr', {
            months : "sjeÄanj_veljaÄa_oĹžujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_"),
            monthsShort : "sje._vel._oĹžu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"),
            weekdays : "nedjelja_ponedjeljak_utorak_srijeda_Äetvrtak_petak_subota".split("_"),
            weekdaysShort : "ned._pon._uto._sri._Äet._pet._sub.".split("_"),
            weekdaysMin : "ne_po_ut_sr_Äe_pe_su".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD. MM. YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay  : '[danas u] LT',
                nextDay  : '[sutra u] LT',

                nextWeek : function () {
                    switch (this.day()) {
                        case 0:
                            return '[u] [nedjelju] [u] LT';
                        case 3:
                            return '[u] [srijedu] [u] LT';
                        case 6:
                            return '[u] [subotu] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[u] dddd [u] LT';
                    }
                },
                lastDay  : '[juÄer u] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                            return '[proĹĄlu] dddd [u] LT';
                        case 6:
                            return '[proĹĄle] [subote] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[proĹĄli] dddd [u] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "za %s",
                past   : "prije %s",
                s      : "par sekundi",
                m      : translate,
                mm     : translate,
                h      : translate,
                hh     : translate,
                d      : "dan",
                dd     : translate,
                M      : "mjesec",
                MM     : translate,
                y      : "godinu",
                yy     : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : hungarian (hu)
// author : Adam Brunner : https://github.com/adambrunner

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var weekEndings = 'vasĂĄrnap hĂŠtfĹn kedden szerdĂĄn csĂźtĂśrtĂśkĂśn pĂŠnteken szombaton'.split(' ');

        function translate(number, withoutSuffix, key, isFuture) {
            var num = number,
                suffix;

            switch (key) {
                case 's':
                    return (isFuture || withoutSuffix) ? 'nĂŠhĂĄny mĂĄsodperc' : 'nĂŠhĂĄny mĂĄsodperce';
                case 'm':
                    return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
                case 'mm':
                    return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
                case 'h':
                    return 'egy' + (isFuture || withoutSuffix ? ' Ăłra' : ' ĂłrĂĄja');
                case 'hh':
                    return num + (isFuture || withoutSuffix ? ' Ăłra' : ' ĂłrĂĄja');
                case 'd':
                    return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
                case 'dd':
                    return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
                case 'M':
                    return 'egy' + (isFuture || withoutSuffix ? ' hĂłnap' : ' hĂłnapja');
                case 'MM':
                    return num + (isFuture || withoutSuffix ? ' hĂłnap' : ' hĂłnapja');
                case 'y':
                    return 'egy' + (isFuture || withoutSuffix ? ' ĂŠv' : ' ĂŠve');
                case 'yy':
                    return num + (isFuture || withoutSuffix ? ' ĂŠv' : ' ĂŠve');
            }

            return '';
        }

        function week(isFuture) {
            return (isFuture ? '' : '[mĂşlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
        }

        return moment.lang('hu', {
            months : "januĂĄr_februĂĄr_mĂĄrcius_ĂĄprilis_mĂĄjus_jĂşnius_jĂşlius_augusztus_szeptember_oktĂłber_november_december".split("_"),
            monthsShort : "jan_feb_mĂĄrc_ĂĄpr_mĂĄj_jĂşn_jĂşl_aug_szept_okt_nov_dec".split("_"),
            weekdays : "vasĂĄrnap_hĂŠtfĹ_kedd_szerda_csĂźtĂśrtĂśk_pĂŠntek_szombat".split("_"),
            weekdaysShort : "vas_hĂŠt_kedd_sze_csĂźt_pĂŠn_szo".split("_"),
            weekdaysMin : "v_h_k_sze_cs_p_szo".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "YYYY.MM.DD.",
                LL : "YYYY. MMMM D.",
                LLL : "YYYY. MMMM D., LT",
                LLLL : "YYYY. MMMM D., dddd LT"
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 12) {
                    return isLower === true ? 'de' : 'DE';
                } else {
                    return isLower === true ? 'du' : 'DU';
                }
            },
            calendar : {
                sameDay : '[ma] LT[-kor]',
                nextDay : '[holnap] LT[-kor]',
                nextWeek : function () {
                    return week.call(this, true);
                },
                lastDay : '[tegnap] LT[-kor]',
                lastWeek : function () {
                    return week.call(this, false);
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s mĂşlva",
                past : "%s",
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Armenian (hy-am)
// author : Armendarabyan : https://github.com/armendarabyan

    (function (factory) {
        factory(moment);
    }(function (moment) {

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'Ő°Ő¸ÖŐśŐžŐĄÖ_ÖŐĽŐżÖŐžŐĄÖ_Ő´ŐĄÖŐż_ŐĄŐşÖŐŤŐŹ_Ő´ŐĄŐľŐŤŐ˝_Ő°Ő¸ÖŐśŐŤŐ˝_Ő°Ő¸ÖŐŹŐŤŐ˝_ÖŐŁŐ¸Ő˝ŐżŐ¸Ő˝_Ő˝ŐĽŐşŐżŐĽŐ´Ő˘ŐĽÖ_Ő°Ő¸ŐŻŐżŐĽŐ´Ő˘ŐĽÖ_ŐśŐ¸ŐľŐĽŐ´Ő˘ŐĽÖ_Ő¤ŐĽŐŻŐżŐĽŐ´Ő˘ŐĽÖ'.split('_'),
                    'accusative': 'Ő°Ő¸ÖŐśŐžŐĄÖŐŤ_ÖŐĽŐżÖŐžŐĄÖŐŤ_Ő´ŐĄÖŐżŐŤ_ŐĄŐşÖŐŤŐŹŐŤ_Ő´ŐĄŐľŐŤŐ˝ŐŤ_Ő°Ő¸ÖŐśŐŤŐ˝ŐŤ_Ő°Ő¸ÖŐŹŐŤŐ˝ŐŤ_ÖŐŁŐ¸Ő˝ŐżŐ¸Ő˝ŐŤ_Ő˝ŐĽŐşŐżŐĽŐ´Ő˘ŐĽÖŐŤ_Ő°Ő¸ŐŻŐżŐĽŐ´Ő˘ŐĽÖŐŤ_ŐśŐ¸ŐľŐĽŐ´Ő˘ŐĽÖŐŤ_Ő¤ŐĽŐŻŐżŐĽŐ´Ő˘ŐĽÖŐŤ'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function monthsShortCaseReplace(m, format) {
            var monthsShort = 'Ő°ŐśŐž_ÖŐżÖ_Ő´ÖŐż_ŐĄŐşÖ_Ő´ŐľŐ˝_Ő°ŐśŐ˝_Ő°ŐŹŐ˝_ÖŐŁŐ˝_Ő˝ŐşŐż_Ő°ŐŻŐż_ŐśŐ´Ő˘_Ő¤ŐŻŐż'.split('_');

            return monthsShort[m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = 'ŐŻŐŤÖŐĄŐŻŐŤ_ŐĽÖŐŻŐ¸ÖŐˇŐĄŐ˘ŐŠŐŤ_ŐĽÖŐĽÖŐˇŐĄŐ˘ŐŠŐŤ_ŐšŐ¸ÖŐĽÖŐˇŐĄŐ˘ŐŠŐŤ_Ő°ŐŤŐśŐŁŐˇŐĄŐ˘ŐŠŐŤ_Ő¸ÖÖŐ˘ŐĄŐŠ_ŐˇŐĄŐ˘ŐĄŐŠ'.split('_');

            return weekdays[m.day()];
        }

        return moment.lang('hy-am', {
            months : monthsCaseReplace,
            monthsShort : monthsShortCaseReplace,
            weekdays : weekdaysCaseReplace,
            weekdaysShort : "ŐŻÖŐŻ_ŐĽÖŐŻ_ŐĽÖÖ_ŐšÖÖ_Ő°ŐśŐŁ_Ő¸ÖÖŐ˘_ŐˇŐ˘ŐŠ".split("_"),
            weekdaysMin : "ŐŻÖŐŻ_ŐĽÖŐŻ_ŐĽÖÖ_ŐšÖÖ_Ő°ŐśŐŁ_Ő¸ÖÖŐ˘_ŐˇŐ˘ŐŠ".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY ŐŠ.",
                LLL : "D MMMM YYYY ŐŠ., LT",
                LLLL : "dddd, D MMMM YYYY ŐŠ., LT"
            },
            calendar : {
                sameDay: '[ŐĄŐľŐ˝ÖÖ] LT',
                nextDay: '[ŐžŐĄŐ˛Ő¨] LT',
                lastDay: '[ŐĽÖŐĽŐŻ] LT',
                nextWeek: function () {
                    return 'dddd [ÖÖŐ¨ ŐŞŐĄŐ´Ő¨] LT';
                },
                lastWeek: function () {
                    return '[ŐĄŐśÖŐĄŐŽ] dddd [ÖÖŐ¨ ŐŞŐĄŐ´Ő¨] LT';
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : "%s Ő°ŐĽŐżŐ¸",
                past : "%s ŐĄŐźŐĄŐť",
                s : "Ő´ŐŤ ÖŐĄŐśŐŤ ŐžŐĄŐľÖŐŻŐľŐĄŐś",
                m : "ÖŐ¸ŐşŐĽ",
                mm : "%d ÖŐ¸ŐşŐĽ",
                h : "ŐŞŐĄŐ´",
                hh : "%d ŐŞŐĄŐ´",
                d : "ÖÖ",
                dd : "%d ÖÖ",
                M : "ŐĄŐ´ŐŤŐ˝",
                MM : "%d ŐĄŐ´ŐŤŐ˝",
                y : "ŐżŐĄÖŐŤ",
                yy : "%d ŐżŐĄÖŐŤ"
            },

            meridiem : function (hour) {
                if (hour < 4) {
                    return "ŐŁŐŤŐˇŐĽÖŐžŐĄ";
                } else if (hour < 12) {
                    return "ŐĄŐźŐĄŐžŐ¸ŐżŐžŐĄ";
                } else if (hour < 17) {
                    return "ÖŐĽÖŐĽŐŻŐžŐĄ";
                } else {
                    return "ŐĽÖŐĽŐŻŐ¸ŐľŐĄŐś";
                }
            },

            ordinal: function (number, period) {
                switch (period) {
                    case 'DDD':
                    case 'w':
                    case 'W':
                    case 'DDDo':
                        if (number === 1) {
                            return number + '-ŐŤŐś';
                        }
                        return number + '-ÖŐ¤';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Bahasa Indonesia (id)
// author : Mohammad Satrio Utomo : https://github.com/tyok
// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('id', {
            months : "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"),
            monthsShort : "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des".split("_"),
            weekdays : "Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"),
            weekdaysShort : "Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"),
            weekdaysMin : "Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"),
            longDateFormat : {
                LT : "HH.mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY [pukul] LT",
                LLLL : "dddd, D MMMM YYYY [pukul] LT"
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 11) {
                    return 'pagi';
                } else if (hours < 15) {
                    return 'siang';
                } else if (hours < 19) {
                    return 'sore';
                } else {
                    return 'malam';
                }
            },
            calendar : {
                sameDay : '[Hari ini pukul] LT',
                nextDay : '[Besok pukul] LT',
                nextWeek : 'dddd [pukul] LT',
                lastDay : '[Kemarin pukul] LT',
                lastWeek : 'dddd [lalu pukul] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "dalam %s",
                past : "%s yang lalu",
                s : "beberapa detik",
                m : "semenit",
                mm : "%d menit",
                h : "sejam",
                hh : "%d jam",
                d : "sehari",
                dd : "%d hari",
                M : "sebulan",
                MM : "%d bulan",
                y : "setahun",
                yy : "%d tahun"
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : icelandic (is)
// author : Hinrik Ărn SigurĂ°sson : https://github.com/hinrik

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(n) {
            if (n % 100 === 11) {
                return true;
            } else if (n % 10 === 1) {
                return false;
            }
            return true;
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + " ";
            switch (key) {
                case 's':
                    return withoutSuffix || isFuture ? 'nokkrar sekĂşndur' : 'nokkrum sekĂşndum';
                case 'm':
                    return withoutSuffix ? 'mĂ­nĂşta' : 'mĂ­nĂştu';
                case 'mm':
                    if (plural(number)) {
                        return result + (withoutSuffix || isFuture ? 'mĂ­nĂştur' : 'mĂ­nĂştum');
                    } else if (withoutSuffix) {
                        return result + 'mĂ­nĂşta';
                    }
                    return result + 'mĂ­nĂştu';
                case 'hh':
                    if (plural(number)) {
                        return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
                    }
                    return result + 'klukkustund';
                case 'd':
                    if (withoutSuffix) {
                        return 'dagur';
                    }
                    return isFuture ? 'dag' : 'degi';
                case 'dd':
                    if (plural(number)) {
                        if (withoutSuffix) {
                            return result + 'dagar';
                        }
                        return result + (isFuture ? 'daga' : 'dĂśgum');
                    } else if (withoutSuffix) {
                        return result + 'dagur';
                    }
                    return result + (isFuture ? 'dag' : 'degi');
                case 'M':
                    if (withoutSuffix) {
                        return 'mĂĄnuĂ°ur';
                    }
                    return isFuture ? 'mĂĄnuĂ°' : 'mĂĄnuĂ°i';
                case 'MM':
                    if (plural(number)) {
                        if (withoutSuffix) {
                            return result + 'mĂĄnuĂ°ir';
                        }
                        return result + (isFuture ? 'mĂĄnuĂ°i' : 'mĂĄnuĂ°um');
                    } else if (withoutSuffix) {
                        return result + 'mĂĄnuĂ°ur';
                    }
                    return result + (isFuture ? 'mĂĄnuĂ°' : 'mĂĄnuĂ°i');
                case 'y':
                    return withoutSuffix || isFuture ? 'ĂĄr' : 'ĂĄri';
                case 'yy':
                    if (plural(number)) {
                        return result + (withoutSuffix || isFuture ? 'ĂĄr' : 'ĂĄrum');
                    }
                    return result + (withoutSuffix || isFuture ? 'ĂĄr' : 'ĂĄri');
            }
        }

        return moment.lang('is', {
            months : "janĂşar_febrĂşar_mars_aprĂ­l_maĂ­_jĂşnĂ­_jĂşlĂ­_ĂĄgĂşst_september_oktĂłber_nĂłvember_desember".split("_"),
            monthsShort : "jan_feb_mar_apr_maĂ­_jĂşn_jĂşl_ĂĄgĂş_sep_okt_nĂłv_des".split("_"),
            weekdays : "sunnudagur_mĂĄnudagur_ĂžriĂ°judagur_miĂ°vikudagur_fimmtudagur_fĂśstudagur_laugardagur".split("_"),
            weekdaysShort : "sun_mĂĄn_Ăžri_miĂ°_fim_fĂśs_lau".split("_"),
            weekdaysMin : "Su_MĂĄ_Ăr_Mi_Fi_FĂś_La".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD/MM/YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY [kl.] LT",
                LLLL : "dddd, D. MMMM YYYY [kl.] LT"
            },
            calendar : {
                sameDay : '[Ă­ dag kl.] LT',
                nextDay : '[ĂĄ morgun kl.] LT',
                nextWeek : 'dddd [kl.] LT',
                lastDay : '[Ă­ gĂŚr kl.] LT',
                lastWeek : '[sĂ­Ă°asta] dddd [kl.] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "eftir %s",
                past : "fyrir %s sĂ­Ă°an",
                s : translate,
                m : translate,
                mm : translate,
                h : "klukkustund",
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : italian (it)
// author : Lorenzo : https://github.com/aliem
// author: Mattia Larentis: https://github.com/nostalgiaz

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('it', {
            months : "gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre".split("_"),
            monthsShort : "gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic".split("_"),
            weekdays : "Domenica_LunedĂŹ_MartedĂŹ_MercoledĂŹ_GiovedĂŹ_VenerdĂŹ_Sabato".split("_"),
            weekdaysShort : "Dom_Lun_Mar_Mer_Gio_Ven_Sab".split("_"),
            weekdaysMin : "D_L_Ma_Me_G_V_S".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay: '[Oggi alle] LT',
                nextDay: '[Domani alle] LT',
                nextWeek: 'dddd [alle] LT',
                lastDay: '[Ieri alle] LT',
                lastWeek: '[lo scorso] dddd [alle] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : function (s) {
                    return ((/^[0-9].+$/).test(s) ? "tra" : "in") + " " + s;
                },
                past : "%s fa",
                s : "alcuni secondi",
                m : "un minuto",
                mm : "%d minuti",
                h : "un'ora",
                hh : "%d ore",
                d : "un giorno",
                dd : "%d giorni",
                M : "un mese",
                MM : "%d mesi",
                y : "un anno",
                yy : "%d anni"
            },
            ordinal: '%dÂş',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : japanese (ja)
// author : LI Long : https://github.com/baryon

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('ja', {
            months : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
            monthsShort : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
            weekdays : "ćĽććĽ_ćććĽ_çŤććĽ_ć°´ććĽ_ć¨ććĽ_éććĽ_ĺććĽ".split("_"),
            weekdaysShort : "ćĽ_ć_çŤ_ć°´_ć¨_é_ĺ".split("_"),
            weekdaysMin : "ćĽ_ć_çŤ_ć°´_ć¨_é_ĺ".split("_"),
            longDateFormat : {
                LT : "Ahćmĺ",
                L : "YYYY/MM/DD",
                LL : "YYYYĺš´MćDćĽ",
                LLL : "YYYYĺš´MćDćĽLT",
                LLLL : "YYYYĺš´MćDćĽLT dddd"
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return "ĺĺ";
                } else {
                    return "ĺĺž";
                }
            },
            calendar : {
                sameDay : '[äťćĽ] LT',
                nextDay : '[ććĽ] LT',
                nextWeek : '[ćĽéą]dddd LT',
                lastDay : '[ć¨ćĽ] LT',
                lastWeek : '[ĺéą]dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%sĺž",
                past : "%sĺ",
                s : "ć°ç§",
                m : "1ĺ",
                mm : "%dĺ",
                h : "1ćé",
                hh : "%dćé",
                d : "1ćĽ",
                dd : "%dćĽ",
                M : "1ăść",
                MM : "%dăść",
                y : "1ĺš´",
                yy : "%dĺš´"
            }
        });
    }));
// moment.js language configuration
// language : Georgian (ka)
// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

    (function (factory) {
        factory(moment);
    }(function (moment) {

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'áááááá á_ááááá áááá_ááá á˘á_ááá ááá_ááááĄá_áááááĄá_áááááĄá_áááááĄá˘á_áĄááĽá˘ááááá á_ááĽá˘ááááá á_ááááááá á_áááááááá á'.split('_'),
                    'accusative': 'áááááá áĄ_ááááá ááááĄ_ááá á˘áĄ_ááá ááááĄ_ááááĄáĄ_áááááĄáĄ_áááááĄáĄ_áááááĄá˘áĄ_áĄááĽá˘ááááá áĄ_ááĽá˘ááááá áĄ_ááááááá áĄ_áááááááá áĄ'.split('_')
                },

                nounCase = (/D[oD] *MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'áááá á_áá á¨ááááá_áĄááá¨ááááá_áááŽá¨ááááá_áŽáŁáá¨ááááá_ááá ááĄáááá_á¨ááááá'.split('_'),
                    'accusative': 'áááá ááĄ_áá á¨áááááĄ_áĄááá¨áááááĄ_áááŽá¨áááááĄ_áŽáŁáá¨áááááĄ_ááá ááĄááááĄ_á¨áááááĄ'.split('_')
                },

                nounCase = (/(áŹááá|á¨ááááá)/).test(format) ?
                    'accusative' :
                    'nominative';

            return weekdays[nounCase][m.day()];
        }

        return moment.lang('ka', {
            months : monthsCaseReplace,
            monthsShort : "ááá_ááá_ááá _ááá _ááá_ááá_ááá_ááá_áĄááĽ_ááĽá˘_ááá_ááá".split("_"),
            weekdays : weekdaysCaseReplace,
            weekdaysShort : "ááá_áá á¨_áĄáá_áááŽ_áŽáŁá_ááá _á¨áá".split("_"),
            weekdaysMin : "áá_áá _áĄá_áá_áŽáŁ_áá_á¨á".split("_"),
            longDateFormat : {
                LT : "h:mm A",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[ááŚááĄ] LT[-áá]',
                nextDay : '[áŽááá] LT[-áá]',
                lastDay : '[ááŁá¨áá] LT[-áá]',
                nextWeek : '[á¨ááááá] dddd LT[-áá]',
                lastWeek : '[áŹááá] dddd LT-áá',
                sameElse : 'L'
            },
            relativeTime : {
                future : function (s) {
                    return (/(áŹááá|áŹáŁáá|áĄáááá|áŹááá)/).test(s) ?
                        s.replace(/á$/, "á¨á") :
                        s + "á¨á";
                },
                past : function (s) {
                    if ((/(áŹááá|áŹáŁáá|áĄáááá|ááŚá|ááá)/).test(s)) {
                        return s.replace(/(á|á)$/, "ááĄ áŹáá");
                    }
                    if ((/áŹááá/).test(s)) {
                        return s.replace(/áŹááá$/, "áŹáááĄ áŹáá");
                    }
                },
                s : "á áááááááá áŹááá",
                m : "áŹáŁáá",
                mm : "%d áŹáŁáá",
                h : "áĄáááá",
                hh : "%d áĄáááá",
                d : "ááŚá",
                dd : "%d ááŚá",
                M : "ááá",
                MM : "%d ááá",
                y : "áŹááá",
                yy : "%d áŹááá"
            },
            ordinal : function (number) {
                if (number === 0) {
                    return number;
                }

                if (number === 1) {
                    return number + "-áá";
                }

                if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
                    return "áá-" + number;
                }

                return number + "-á";
            },
            week : {
                dow : 1,
                doy : 7
            }
        });
    }));
// moment.js language configuration
// language : khmer (km)
// author : Kruy Vanna : https://github.com/kruyvanna

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('km', {
            months: "ááááś_ááťáááá_ááˇááś_ááááś_á§áááś_ááˇááťááś_ááááááś_áá¸á áś_áááááś_ááťááś_ááˇááááˇááś_ááááź".split("_"),
            monthsShort: "ááááś_ááťáááá_ááˇááś_ááááś_á§áááś_ááˇááťááś_ááááááś_áá¸á áś_áááááś_ááťááś_ááˇááááˇááś_ááááź".split("_"),
            weekdays: "á˘áśááˇááá_ááááá_á˘ááááśá_ááťá_áááá áááááˇá_ááťááá_áááá".split("_"),
            weekdaysShort: "á˘áśááˇááá_ááááá_á˘ááááśá_ááťá_áááá áááááˇá_ááťááá_áááá".split("_"),
            weekdaysMin: "á˘áśááˇááá_ááááá_á˘ááááśá_ááťá_áááá áááááˇá_ááťááá_áááá".split("_"),
            longDateFormat: {
                LT: "HH:mm",
                L: "DD/MM/YYYY",
                LL: "D MMMM YYYY",
                LLL: "D MMMM YYYY LT",
                LLLL: "dddd, D MMMM YYYY LT"
            },
            calendar: {
                sameDay: '[áááááá áááá] LT',
                nextDay: '[ááá˘áá áááá] LT',
                nextWeek: 'dddd [áááá] LT',
                lastDay: '[ááááˇáááˇá áááá] LT',
                lastWeek: 'dddd [áááááśá áááťá] [áááá] LT',
                sameElse: 'L'
            },
            relativeTime: {
                future: "%sááá",
                past: "%sááťá",
                s: "áááťááááśáááˇááśáá¸",
                m: "áá˝áááśáá¸",
                mm: "%d ááśáá¸",
                h: "áá˝ááááá",
                hh: "%d áááá",
                d: "áá˝ááááá",
                dd: "%d áááá",
                M: "áá˝ááá",
                MM: "%d áá",
                y: "áá˝áááááśá",
                yy: "%d ááááśá"
            },
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4 // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : korean (ko)
//
// authors 
//
// - Kyungwook, Park : https://github.com/kyungw00k
// - Jeeeyul Lee <jeeeyul@gmail.com>
    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('ko', {
            months : "1ě_2ě_3ě_4ě_5ě_6ě_7ě_8ě_9ě_10ě_11ě_12ě".split("_"),
            monthsShort : "1ě_2ě_3ě_4ě_5ě_6ě_7ě_8ě_9ě_10ě_11ě_12ě".split("_"),
            weekdays : "ěźěěź_ěěěź_íěěź_ěěěź_ëŞŠěěź_ę¸ěěź_í ěěź".split("_"),
            weekdaysShort : "ěź_ě_í_ě_ëŞŠ_ę¸_í ".split("_"),
            weekdaysMin : "ěź_ě_í_ě_ëŞŠ_ę¸_í ".split("_"),
            longDateFormat : {
                LT : "A hě mmëś",
                L : "YYYY.MM.DD",
                LL : "YYYYë MMMM Děź",
                LLL : "YYYYë MMMM Děź LT",
                LLLL : "YYYYë MMMM Děź dddd LT"
            },
            meridiem : function (hour, minute, isUpper) {
                return hour < 12 ? 'ě¤ě ' : 'ě¤í';
            },
            calendar : {
                sameDay : 'ě¤ë LT',
                nextDay : 'ë´ěź LT',
                nextWeek : 'dddd LT',
                lastDay : 'ě´ě  LT',
                lastWeek : 'ě§ëěŁź dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s í",
                past : "%s ě ",
                s : "ëŞě´",
                ss : "%dě´",
                m : "ěźëś",
                mm : "%dëś",
                h : "íěę°",
                hh : "%děę°",
                d : "íëŁ¨",
                dd : "%děź",
                M : "íëŹ",
                MM : "%dëŹ",
                y : "ěźë",
                yy : "%dë"
            },
            ordinal : '%děź',
            meridiemParse : /(ě¤ě |ě¤í)/,
            isPM : function (token) {
                return token === "ě¤í";
            }
        });
    }));
// moment.js language configuration
// language : Luxembourgish (lb)
// author : mweimerskirch : https://github.com/mweimerskirch

// Note: Luxembourgish has a very particular phonological rule ("Eifeler Regel") that causes the
// deletion of the final "n" in certain contexts. That's what the "eifelerRegelAppliesToWeekday"
// and "eifelerRegelAppliesToNumber" methods are meant for

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                'm': ['eng Minutt', 'enger Minutt'],
                'h': ['eng Stonn', 'enger Stonn'],
                'd': ['een Dag', 'engem Dag'],
                'dd': [number + ' Deeg', number + ' Deeg'],
                'M': ['ee Mount', 'engem Mount'],
                'MM': [number + ' MĂŠint', number + ' MĂŠint'],
                'y': ['ee Joer', 'engem Joer'],
                'yy': [number + ' Joer', number + ' Joer']
            };
            return withoutSuffix ? format[key][0] : format[key][1];
        }

        function processFutureTime(string) {
            var number = string.substr(0, string.indexOf(' '));
            if (eifelerRegelAppliesToNumber(number)) {
                return "a " + string;
            }
            return "an " + string;
        }

        function processPastTime(string) {
            var number = string.substr(0, string.indexOf(' '));
            if (eifelerRegelAppliesToNumber(number)) {
                return "viru " + string;
            }
            return "virun " + string;
        }

        function processLastWeek(string1) {
            var weekday = this.format('d');
            if (eifelerRegelAppliesToWeekday(weekday)) {
                return '[Leschte] dddd [um] LT';
            }
            return '[Leschten] dddd [um] LT';
        }

        /**
         * Returns true if the word before the given week day loses the "-n" ending.
         * e.g. "Leschten DĂŤnschdeg" but "Leschte MĂŠindeg"
         *
         * @param weekday {integer}
         * @returns {boolean}
         */
        function eifelerRegelAppliesToWeekday(weekday) {
            weekday = parseInt(weekday, 10);
            switch (weekday) {
                case 0: // Sonndeg
                case 1: // MĂŠindeg
                case 3: // MĂŤttwoch
                case 5: // Freideg
                case 6: // Samschdeg
                    return true;
                default: // 2 DĂŤnschdeg, 4 Donneschdeg
                    return false;
            }
        }

        /**
         * Returns true if the word before the given number loses the "-n" ending.
         * e.g. "an 10 Deeg" but "a 5 Deeg"
         *
         * @param number {integer}
         * @returns {boolean}
         */
        function eifelerRegelAppliesToNumber(number) {
            number = parseInt(number, 10);
            if (isNaN(number)) {
                return false;
            }
            if (number < 0) {
                // Negative Number --> always true
                return true;
            } else if (number < 10) {
                // Only 1 digit
                if (4 <= number && number <= 7) {
                    return true;
                }
                return false;
            } else if (number < 100) {
                // 2 digits
                var lastDigit = number % 10, firstDigit = number / 10;
                if (lastDigit === 0) {
                    return eifelerRegelAppliesToNumber(firstDigit);
                }
                return eifelerRegelAppliesToNumber(lastDigit);
            } else if (number < 10000) {
                // 3 or 4 digits --> recursively check first digit
                while (number >= 10) {
                    number = number / 10;
                }
                return eifelerRegelAppliesToNumber(number);
            } else {
                // Anything larger than 4 digits: recursively check first n-3 digits
                number = number / 1000;
                return eifelerRegelAppliesToNumber(number);
            }
        }

        return moment.lang('lb', {
            months: "Januar_Februar_MĂ¤erz_AbrĂŤll_Mee_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
            monthsShort: "Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
            weekdays: "Sonndeg_MĂŠindeg_DĂŤnschdeg_MĂŤttwoch_Donneschdeg_Freideg_Samschdeg".split("_"),
            weekdaysShort: "So._MĂŠ._DĂŤ._MĂŤ._Do._Fr._Sa.".split("_"),
            weekdaysMin: "So_MĂŠ_DĂŤ_MĂŤ_Do_Fr_Sa".split("_"),
            longDateFormat: {
                LT: "H:mm [Auer]",
                L: "DD.MM.YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY LT",
                LLLL: "dddd, D. MMMM YYYY LT"
            },
            calendar: {
                sameDay: "[Haut um] LT",
                sameElse: "L",
                nextDay: '[Muer um] LT',
                nextWeek: 'dddd [um] LT',
                lastDay: '[GĂŤschter um] LT',
                lastWeek: processLastWeek
            },
            relativeTime: {
                future: processFutureTime,
                past: processPastTime,
                s: "e puer Sekonnen",
                m: processRelativeTime,
                mm: "%d Minutten",
                h: processRelativeTime,
                hh: "%d Stonnen",
                d: processRelativeTime,
                dd: processRelativeTime,
                M: processRelativeTime,
                MM: processRelativeTime,
                y: processRelativeTime,
                yy: processRelativeTime
            },
            ordinal: '%d.',
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Lithuanian (lt)
// author : Mindaugas MozĹŤras : https://github.com/mmozuras

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var units = {
                "m" : "minutÄ_minutÄs_minutÄ",
                "mm": "minutÄs_minuÄiĹł_minutes",
                "h" : "valanda_valandos_valandÄ",
                "hh": "valandos_valandĹł_valandas",
                "d" : "diena_dienos_dienÄ",
                "dd": "dienos_dienĹł_dienas",
                "M" : "mÄnuo_mÄnesio_mÄnesÄŻ",
                "MM": "mÄnesiai_mÄnesiĹł_mÄnesius",
                "y" : "metai_metĹł_metus",
                "yy": "metai_metĹł_metus"
            },
            weekDays = "sekmadienis_pirmadienis_antradienis_treÄiadienis_ketvirtadienis_penktadienis_ĹĄeĹĄtadienis".split("_");

        function translateSeconds(number, withoutSuffix, key, isFuture) {
            if (withoutSuffix) {
                return "kelios sekundÄs";
            } else {
                return isFuture ? "keliĹł sekundĹžiĹł" : "kelias sekundes";
            }
        }

        function translateSingular(number, withoutSuffix, key, isFuture) {
            return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
        }

        function special(number) {
            return number % 10 === 0 || (number > 10 && number < 20);
        }

        function forms(key) {
            return units[key].split("_");
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + " ";
            if (number === 1) {
                return result + translateSingular(number, withoutSuffix, key[0], isFuture);
            } else if (withoutSuffix) {
                return result + (special(number) ? forms(key)[1] : forms(key)[0]);
            } else {
                if (isFuture) {
                    return result + forms(key)[1];
                } else {
                    return result + (special(number) ? forms(key)[1] : forms(key)[2]);
                }
            }
        }

        function relativeWeekDay(moment, format) {
            var nominative = format.indexOf('dddd HH:mm') === -1,
                weekDay = weekDays[moment.day()];

            return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + "ÄŻ";
        }

        return moment.lang("lt", {
            months : "sausio_vasario_kovo_balandĹžio_geguĹžÄs_birĹžÄlio_liepos_rugpjĹŤÄio_rugsÄjo_spalio_lapkriÄio_gruodĹžio".split("_"),
            monthsShort : "sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"),
            weekdays : relativeWeekDay,
            weekdaysShort : "Sek_Pir_Ant_Tre_Ket_Pen_Ĺ eĹĄ".split("_"),
            weekdaysMin : "S_P_A_T_K_Pn_Ĺ ".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "YYYY-MM-DD",
                LL : "YYYY [m.] MMMM D [d.]",
                LLL : "YYYY [m.] MMMM D [d.], LT [val.]",
                LLLL : "YYYY [m.] MMMM D [d.], dddd, LT [val.]",
                l : "YYYY-MM-DD",
                ll : "YYYY [m.] MMMM D [d.]",
                lll : "YYYY [m.] MMMM D [d.], LT [val.]",
                llll : "YYYY [m.] MMMM D [d.], ddd, LT [val.]"
            },
            calendar : {
                sameDay : "[Ĺ iandien] LT",
                nextDay : "[Rytoj] LT",
                nextWeek : "dddd LT",
                lastDay : "[Vakar] LT",
                lastWeek : "[PraÄjusÄŻ] dddd LT",
                sameElse : "L"
            },
            relativeTime : {
                future : "po %s",
                past : "prieĹĄ %s",
                s : translateSeconds,
                m : translateSingular,
                mm : translate,
                h : translateSingular,
                hh : translate,
                d : translateSingular,
                dd : translate,
                M : translateSingular,
                MM : translate,
                y : translateSingular,
                yy : translate
            },
            ordinal : function (number) {
                return number + '-oji';
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : latvian (lv)
// author : Kristaps Karlsons : https://github.com/skakri

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var units = {
            'mm': 'minĹŤti_minĹŤtes_minĹŤte_minĹŤtes',
            'hh': 'stundu_stundas_stunda_stundas',
            'dd': 'dienu_dienas_diena_dienas',
            'MM': 'mÄnesi_mÄneĹĄus_mÄnesis_mÄneĹĄi',
            'yy': 'gadu_gadus_gads_gadi'
        };

        function format(word, number, withoutSuffix) {
            var forms = word.split('_');
            if (withoutSuffix) {
                return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
            } else {
                return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
            }
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            return number + ' ' + format(units[key], number, withoutSuffix);
        }

        return moment.lang('lv', {
            months : "janvÄris_februÄris_marts_aprÄŤlis_maijs_jĹŤnijs_jĹŤlijs_augusts_septembris_oktobris_novembris_decembris".split("_"),
            monthsShort : "jan_feb_mar_apr_mai_jĹŤn_jĹŤl_aug_sep_okt_nov_dec".split("_"),
            weekdays : "svÄtdiena_pirmdiena_otrdiena_treĹĄdiena_ceturtdiena_piektdiena_sestdiena".split("_"),
            weekdaysShort : "Sv_P_O_T_C_Pk_S".split("_"),
            weekdaysMin : "Sv_P_O_T_C_Pk_S".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "YYYY. [gada] D. MMMM",
                LLL : "YYYY. [gada] D. MMMM, LT",
                LLLL : "YYYY. [gada] D. MMMM, dddd, LT"
            },
            calendar : {
                sameDay : '[Ĺ odien pulksten] LT',
                nextDay : '[RÄŤt pulksten] LT',
                nextWeek : 'dddd [pulksten] LT',
                lastDay : '[Vakar pulksten] LT',
                lastWeek : '[PagÄjuĹĄÄ] dddd [pulksten] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s vÄlÄk",
                past : "%s agrÄk",
                s : "daĹžas sekundes",
                m : "minĹŤti",
                mm : relativeTimeWithPlural,
                h : "stundu",
                hh : relativeTimeWithPlural,
                d : "dienu",
                dd : relativeTimeWithPlural,
                M : "mÄnesi",
                MM : relativeTimeWithPlural,
                y : "gadu",
                yy : relativeTimeWithPlural
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : macedonian (mk)
// author : Borislav Mickov : https://github.com/B0k0

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('mk', {
            months : "ŃĐ°Đ˝ŃĐ°ŃĐ¸_ŃĐľĐ˛ŃŃĐ°ŃĐ¸_ĐźĐ°ŃŃ_Đ°ĐżŃĐ¸Đť_ĐźĐ°Ń_ŃŃĐ˝Đ¸_ŃŃĐťĐ¸_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐżŃĐľĐźĐ˛ŃĐ¸_ĐžĐşŃĐžĐźĐ˛ŃĐ¸_Đ˝ĐžĐľĐźĐ˛ŃĐ¸_Đ´ĐľĐşĐľĐźĐ˛ŃĐ¸".split("_"),
            monthsShort : "ŃĐ°Đ˝_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Ń_ŃŃĐ˝_ŃŃĐť_Đ°Đ˛Đł_ŃĐľĐż_ĐžĐşŃ_Đ˝ĐžĐľ_Đ´ĐľĐş".split("_"),
            weekdays : "Đ˝ĐľĐ´ĐľĐťĐ°_ĐżĐžĐ˝ĐľĐ´ĐľĐťĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃĐľĐ´Đ°_ŃĐľŃĐ˛ŃŃĐžĐş_ĐżĐľŃĐžĐş_ŃĐ°ĐąĐžŃĐ°".split("_"),
            weekdaysShort : "Đ˝ĐľĐ´_ĐżĐžĐ˝_Đ˛ŃĐž_ŃŃĐľ_ŃĐľŃ_ĐżĐľŃ_ŃĐ°Đą".split("_"),
            weekdaysMin : "Đ˝e_Đżo_Đ˛Ń_ŃŃ_ŃĐľ_ĐżĐľ_Ńa".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "D.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[ĐĐľĐ˝ĐľŃ Đ˛Đž] LT',
                nextDay : '[ĐŁŃŃĐľ Đ˛Đž] LT',
                nextWeek : 'dddd [Đ˛Đž] LT',
                lastDay : '[ĐŃĐľŃĐ° Đ˛Đž] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 6:
                            return '[ĐĐž Đ¸ĐˇĐźĐ¸Đ˝Đ°ŃĐ°ŃĐ°] dddd [Đ˛Đž] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[ĐĐž Đ¸ĐˇĐźĐ¸Đ˝Đ°ŃĐ¸ĐžŃ] dddd [Đ˛Đž] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "ĐżĐžŃĐťĐľ %s",
                past : "ĐżŃĐľĐ´ %s",
                s : "Đ˝ĐľĐşĐžĐťĐşŃ ŃĐľĐşŃĐ˝Đ´Đ¸",
                m : "ĐźĐ¸Đ˝ŃŃĐ°",
                mm : "%d ĐźĐ¸Đ˝ŃŃĐ¸",
                h : "ŃĐ°Ń",
                hh : "%d ŃĐ°ŃĐ°",
                d : "Đ´ĐľĐ˝",
                dd : "%d Đ´ĐľĐ˝Đ°",
                M : "ĐźĐľŃĐľŃ",
                MM : "%d ĐźĐľŃĐľŃĐ¸",
                y : "ĐłĐžĐ´Đ¸Đ˝Đ°",
                yy : "%d ĐłĐžĐ´Đ¸Đ˝Đ¸"
            },
            ordinal : function (number) {
                var lastDigit = number % 10,
                    last2Digits = number % 100;
                if (number === 0) {
                    return number + '-ĐľĐ˛';
                } else if (last2Digits === 0) {
                    return number + '-ĐľĐ˝';
                } else if (last2Digits > 10 && last2Digits < 20) {
                    return number + '-ŃĐ¸';
                } else if (lastDigit === 1) {
                    return number + '-Đ˛Đ¸';
                } else if (lastDigit === 2) {
                    return number + '-ŃĐ¸';
                } else if (lastDigit === 7 || lastDigit === 8) {
                    return number + '-ĐźĐ¸';
                } else {
                    return number + '-ŃĐ¸';
                }
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : malayalam (ml)
// author : Floyd Pink : https://github.com/floydpink

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('ml', {
            months : 'ŕ´ŕ´¨ŕľŕ´ľŕ´°ŕ´ż_ŕ´Ťŕľŕ´Źŕľŕ´°ŕľŕ´ľŕ´°ŕ´ż_ŕ´Žŕ´žŕľźŕ´ŕľŕ´ŕľ_ŕ´ŕ´Şŕľŕ´°ŕ´żŕľ˝_ŕ´Žŕľŕ´Żŕľ_ŕ´ŕľŕľş_ŕ´ŕľŕ´˛ŕľ_ŕ´ŕ´ŕ´¸ŕľŕ´ąŕľŕ´ąŕľ_ŕ´¸ŕľŕ´Şŕľŕ´ąŕľŕ´ąŕ´ŕ´Źŕľź_ŕ´ŕ´ŕľŕ´ŕľŕ´Źŕľź_ŕ´¨ŕ´ľŕ´ŕ´Źŕľź_ŕ´Ąŕ´żŕ´¸ŕ´ŕ´Źŕľź'.split("_"),
            monthsShort : 'ŕ´ŕ´¨ŕľ._ŕ´Ťŕľŕ´Źŕľŕ´°ŕľ._ŕ´Žŕ´žŕľź._ŕ´ŕ´Şŕľŕ´°ŕ´ż._ŕ´Žŕľŕ´Żŕľ_ŕ´ŕľŕľş_ŕ´ŕľŕ´˛ŕľ._ŕ´ŕ´._ŕ´¸ŕľŕ´Şŕľŕ´ąŕľŕ´ą._ŕ´ŕ´ŕľŕ´ŕľ._ŕ´¨ŕ´ľŕ´._ŕ´Ąŕ´żŕ´¸ŕ´.'.split("_"),
            weekdays : 'ŕ´ŕ´žŕ´Żŕ´ąŕ´žŕ´´ŕľŕ´_ŕ´¤ŕ´żŕ´ŕľŕ´ŕ´łŕ´žŕ´´ŕľŕ´_ŕ´ŕľŕ´ľŕľŕ´ľŕ´žŕ´´ŕľŕ´_ŕ´Źŕľŕ´§ŕ´¨ŕ´žŕ´´ŕľŕ´_ŕ´ľŕľŕ´Żŕ´žŕ´´ŕ´žŕ´´ŕľŕ´_ŕ´ľŕľŕ´łŕľŕ´łŕ´żŕ´Żŕ´žŕ´´ŕľŕ´_ŕ´śŕ´¨ŕ´żŕ´Żŕ´žŕ´´ŕľŕ´'.split("_"),
            weekdaysShort : 'ŕ´ŕ´žŕ´Żŕľź_ŕ´¤ŕ´żŕ´ŕľŕ´ŕľž_ŕ´ŕľŕ´ľŕľŕ´ľ_ŕ´Źŕľŕ´§ŕľť_ŕ´ľŕľŕ´Żŕ´žŕ´´ŕ´_ŕ´ľŕľŕ´łŕľŕ´łŕ´ż_ŕ´śŕ´¨ŕ´ż'.split("_"),
            weekdaysMin : 'ŕ´ŕ´ž_ŕ´¤ŕ´ż_ŕ´ŕľ_ŕ´Źŕľ_ŕ´ľŕľŕ´Żŕ´ž_ŕ´ľŕľ_ŕ´ś'.split("_"),
            longDateFormat : {
                LT : "A h:mm -ŕ´¨ŕľ",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY, LT",
                LLLL : "dddd, D MMMM YYYY, LT"
            },
            calendar : {
                sameDay : '[ŕ´ŕ´¨ŕľŕ´¨ŕľ] LT',
                nextDay : '[ŕ´¨ŕ´žŕ´łŕľ] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[ŕ´ŕ´¨ŕľŕ´¨ŕ´˛ŕľ] LT',
                lastWeek : '[ŕ´ŕ´´ŕ´żŕ´ŕľŕ´] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s ŕ´ŕ´´ŕ´żŕ´ŕľŕ´ŕľ",
                past : "%s ŕ´Žŕľŕľťŕ´Şŕľ",
                s : "ŕ´ŕľ˝ŕ´Ş ŕ´¨ŕ´żŕ´Žŕ´żŕ´ˇŕ´ŕľŕ´ŕľž",
                m : "ŕ´ŕ´°ŕľ ŕ´Žŕ´żŕ´¨ŕ´żŕ´ąŕľŕ´ąŕľ",
                mm : "%d ŕ´Žŕ´żŕ´¨ŕ´żŕ´ąŕľŕ´ąŕľ",
                h : "ŕ´ŕ´°ŕľ ŕ´Žŕ´Łŕ´żŕ´ŕľŕ´ŕľŕľź",
                hh : "%d ŕ´Žŕ´Łŕ´żŕ´ŕľŕ´ŕľŕľź",
                d : "ŕ´ŕ´°ŕľ ŕ´Śŕ´żŕ´ľŕ´¸ŕ´",
                dd : "%d ŕ´Śŕ´żŕ´ľŕ´¸ŕ´",
                M : "ŕ´ŕ´°ŕľ ŕ´Žŕ´žŕ´¸ŕ´",
                MM : "%d ŕ´Žŕ´žŕ´¸ŕ´",
                y : "ŕ´ŕ´°ŕľ ŕ´ľŕľźŕ´ˇŕ´",
                yy : "%d ŕ´ľŕľźŕ´ˇŕ´"
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return "ŕ´°ŕ´žŕ´¤ŕľŕ´°ŕ´ż";
                } else if (hour < 12) {
                    return "ŕ´°ŕ´žŕ´ľŕ´żŕ´˛ŕľ";
                } else if (hour < 17) {
                    return "ŕ´ŕ´ŕľŕ´ ŕ´ŕ´´ŕ´żŕ´ŕľŕ´ŕľ";
                } else if (hour < 20) {
                    return "ŕ´ľŕľŕ´ŕľŕ´¨ŕľŕ´¨ŕľŕ´°ŕ´";
                } else {
                    return "ŕ´°ŕ´žŕ´¤ŕľŕ´°ŕ´ż";
                }
            }
        });
    }));
// moment.js language configuration
// language : Marathi (mr)
// author : Harshad Kale : https://github.com/kalehv

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'ŕĽ§',
                '2': 'ŕĽ¨',
                '3': 'ŕĽŠ',
                '4': 'ŕĽŞ',
                '5': 'ŕĽŤ',
                '6': 'ŕĽŹ',
                '7': 'ŕĽ­',
                '8': 'ŕĽŽ',
                '9': 'ŕĽŻ',
                '0': 'ŕĽŚ'
            },
            numberMap = {
                'ŕĽ§': '1',
                'ŕĽ¨': '2',
                'ŕĽŠ': '3',
                'ŕĽŞ': '4',
                'ŕĽŤ': '5',
                'ŕĽŹ': '6',
                'ŕĽ­': '7',
                'ŕĽŽ': '8',
                'ŕĽŻ': '9',
                'ŕĽŚ': '0'
            };

        return moment.lang('mr', {
            months : 'ŕ¤ŕ¤žŕ¤¨ŕĽŕ¤ľŕ¤žŕ¤°ŕĽ_ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽŕ¤ľŕ¤žŕ¤°ŕĽ_ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤żŕ¤˛_ŕ¤ŽŕĽ_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕĽ_ŕ¤ŕ¤ŕ¤¸ŕĽŕ¤_ŕ¤¸ŕ¤ŞŕĽŕ¤ŕĽŕ¤ŕ¤Źŕ¤°_ŕ¤ŕ¤ŕĽŕ¤ŕĽŕ¤Źŕ¤°_ŕ¤¨ŕĽŕ¤ľŕĽŕ¤šŕĽŕ¤ŕ¤Źŕ¤°_ŕ¤Ąŕ¤żŕ¤¸ŕĽŕ¤ŕ¤Źŕ¤°'.split("_"),
            monthsShort: 'ŕ¤ŕ¤žŕ¤¨ŕĽ._ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽ._ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤._ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤ż._ŕ¤ŽŕĽ._ŕ¤ŕĽŕ¤¨._ŕ¤ŕĽŕ¤˛ŕĽ._ŕ¤ŕ¤._ŕ¤¸ŕ¤ŞŕĽŕ¤ŕĽŕ¤._ŕ¤ŕ¤ŕĽŕ¤ŕĽ._ŕ¤¨ŕĽŕ¤ľŕĽŕ¤šŕĽŕ¤._ŕ¤Ąŕ¤żŕ¤¸ŕĽŕ¤.'.split("_"),
            weekdays : 'ŕ¤°ŕ¤ľŕ¤żŕ¤ľŕ¤žŕ¤°_ŕ¤¸ŕĽŕ¤Žŕ¤ľŕ¤žŕ¤°_ŕ¤Žŕ¤ŕ¤ŕ¤łŕ¤ľŕ¤žŕ¤°_ŕ¤ŹŕĽŕ¤§ŕ¤ľŕ¤žŕ¤°_ŕ¤ŕĽŕ¤°ŕĽŕ¤ľŕ¤žŕ¤°_ŕ¤śŕĽŕ¤ŕĽŕ¤°ŕ¤ľŕ¤žŕ¤°_ŕ¤śŕ¤¨ŕ¤żŕ¤ľŕ¤žŕ¤°'.split("_"),
            weekdaysShort : 'ŕ¤°ŕ¤ľŕ¤ż_ŕ¤¸ŕĽŕ¤Ž_ŕ¤Žŕ¤ŕ¤ŕ¤ł_ŕ¤ŹŕĽŕ¤§_ŕ¤ŕĽŕ¤°ŕĽ_ŕ¤śŕĽŕ¤ŕĽŕ¤°_ŕ¤śŕ¤¨ŕ¤ż'.split("_"),
            weekdaysMin : 'ŕ¤°_ŕ¤¸ŕĽ_ŕ¤Žŕ¤_ŕ¤ŹŕĽ_ŕ¤ŕĽ_ŕ¤śŕĽ_ŕ¤ś'.split("_"),
            longDateFormat : {
                LT : "A h:mm ŕ¤ľŕ¤žŕ¤ŕ¤¤ŕ¤ž",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY, LT",
                LLLL : "dddd, D MMMM YYYY, LT"
            },
            calendar : {
                sameDay : '[ŕ¤ŕ¤] LT',
                nextDay : '[ŕ¤ŕ¤ŚŕĽŕ¤Żŕ¤ž] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[ŕ¤ŕ¤žŕ¤˛] LT',
                lastWeek: '[ŕ¤Žŕ¤žŕ¤ŕĽŕ¤˛] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s ŕ¤¨ŕ¤ŕ¤¤ŕ¤°",
                past : "%s ŕ¤ŞŕĽŕ¤°ŕĽŕ¤ľŕĽ",
                s : "ŕ¤¸ŕĽŕ¤ŕ¤ŕ¤Ś",
                m: "ŕ¤ŕ¤ ŕ¤Žŕ¤żŕ¤¨ŕ¤żŕ¤",
                mm: "%d ŕ¤Žŕ¤żŕ¤¨ŕ¤żŕ¤ŕĽ",
                h : "ŕ¤ŕ¤ ŕ¤¤ŕ¤žŕ¤¸",
                hh : "%d ŕ¤¤ŕ¤žŕ¤¸",
                d : "ŕ¤ŕ¤ ŕ¤Śŕ¤żŕ¤ľŕ¤¸",
                dd : "%d ŕ¤Śŕ¤żŕ¤ľŕ¤¸",
                M : "ŕ¤ŕ¤ ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕ¤ž",
                MM : "%d ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕĽ",
                y : "ŕ¤ŕ¤ ŕ¤ľŕ¤°ŕĽŕ¤ˇ",
                yy : "%d ŕ¤ľŕ¤°ŕĽŕ¤ˇŕĽ"
            },
            preparse: function (string) {
                return string.replace(/[ŕĽ§ŕĽ¨ŕĽŠŕĽŞŕĽŤŕĽŹŕĽ­ŕĽŽŕĽŻŕĽŚ]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            meridiem: function (hour, minute, isLower)
            {
                if (hour < 4) {
                    return "ŕ¤°ŕ¤žŕ¤¤ŕĽŕ¤°ŕĽ";
                } else if (hour < 10) {
                    return "ŕ¤¸ŕ¤ŕ¤žŕ¤łŕĽ";
                } else if (hour < 17) {
                    return "ŕ¤ŚŕĽŕ¤Şŕ¤žŕ¤°ŕĽ";
                } else if (hour < 20) {
                    return "ŕ¤¸ŕ¤žŕ¤Żŕ¤ŕ¤ŕ¤žŕ¤łŕĽ";
                } else {
                    return "ŕ¤°ŕ¤žŕ¤¤ŕĽŕ¤°ŕĽ";
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Bahasa Malaysia (ms-MY)
// author : Weldan Jamili : https://github.com/weldan

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('ms-my', {
            months : "Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),
            monthsShort : "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),
            weekdays : "Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),
            weekdaysShort : "Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),
            weekdaysMin : "Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),
            longDateFormat : {
                LT : "HH.mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY [pukul] LT",
                LLLL : "dddd, D MMMM YYYY [pukul] LT"
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 11) {
                    return 'pagi';
                } else if (hours < 15) {
                    return 'tengahari';
                } else if (hours < 19) {
                    return 'petang';
                } else {
                    return 'malam';
                }
            },
            calendar : {
                sameDay : '[Hari ini pukul] LT',
                nextDay : '[Esok pukul] LT',
                nextWeek : 'dddd [pukul] LT',
                lastDay : '[Kelmarin pukul] LT',
                lastWeek : 'dddd [lepas pukul] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "dalam %s",
                past : "%s yang lepas",
                s : "beberapa saat",
                m : "seminit",
                mm : "%d minit",
                h : "sejam",
                hh : "%d jam",
                d : "sehari",
                dd : "%d hari",
                M : "sebulan",
                MM : "%d bulan",
                y : "setahun",
                yy : "%d tahun"
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : norwegian bokmĂĽl (nb)
// authors : Espen Hovlandsdal : https://github.com/rexxars
//           Sigurd Gartmann : https://github.com/sigurdga

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('nb', {
            months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
            monthsShort : "jan._feb._mars_april_mai_juni_juli_aug._sep._okt._nov._des.".split("_"),
            weekdays : "sĂ¸ndag_mandag_tirsdag_onsdag_torsdag_fredag_lĂ¸rdag".split("_"),
            weekdaysShort : "sĂ¸._ma._ti._on._to._fr._lĂ¸.".split("_"),
            weekdaysMin : "sĂ¸_ma_ti_on_to_fr_lĂ¸".split("_"),
            longDateFormat : {
                LT : "H.mm",
                L : "DD.MM.YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY [kl.] LT",
                LLLL : "dddd D. MMMM YYYY [kl.] LT"
            },
            calendar : {
                sameDay: '[i dag kl.] LT',
                nextDay: '[i morgen kl.] LT',
                nextWeek: 'dddd [kl.] LT',
                lastDay: '[i gĂĽr kl.] LT',
                lastWeek: '[forrige] dddd [kl.] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "om %s",
                past : "for %s siden",
                s : "noen sekunder",
                m : "ett minutt",
                mm : "%d minutter",
                h : "en time",
                hh : "%d timer",
                d : "en dag",
                dd : "%d dager",
                M : "en mĂĽned",
                MM : "%d mĂĽneder",
                y : "ett ĂĽr",
                yy : "%d ĂĽr"
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : nepali/nepalese
// author : suvash : https://github.com/suvash

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'ŕĽ§',
                '2': 'ŕĽ¨',
                '3': 'ŕĽŠ',
                '4': 'ŕĽŞ',
                '5': 'ŕĽŤ',
                '6': 'ŕĽŹ',
                '7': 'ŕĽ­',
                '8': 'ŕĽŽ',
                '9': 'ŕĽŻ',
                '0': 'ŕĽŚ'
            },
            numberMap = {
                'ŕĽ§': '1',
                'ŕĽ¨': '2',
                'ŕĽŠ': '3',
                'ŕĽŞ': '4',
                'ŕĽŤ': '5',
                'ŕĽŹ': '6',
                'ŕĽ­': '7',
                'ŕĽŽ': '8',
                'ŕĽŻ': '9',
                'ŕĽŚ': '0'
            };

        return moment.lang('ne', {
            months : 'ŕ¤ŕ¤¨ŕ¤ľŕ¤°ŕĽ_ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽŕ¤ľŕ¤°ŕĽ_ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤żŕ¤˛_ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕ¤žŕ¤_ŕ¤ŕ¤ŕ¤ˇŕĽŕ¤_ŕ¤¸ŕĽŕ¤ŞŕĽŕ¤ŕĽŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤ŕ¤ŕĽŕ¤ŕĽŕ¤Źŕ¤°_ŕ¤¨ŕĽŕ¤­ŕĽŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤Ąŕ¤żŕ¤¸ŕĽŕ¤ŽŕĽŕ¤Źŕ¤°'.split("_"),
            monthsShort : 'ŕ¤ŕ¤¨._ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽ._ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤ż._ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕ¤žŕ¤._ŕ¤ŕ¤._ŕ¤¸ŕĽŕ¤ŞŕĽŕ¤._ŕ¤ŕ¤ŕĽŕ¤ŕĽ._ŕ¤¨ŕĽŕ¤­ŕĽ._ŕ¤Ąŕ¤żŕ¤¸ŕĽ.'.split("_"),
            weekdays : 'ŕ¤ŕ¤ŕ¤¤ŕ¤Źŕ¤žŕ¤°_ŕ¤¸ŕĽŕ¤Žŕ¤Źŕ¤žŕ¤°_ŕ¤Žŕ¤ŕĽŕ¤ŕ¤˛ŕ¤Źŕ¤žŕ¤°_ŕ¤ŹŕĽŕ¤§ŕ¤Źŕ¤žŕ¤°_ŕ¤Źŕ¤żŕ¤šŕ¤żŕ¤Źŕ¤žŕ¤°_ŕ¤śŕĽŕ¤ŕĽŕ¤°ŕ¤Źŕ¤žŕ¤°_ŕ¤śŕ¤¨ŕ¤żŕ¤Źŕ¤žŕ¤°'.split("_"),
            weekdaysShort : 'ŕ¤ŕ¤ŕ¤¤._ŕ¤¸ŕĽŕ¤Ž._ŕ¤Žŕ¤ŕĽŕ¤ŕ¤˛._ŕ¤ŹŕĽŕ¤§._ŕ¤Źŕ¤żŕ¤šŕ¤ż._ŕ¤śŕĽŕ¤ŕĽŕ¤°._ŕ¤śŕ¤¨ŕ¤ż.'.split("_"),
            weekdaysMin : 'ŕ¤ŕ¤._ŕ¤¸ŕĽ._ŕ¤Žŕ¤ŕĽ_ŕ¤ŹŕĽ._ŕ¤Źŕ¤ż._ŕ¤śŕĽ._ŕ¤ś.'.split("_"),
            longDateFormat : {
                LT : "Aŕ¤ŕĽ h:mm ŕ¤Źŕ¤ŕĽ",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY, LT",
                LLLL : "dddd, D MMMM YYYY, LT"
            },
            preparse: function (string) {
                return string.replace(/[ŕĽ§ŕĽ¨ŕĽŠŕĽŞŕĽŤŕĽŹŕĽ­ŕĽŽŕĽŻŕĽŚ]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 3) {
                    return "ŕ¤°ŕ¤žŕ¤¤ŕĽ";
                } else if (hour < 10) {
                    return "ŕ¤Źŕ¤żŕ¤šŕ¤žŕ¤¨";
                } else if (hour < 15) {
                    return "ŕ¤Śŕ¤żŕ¤ŕ¤ŕ¤¸ŕĽ";
                } else if (hour < 18) {
                    return "ŕ¤ŹŕĽŕ¤˛ŕĽŕ¤ŕ¤ž";
                } else if (hour < 20) {
                    return "ŕ¤¸ŕ¤žŕ¤ŕ¤";
                } else {
                    return "ŕ¤°ŕ¤žŕ¤¤ŕĽ";
                }
            },
            calendar : {
                sameDay : '[ŕ¤ŕ¤] LT',
                nextDay : '[ŕ¤­ŕĽŕ¤˛ŕĽ] LT',
                nextWeek : '[ŕ¤ŕ¤ŕ¤ŕ¤ŚŕĽ] dddd[,] LT',
                lastDay : '[ŕ¤šŕ¤żŕ¤ŕĽ] LT',
                lastWeek : '[ŕ¤ŕ¤ŕ¤ŕĽ] dddd[,] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%sŕ¤Žŕ¤ž",
                past : "%s ŕ¤ŕ¤ŕ¤žŕ¤ĄŕĽ",
                s : "ŕ¤ŕĽŕ¤šŕĽ ŕ¤¸ŕ¤Žŕ¤Ż",
                m : "ŕ¤ŕ¤ ŕ¤Žŕ¤żŕ¤¨ŕĽŕ¤",
                mm : "%d ŕ¤Žŕ¤żŕ¤¨ŕĽŕ¤",
                h : "ŕ¤ŕ¤ ŕ¤ŕ¤ŁŕĽŕ¤ŕ¤ž",
                hh : "%d ŕ¤ŕ¤ŁŕĽŕ¤ŕ¤ž",
                d : "ŕ¤ŕ¤ ŕ¤Śŕ¤żŕ¤¨",
                dd : "%d ŕ¤Śŕ¤żŕ¤¨",
                M : "ŕ¤ŕ¤ ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕ¤ž",
                MM : "%d ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕ¤ž",
                y : "ŕ¤ŕ¤ ŕ¤Źŕ¤°ŕĽŕ¤ˇ",
                yy : "%d ŕ¤Źŕ¤°ŕĽŕ¤ˇ"
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : dutch (nl)
// author : Joris RĂśling : https://github.com/jjupiter

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsShortWithDots = "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"),
            monthsShortWithoutDots = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_");

        return moment.lang('nl', {
            months : "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),
            monthsShort : function (m, format) {
                if (/-MMM-/.test(format)) {
                    return monthsShortWithoutDots[m.month()];
                } else {
                    return monthsShortWithDots[m.month()];
                }
            },
            weekdays : "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),
            weekdaysShort : "zo._ma._di._wo._do._vr._za.".split("_"),
            weekdaysMin : "Zo_Ma_Di_Wo_Do_Vr_Za".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD-MM-YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: '[vandaag om] LT',
                nextDay: '[morgen om] LT',
                nextWeek: 'dddd [om] LT',
                lastDay: '[gisteren om] LT',
                lastWeek: '[afgelopen] dddd [om] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "over %s",
                past : "%s geleden",
                s : "een paar seconden",
                m : "ĂŠĂŠn minuut",
                mm : "%d minuten",
                h : "ĂŠĂŠn uur",
                hh : "%d uur",
                d : "ĂŠĂŠn dag",
                dd : "%d dagen",
                M : "ĂŠĂŠn maand",
                MM : "%d maanden",
                y : "ĂŠĂŠn jaar",
                yy : "%d jaar"
            },
            ordinal : function (number) {
                return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : norwegian nynorsk (nn)
// author : https://github.com/mechuwind

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('nn', {
            months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
            monthsShort : "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
            weekdays : "sundag_mĂĽndag_tysdag_onsdag_torsdag_fredag_laurdag".split("_"),
            weekdaysShort : "sun_mĂĽn_tys_ons_tor_fre_lau".split("_"),
            weekdaysMin : "su_mĂĽ_ty_on_to_fr_lĂ¸".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: '[I dag klokka] LT',
                nextDay: '[I morgon klokka] LT',
                nextWeek: 'dddd [klokka] LT',
                lastDay: '[I gĂĽr klokka] LT',
                lastWeek: '[FĂ¸regĂĽande] dddd [klokka] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "om %s",
                past : "for %s sidan",
                s : "nokre sekund",
                m : "eit minutt",
                mm : "%d minutt",
                h : "ein time",
                hh : "%d timar",
                d : "ein dag",
                dd : "%d dagar",
                M : "ein mĂĽnad",
                MM : "%d mĂĽnader",
                y : "eit ĂĽr",
                yy : "%d ĂĽr"
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : polish (pl)
// author : Rafal Hirsz : https://github.com/evoL

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsNominative = "styczeĹ_luty_marzec_kwiecieĹ_maj_czerwiec_lipiec_sierpieĹ_wrzesieĹ_paĹşdziernik_listopad_grudzieĹ".split("_"),
            monthsSubjective = "stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrzeĹnia_paĹşdziernika_listopada_grudnia".split("_");

        function plural(n) {
            return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
        }

        function translate(number, withoutSuffix, key) {
            var result = number + " ";
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'minuta' : 'minutÄ';
                case 'mm':
                    return result + (plural(number) ? 'minuty' : 'minut');
                case 'h':
                    return withoutSuffix  ? 'godzina'  : 'godzinÄ';
                case 'hh':
                    return result + (plural(number) ? 'godziny' : 'godzin');
                case 'MM':
                    return result + (plural(number) ? 'miesiÄce' : 'miesiÄcy');
                case 'yy':
                    return result + (plural(number) ? 'lata' : 'lat');
            }
        }

        return moment.lang('pl', {
            months : function (momentToFormat, format) {
                if (/D MMMM/.test(format)) {
                    return monthsSubjective[momentToFormat.month()];
                } else {
                    return monthsNominative[momentToFormat.month()];
                }
            },
            monthsShort : "sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paĹş_lis_gru".split("_"),
            weekdays : "niedziela_poniedziaĹek_wtorek_Ĺroda_czwartek_piÄtek_sobota".split("_"),
            weekdaysShort : "nie_pon_wt_Ĺr_czw_pt_sb".split("_"),
            weekdaysMin : "N_Pn_Wt_Ĺr_Cz_Pt_So".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay: '[DziĹ o] LT',
                nextDay: '[Jutro o] LT',
                nextWeek: '[W] dddd [o] LT',
                lastDay: '[Wczoraj o] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[W zeszĹÄ niedzielÄ o] LT';
                        case 3:
                            return '[W zeszĹÄ ĹrodÄ o] LT';
                        case 6:
                            return '[W zeszĹÄ sobotÄ o] LT';
                        default:
                            return '[W zeszĹy] dddd [o] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : "za %s",
                past : "%s temu",
                s : "kilka sekund",
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : "1 dzieĹ",
                dd : '%d dni',
                M : "miesiÄc",
                MM : translate,
                y : "rok",
                yy : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : brazilian portuguese (pt-br)
// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('pt-br', {
            months : "janeiro_fevereiro_marĂ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
            monthsShort : "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
            weekdays : "domingo_segunda-feira_terĂ§a-feira_quarta-feira_quinta-feira_sexta-feira_sĂĄbado".split("_"),
            weekdaysShort : "dom_seg_ter_qua_qui_sex_sĂĄb".split("_"),
            weekdaysMin : "dom_2ÂŞ_3ÂŞ_4ÂŞ_5ÂŞ_6ÂŞ_sĂĄb".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D [de] MMMM [de] YYYY",
                LLL : "D [de] MMMM [de] YYYY [Ă s] LT",
                LLLL : "dddd, D [de] MMMM [de] YYYY [Ă s] LT"
            },
            calendar : {
                sameDay: '[Hoje Ă s] LT',
                nextDay: '[AmanhĂŁ Ă s] LT',
                nextWeek: 'dddd [Ă s] LT',
                lastDay: '[Ontem Ă s] LT',
                lastWeek: function () {
                    return (this.day() === 0 || this.day() === 6) ?
                        '[Ăltimo] dddd [Ă s] LT' : // Saturday + Sunday
                        '[Ăltima] dddd [Ă s] LT'; // Monday - Friday
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : "em %s",
                past : "%s atrĂĄs",
                s : "segundos",
                m : "um minuto",
                mm : "%d minutos",
                h : "uma hora",
                hh : "%d horas",
                d : "um dia",
                dd : "%d dias",
                M : "um mĂŞs",
                MM : "%d meses",
                y : "um ano",
                yy : "%d anos"
            },
            ordinal : '%dÂş'
        });
    }));
// moment.js language configuration
// language : portuguese (pt)
// author : Jefferson : https://github.com/jalex79

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('pt', {
            months : "janeiro_fevereiro_marĂ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
            monthsShort : "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
            weekdays : "domingo_segunda-feira_terĂ§a-feira_quarta-feira_quinta-feira_sexta-feira_sĂĄbado".split("_"),
            weekdaysShort : "dom_seg_ter_qua_qui_sex_sĂĄb".split("_"),
            weekdaysMin : "dom_2ÂŞ_3ÂŞ_4ÂŞ_5ÂŞ_6ÂŞ_sĂĄb".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D [de] MMMM [de] YYYY",
                LLL : "D [de] MMMM [de] YYYY LT",
                LLLL : "dddd, D [de] MMMM [de] YYYY LT"
            },
            calendar : {
                sameDay: '[Hoje Ă s] LT',
                nextDay: '[AmanhĂŁ Ă s] LT',
                nextWeek: 'dddd [Ă s] LT',
                lastDay: '[Ontem Ă s] LT',
                lastWeek: function () {
                    return (this.day() === 0 || this.day() === 6) ?
                        '[Ăltimo] dddd [Ă s] LT' : // Saturday + Sunday
                        '[Ăltima] dddd [Ă s] LT'; // Monday - Friday
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : "em %s",
                past : "hĂĄ %s",
                s : "segundos",
                m : "um minuto",
                mm : "%d minutos",
                h : "uma hora",
                hh : "%d horas",
                d : "um dia",
                dd : "%d dias",
                M : "um mĂŞs",
                MM : "%d meses",
                y : "um ano",
                yy : "%d anos"
            },
            ordinal : '%dÂş',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : romanian (ro)
// author : Vlad Gurdiga : https://github.com/gurdiga
// author : Valentin Agachi : https://github.com/avaly

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                    'mm': 'minute',
                    'hh': 'ore',
                    'dd': 'zile',
                    'MM': 'luni',
                    'yy': 'ani'
                },
                separator = ' ';
            if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
                separator = ' de ';
            }

            return number + separator + format[key];
        }

        return moment.lang('ro', {
            months : "ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"),
            monthsShort : "ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.".split("_"),
            weekdays : "duminicÄ_luni_marČi_miercuri_joi_vineri_sĂ˘mbÄtÄ".split("_"),
            weekdaysShort : "Dum_Lun_Mar_Mie_Joi_Vin_SĂ˘m".split("_"),
            weekdaysMin : "Du_Lu_Ma_Mi_Jo_Vi_SĂ˘".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY H:mm",
                LLLL : "dddd, D MMMM YYYY H:mm"
            },
            calendar : {
                sameDay: "[azi la] LT",
                nextDay: '[mĂ˘ine la] LT',
                nextWeek: 'dddd [la] LT',
                lastDay: '[ieri la] LT',
                lastWeek: '[fosta] dddd [la] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "peste %s",
                past : "%s ĂŽn urmÄ",
                s : "cĂ˘teva secunde",
                m : "un minut",
                mm : relativeTimeWithPlural,
                h : "o orÄ",
                hh : relativeTimeWithPlural,
                d : "o zi",
                dd : relativeTimeWithPlural,
                M : "o lunÄ",
                MM : relativeTimeWithPlural,
                y : "un an",
                yy : relativeTimeWithPlural
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : russian (ru)
// author : Viktorminator : https://github.com/Viktorminator
// Author : Menelion ElensĂşle : https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(word, num) {
            var forms = word.split('_');
            return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                'mm': withoutSuffix ? 'ĐźĐ¸Đ˝ŃŃĐ°_ĐźĐ¸Đ˝ŃŃŃ_ĐźĐ¸Đ˝ŃŃ' : 'ĐźĐ¸Đ˝ŃŃŃ_ĐźĐ¸Đ˝ŃŃŃ_ĐźĐ¸Đ˝ŃŃ',
                'hh': 'ŃĐ°Ń_ŃĐ°ŃĐ°_ŃĐ°ŃĐžĐ˛',
                'dd': 'Đ´ĐľĐ˝Ń_Đ´Đ˝Ń_Đ´Đ˝ĐľĐš',
                'MM': 'ĐźĐľŃŃŃ_ĐźĐľŃŃŃĐ°_ĐźĐľŃŃŃĐľĐ˛',
                'yy': 'ĐłĐžĐ´_ĐłĐžĐ´Đ°_ĐťĐľŃ'
            };
            if (key === 'm') {
                return withoutSuffix ? 'ĐźĐ¸Đ˝ŃŃĐ°' : 'ĐźĐ¸Đ˝ŃŃŃ';
            }
            else {
                return number + ' ' + plural(format[key], +number);
            }
        }

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'ŃĐ˝Đ˛Đ°ŃŃ_ŃĐľĐ˛ŃĐ°ĐťŃ_ĐźĐ°ŃŃ_Đ°ĐżŃĐľĐťŃ_ĐźĐ°Đš_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐ˝ŃŃĐąŃŃ_ĐžĐşŃŃĐąŃŃ_Đ˝ĐžŃĐąŃŃ_Đ´ĐľĐşĐ°ĐąŃŃ'.split('_'),
                    'accusative': 'ŃĐ˝Đ˛Đ°ŃŃ_ŃĐľĐ˛ŃĐ°ĐťŃ_ĐźĐ°ŃŃĐ°_Đ°ĐżŃĐľĐťŃ_ĐźĐ°Ń_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛ĐłŃŃŃĐ°_ŃĐľĐ˝ŃŃĐąŃŃ_ĐžĐşŃŃĐąŃŃ_Đ˝ĐžŃĐąŃŃ_Đ´ĐľĐşĐ°ĐąŃŃ'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function monthsShortCaseReplace(m, format) {
            var monthsShort = {
                    'nominative': 'ŃĐ˝Đ˛_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Đš_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛Đł_ŃĐľĐ˝_ĐžĐşŃ_Đ˝ĐžŃ_Đ´ĐľĐş'.split('_'),
                    'accusative': 'ŃĐ˝Đ˛_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Ń_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛Đł_ŃĐľĐ˝_ĐžĐşŃ_Đ˝ĐžŃ_Đ´ĐľĐş'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return monthsShort[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'Đ˛ĐžŃĐşŃĐľŃĐľĐ˝ŃĐľ_ĐżĐžĐ˝ĐľĐ´ĐľĐťŃĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃĐľĐ´Đ°_ŃĐľŃĐ˛ĐľŃĐł_ĐżŃŃĐ˝Đ¸ŃĐ°_ŃŃĐąĐąĐžŃĐ°'.split('_'),
                    'accusative': 'Đ˛ĐžŃĐşŃĐľŃĐľĐ˝ŃĐľ_ĐżĐžĐ˝ĐľĐ´ĐľĐťŃĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃĐľĐ´Ń_ŃĐľŃĐ˛ĐľŃĐł_ĐżŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐąĐžŃŃ'.split('_')
                },

                nounCase = (/\[ ?[ĐĐ˛] ?(?:ĐżŃĐžŃĐťŃŃ|ŃĐťĐľĐ´ŃŃŃŃŃ)? ?\] ?dddd/).test(format) ?
                    'accusative' :
                    'nominative';

            return weekdays[nounCase][m.day()];
        }

        return moment.lang('ru', {
            months : monthsCaseReplace,
            monthsShort : monthsShortCaseReplace,
            weekdays : weekdaysCaseReplace,
            weekdaysShort : "Đ˛Ń_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
            weekdaysMin : "Đ˛Ń_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
            monthsParse : [/^ŃĐ˝Đ˛/i, /^ŃĐľĐ˛/i, /^ĐźĐ°Ń/i, /^Đ°ĐżŃ/i, /^ĐźĐ°[Đš|Ń]/i, /^Đ¸ŃĐ˝/i, /^Đ¸ŃĐť/i, /^Đ°Đ˛Đł/i, /^ŃĐľĐ˝/i, /^ĐžĐşŃ/i, /^Đ˝ĐžŃ/i, /^Đ´ĐľĐş/i],
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY Đł.",
                LLL : "D MMMM YYYY Đł., LT",
                LLLL : "dddd, D MMMM YYYY Đł., LT"
            },
            calendar : {
                sameDay: '[ĐĄĐľĐłĐžĐ´Đ˝Ń Đ˛] LT',
                nextDay: '[ĐĐ°Đ˛ŃŃĐ° Đ˛] LT',
                lastDay: '[ĐŃĐľŃĐ° Đ˛] LT',
                nextWeek: function () {
                    return this.day() === 2 ? '[ĐĐž] dddd [Đ˛] LT' : '[Đ] dddd [Đ˛] LT';
                },
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[Đ ĐżŃĐžŃĐťĐžĐľ] dddd [Đ˛] LT';
                        case 1:
                        case 2:
                        case 4:
                            return '[Đ ĐżŃĐžŃĐťŃĐš] dddd [Đ˛] LT';
                        case 3:
                        case 5:
                        case 6:
                            return '[Đ ĐżŃĐžŃĐťŃŃ] dddd [Đ˛] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : "ŃĐľŃĐľĐˇ %s",
                past : "%s Đ˝Đ°ĐˇĐ°Đ´",
                s : "Đ˝ĐľŃĐşĐžĐťŃĐşĐž ŃĐľĐşŃĐ˝Đ´",
                m : relativeTimeWithPlural,
                mm : relativeTimeWithPlural,
                h : "ŃĐ°Ń",
                hh : relativeTimeWithPlural,
                d : "Đ´ĐľĐ˝Ń",
                dd : relativeTimeWithPlural,
                M : "ĐźĐľŃŃŃ",
                MM : relativeTimeWithPlural,
                y : "ĐłĐžĐ´",
                yy : relativeTimeWithPlural
            },

            meridiemParse: /Đ˝ĐžŃĐ¸|ŃŃŃĐ°|Đ´Đ˝Ń|Đ˛ĐľŃĐľŃĐ°/i,
            isPM : function (input) {
                return /^(Đ´Đ˝Ń|Đ˛ĐľŃĐľŃĐ°)$/.test(input);
            },

            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return "Đ˝ĐžŃĐ¸";
                } else if (hour < 12) {
                    return "ŃŃŃĐ°";
                } else if (hour < 17) {
                    return "Đ´Đ˝Ń";
                } else {
                    return "Đ˛ĐľŃĐľŃĐ°";
                }
            },

            ordinal: function (number, period) {
                switch (period) {
                    case 'M':
                    case 'd':
                    case 'DDD':
                        return number + '-Đš';
                    case 'D':
                        return number + '-ĐłĐž';
                    case 'w':
                    case 'W':
                        return number + '-Ń';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : slovak (sk)
// author : Martin Minka : https://github.com/k2s
// based on work of petrbela : https://github.com/petrbela

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var months = "januĂĄr_februĂĄr_marec_aprĂ­l_mĂĄj_jĂşn_jĂşl_august_september_oktĂłber_november_december".split("_"),
            monthsShort = "jan_feb_mar_apr_mĂĄj_jĂşn_jĂşl_aug_sep_okt_nov_dec".split("_");

        function plural(n) {
            return (n > 1) && (n < 5);
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + " ";
            switch (key) {
                case 's':  // a few seconds / in a few seconds / a few seconds ago
                    return (withoutSuffix || isFuture) ? 'pĂĄr sekĂşnd' : 'pĂĄr sekundami';
                case 'm':  // a minute / in a minute / a minute ago
                    return withoutSuffix ? 'minĂşta' : (isFuture ? 'minĂştu' : 'minĂştou');
                case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'minĂşty' : 'minĂşt');
                    } else {
                        return result + 'minĂştami';
                    }
                    break;
                case 'h':  // an hour / in an hour / an hour ago
                    return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
                case 'hh': // 9 hours / in 9 hours / 9 hours ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'hodiny' : 'hodĂ­n');
                    } else {
                        return result + 'hodinami';
                    }
                    break;
                case 'd':  // a day / in a day / a day ago
                    return (withoutSuffix || isFuture) ? 'deĹ' : 'dĹom';
                case 'dd': // 9 days / in 9 days / 9 days ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'dni' : 'dnĂ­');
                    } else {
                        return result + 'dĹami';
                    }
                    break;
                case 'M':  // a month / in a month / a month ago
                    return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
                case 'MM': // 9 months / in 9 months / 9 months ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'mesiace' : 'mesiacov');
                    } else {
                        return result + 'mesiacmi';
                    }
                    break;
                case 'y':  // a year / in a year / a year ago
                    return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
                case 'yy': // 9 years / in 9 years / 9 years ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'roky' : 'rokov');
                    } else {
                        return result + 'rokmi';
                    }
                    break;
            }
        }

        return moment.lang('sk', {
            months : months,
            monthsShort : monthsShort,
            monthsParse : (function (months, monthsShort) {
                var i, _monthsParse = [];
                for (i = 0; i < 12; i++) {
                    // use custom parser to solve problem with July (Äervenec)
                    _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
                }
                return _monthsParse;
            }(months, monthsShort)),
            weekdays : "nedeÄža_pondelok_utorok_streda_ĹĄtvrtok_piatok_sobota".split("_"),
            weekdaysShort : "ne_po_ut_st_ĹĄt_pi_so".split("_"),
            weekdaysMin : "ne_po_ut_st_ĹĄt_pi_so".split("_"),
            longDateFormat : {
                LT: "H:mm",
                L : "DD.MM.YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd D. MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[dnes o] LT",
                nextDay: '[zajtra o] LT',
                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[v nedeÄžu o] LT';
                        case 1:
                        case 2:
                            return '[v] dddd [o] LT';
                        case 3:
                            return '[v stredu o] LT';
                        case 4:
                            return '[vo ĹĄtvrtok o] LT';
                        case 5:
                            return '[v piatok o] LT';
                        case 6:
                            return '[v sobotu o] LT';
                    }
                },
                lastDay: '[vÄera o] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[minulĂş nedeÄžu o] LT';
                        case 1:
                        case 2:
                            return '[minulĂ˝] dddd [o] LT';
                        case 3:
                            return '[minulĂş stredu o] LT';
                        case 4:
                        case 5:
                            return '[minulĂ˝] dddd [o] LT';
                        case 6:
                            return '[minulĂş sobotu o] LT';
                    }
                },
                sameElse: "L"
            },
            relativeTime : {
                future : "za %s",
                past : "pred %s",
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : slovenian (sl)
// author : Robert SedovĹĄek : https://github.com/sedovsek

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function translate(number, withoutSuffix, key) {
            var result = number + " ";
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'ena minuta' : 'eno minuto';
                case 'mm':
                    if (number === 1) {
                        result += 'minuta';
                    } else if (number === 2) {
                        result += 'minuti';
                    } else if (number === 3 || number === 4) {
                        result += 'minute';
                    } else {
                        result += 'minut';
                    }
                    return result;
                case 'h':
                    return withoutSuffix ? 'ena ura' : 'eno uro';
                case 'hh':
                    if (number === 1) {
                        result += 'ura';
                    } else if (number === 2) {
                        result += 'uri';
                    } else if (number === 3 || number === 4) {
                        result += 'ure';
                    } else {
                        result += 'ur';
                    }
                    return result;
                case 'dd':
                    if (number === 1) {
                        result += 'dan';
                    } else {
                        result += 'dni';
                    }
                    return result;
                case 'MM':
                    if (number === 1) {
                        result += 'mesec';
                    } else if (number === 2) {
                        result += 'meseca';
                    } else if (number === 3 || number === 4) {
                        result += 'mesece';
                    } else {
                        result += 'mesecev';
                    }
                    return result;
                case 'yy':
                    if (number === 1) {
                        result += 'leto';
                    } else if (number === 2) {
                        result += 'leti';
                    } else if (number === 3 || number === 4) {
                        result += 'leta';
                    } else {
                        result += 'let';
                    }
                    return result;
            }
        }

        return moment.lang('sl', {
            months : "januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"),
            monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
            weekdays : "nedelja_ponedeljek_torek_sreda_Äetrtek_petek_sobota".split("_"),
            weekdaysShort : "ned._pon._tor._sre._Äet._pet._sob.".split("_"),
            weekdaysMin : "ne_po_to_sr_Äe_pe_so".split("_"),
            longDateFormat : {
                LT : "H:mm",
                L : "DD. MM. YYYY",
                LL : "D. MMMM YYYY",
                LLL : "D. MMMM YYYY LT",
                LLLL : "dddd, D. MMMM YYYY LT"
            },
            calendar : {
                sameDay  : '[danes ob] LT',
                nextDay  : '[jutri ob] LT',

                nextWeek : function () {
                    switch (this.day()) {
                        case 0:
                            return '[v] [nedeljo] [ob] LT';
                        case 3:
                            return '[v] [sredo] [ob] LT';
                        case 6:
                            return '[v] [soboto] [ob] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[v] dddd [ob] LT';
                    }
                },
                lastDay  : '[vÄeraj ob] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 6:
                            return '[prejĹĄnja] dddd [ob] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[prejĹĄnji] dddd [ob] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "Äez %s",
                past   : "%s nazaj",
                s      : "nekaj sekund",
                m      : translate,
                mm     : translate,
                h      : translate,
                hh     : translate,
                d      : "en dan",
                dd     : translate,
                M      : "en mesec",
                MM     : translate,
                y      : "eno leto",
                yy     : translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Albanian (sq)
// author : FlakĂŤrim Ismani : https://github.com/flakerimi
// author: Menelion ElensĂşle: https://github.com/Oire (tests)
// author : Oerd Cukalla : https://github.com/oerd (fixes)

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('sq', {
            months : "Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_NĂŤntor_Dhjetor".split("_"),
            monthsShort : "Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_NĂŤn_Dhj".split("_"),
            weekdays : "E Diel_E HĂŤnĂŤ_E MartĂŤ_E MĂŤrkurĂŤ_E Enjte_E Premte_E ShtunĂŤ".split("_"),
            weekdaysShort : "Die_HĂŤn_Mar_MĂŤr_Enj_Pre_Sht".split("_"),
            weekdaysMin : "D_H_Ma_MĂŤ_E_P_Sh".split("_"),
            meridiem : function (hours, minutes, isLower) {
                return hours < 12 ? 'PD' : 'MD';
            },
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[Sot nĂŤ] LT',
                nextDay : '[NesĂŤr nĂŤ] LT',
                nextWeek : 'dddd [nĂŤ] LT',
                lastDay : '[Dje nĂŤ] LT',
                lastWeek : 'dddd [e kaluar nĂŤ] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "nĂŤ %s",
                past : "%s mĂŤ parĂŤ",
                s : "disa sekonda",
                m : "njĂŤ minutĂŤ",
                mm : "%d minuta",
                h : "njĂŤ orĂŤ",
                hh : "%d orĂŤ",
                d : "njĂŤ ditĂŤ",
                dd : "%d ditĂŤ",
                M : "njĂŤ muaj",
                MM : "%d muaj",
                y : "njĂŤ vit",
                yy : "%d vite"
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Serbian-cyrillic (sr-cyrl)
// author : Milan JanaÄkoviÄ<milanjanackovic@gmail.com> : https://github.com/milan-j

    (function (factory) {
        factory(moment);
    }(function (moment) {

        var translator = {
            words: { //Different grammatical cases
                m: ['ŃĐľĐ´Đ°Đ˝ ĐźĐ¸Đ˝ŃŃ', 'ŃĐľĐ´Đ˝Đľ ĐźĐ¸Đ˝ŃŃĐľ'],
                mm: ['ĐźĐ¸Đ˝ŃŃ', 'ĐźĐ¸Đ˝ŃŃĐľ', 'ĐźĐ¸Đ˝ŃŃĐ°'],
                h: ['ŃĐľĐ´Đ°Đ˝ ŃĐ°Ń', 'ŃĐľĐ´Đ˝ĐžĐł ŃĐ°ŃĐ°'],
                hh: ['ŃĐ°Ń', 'ŃĐ°ŃĐ°', 'ŃĐ°ŃĐ¸'],
                dd: ['Đ´Đ°Đ˝', 'Đ´Đ°Đ˝Đ°', 'Đ´Đ°Đ˝Đ°'],
                MM: ['ĐźĐľŃĐľŃ', 'ĐźĐľŃĐľŃĐ°', 'ĐźĐľŃĐľŃĐ¸'],
                yy: ['ĐłĐžĐ´Đ¸Đ˝Đ°', 'ĐłĐžĐ´Đ¸Đ˝Đľ', 'ĐłĐžĐ´Đ¸Đ˝Đ°']
            },
            correctGrammaticalCase: function (number, wordKey) {
                return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
            },
            translate: function (number, withoutSuffix, key) {
                var wordKey = translator.words[key];
                if (key.length === 1) {
                    return withoutSuffix ? wordKey[0] : wordKey[1];
                } else {
                    return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
                }
            }
        };

        return moment.lang('sr-cyrl', {
            months: ['ŃĐ°Đ˝ŃĐ°Ń', 'ŃĐľĐąŃŃĐ°Ń', 'ĐźĐ°ŃŃ', 'Đ°ĐżŃĐ¸Đť', 'ĐźĐ°Ń', 'ŃŃĐ˝', 'ŃŃĐť', 'Đ°Đ˛ĐłŃŃŃ', 'ŃĐľĐżŃĐľĐźĐąĐ°Ń', 'ĐžĐşŃĐžĐąĐ°Ń', 'Đ˝ĐžĐ˛ĐľĐźĐąĐ°Ń', 'Đ´ĐľŃĐľĐźĐąĐ°Ń'],
            monthsShort: ['ŃĐ°Đ˝.', 'ŃĐľĐą.', 'ĐźĐ°Ń.', 'Đ°ĐżŃ.', 'ĐźĐ°Ń', 'ŃŃĐ˝', 'ŃŃĐť', 'Đ°Đ˛Đł.', 'ŃĐľĐż.', 'ĐžĐşŃ.', 'Đ˝ĐžĐ˛.', 'Đ´ĐľŃ.'],
            weekdays: ['Đ˝ĐľĐ´ĐľŃĐ°', 'ĐżĐžĐ˝ĐľĐ´ĐľŃĐ°Đş', 'ŃŃĐžŃĐ°Đş', 'ŃŃĐľĐ´Đ°', 'ŃĐľŃĐ˛ŃŃĐ°Đş', 'ĐżĐľŃĐ°Đş', 'ŃŃĐąĐžŃĐ°'],
            weekdaysShort: ['Đ˝ĐľĐ´.', 'ĐżĐžĐ˝.', 'ŃŃĐž.', 'ŃŃĐľ.', 'ŃĐľŃ.', 'ĐżĐľŃ.', 'ŃŃĐą.'],
            weekdaysMin: ['Đ˝Đľ', 'ĐżĐž', 'ŃŃ', 'ŃŃ', 'ŃĐľ', 'ĐżĐľ', 'ŃŃ'],
            longDateFormat: {
                LT: "H:mm",
                L: "DD. MM. YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY LT",
                LLLL: "dddd, D. MMMM YYYY LT"
            },
            calendar: {
                sameDay: '[Đ´Đ°Đ˝Đ°Ń Ń] LT',
                nextDay: '[ŃŃŃŃĐ° Ń] LT',

                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[Ń] [Đ˝ĐľĐ´ĐľŃŃ] [Ń] LT';
                        case 3:
                            return '[Ń] [ŃŃĐľĐ´Ń] [Ń] LT';
                        case 6:
                            return '[Ń] [ŃŃĐąĐžŃŃ] [Ń] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[Ń] dddd [Ń] LT';
                    }
                },
                lastDay  : '[ŃŃŃĐľ Ń] LT',
                lastWeek : function () {
                    var lastWeekDays = [
                        '[ĐżŃĐžŃĐťĐľ] [Đ˝ĐľĐ´ĐľŃĐľ] [Ń] LT',
                        '[ĐżŃĐžŃĐťĐžĐł] [ĐżĐžĐ˝ĐľĐ´ĐľŃĐşĐ°] [Ń] LT',
                        '[ĐżŃĐžŃĐťĐžĐł] [ŃŃĐžŃĐşĐ°] [Ń] LT',
                        '[ĐżŃĐžŃĐťĐľ] [ŃŃĐľĐ´Đľ] [Ń] LT',
                        '[ĐżŃĐžŃĐťĐžĐł] [ŃĐľŃĐ˛ŃŃĐşĐ°] [Ń] LT',
                        '[ĐżŃĐžŃĐťĐžĐł] [ĐżĐľŃĐşĐ°] [Ń] LT',
                        '[ĐżŃĐžŃĐťĐľ] [ŃŃĐąĐžŃĐľ] [Ń] LT'
                    ];
                    return lastWeekDays[this.day()];
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "ĐˇĐ° %s",
                past   : "ĐżŃĐľ %s",
                s      : "Đ˝ĐľĐşĐžĐťĐ¸ĐşĐž ŃĐľĐşŃĐ˝Đ´Đ¸",
                m      : translator.translate,
                mm     : translator.translate,
                h      : translator.translate,
                hh     : translator.translate,
                d      : "Đ´Đ°Đ˝",
                dd     : translator.translate,
                M      : "ĐźĐľŃĐľŃ",
                MM     : translator.translate,
                y      : "ĐłĐžĐ´Đ¸Đ˝Ń",
                yy     : translator.translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Serbian-latin (sr)
// author : Milan JanaÄkoviÄ<milanjanackovic@gmail.com> : https://github.com/milan-j

    (function (factory) {
        factory(moment);
    }(function (moment) {

        var translator = {
            words: { //Different grammatical cases
                m: ['jedan minut', 'jedne minute'],
                mm: ['minut', 'minute', 'minuta'],
                h: ['jedan sat', 'jednog sata'],
                hh: ['sat', 'sata', 'sati'],
                dd: ['dan', 'dana', 'dana'],
                MM: ['mesec', 'meseca', 'meseci'],
                yy: ['godina', 'godine', 'godina']
            },
            correctGrammaticalCase: function (number, wordKey) {
                return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
            },
            translate: function (number, withoutSuffix, key) {
                var wordKey = translator.words[key];
                if (key.length === 1) {
                    return withoutSuffix ? wordKey[0] : wordKey[1];
                } else {
                    return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
                }
            }
        };

        return moment.lang('sr', {
            months: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'],
            monthsShort: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun', 'jul', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'],
            weekdays: ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'Äetvrtak', 'petak', 'subota'],
            weekdaysShort: ['ned.', 'pon.', 'uto.', 'sre.', 'Äet.', 'pet.', 'sub.'],
            weekdaysMin: ['ne', 'po', 'ut', 'sr', 'Äe', 'pe', 'su'],
            longDateFormat: {
                LT: "H:mm",
                L: "DD. MM. YYYY",
                LL: "D. MMMM YYYY",
                LLL: "D. MMMM YYYY LT",
                LLLL: "dddd, D. MMMM YYYY LT"
            },
            calendar: {
                sameDay: '[danas u] LT',
                nextDay: '[sutra u] LT',

                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[u] [nedelju] [u] LT';
                        case 3:
                            return '[u] [sredu] [u] LT';
                        case 6:
                            return '[u] [subotu] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[u] dddd [u] LT';
                    }
                },
                lastDay  : '[juÄe u] LT',
                lastWeek : function () {
                    var lastWeekDays = [
                        '[proĹĄle] [nedelje] [u] LT',
                        '[proĹĄlog] [ponedeljka] [u] LT',
                        '[proĹĄlog] [utorka] [u] LT',
                        '[proĹĄle] [srede] [u] LT',
                        '[proĹĄlog] [Äetvrtka] [u] LT',
                        '[proĹĄlog] [petka] [u] LT',
                        '[proĹĄle] [subote] [u] LT'
                    ];
                    return lastWeekDays[this.day()];
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : "za %s",
                past   : "pre %s",
                s      : "nekoliko sekundi",
                m      : translator.translate,
                mm     : translator.translate,
                h      : translator.translate,
                hh     : translator.translate,
                d      : "dan",
                dd     : translator.translate,
                M      : "mesec",
                MM     : translator.translate,
                y      : "godinu",
                yy     : translator.translate
            },
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : swedish (sv)
// author : Jens Alm : https://github.com/ulmus

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('sv', {
            months : "januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"),
            monthsShort : "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
            weekdays : "sĂśndag_mĂĽndag_tisdag_onsdag_torsdag_fredag_lĂśrdag".split("_"),
            weekdaysShort : "sĂśn_mĂĽn_tis_ons_tor_fre_lĂśr".split("_"),
            weekdaysMin : "sĂś_mĂĽ_ti_on_to_fr_lĂś".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "YYYY-MM-DD",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: '[Idag] LT',
                nextDay: '[Imorgon] LT',
                lastDay: '[IgĂĽr] LT',
                nextWeek: 'dddd LT',
                lastWeek: '[FĂśrra] dddd[en] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "om %s",
                past : "fĂśr %s sedan",
                s : "nĂĽgra sekunder",
                m : "en minut",
                mm : "%d minuter",
                h : "en timme",
                hh : "%d timmar",
                d : "en dag",
                dd : "%d dagar",
                M : "en mĂĽnad",
                MM : "%d mĂĽnader",
                y : "ett ĂĽr",
                yy : "%d ĂĽr"
            },
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~ (number % 100 / 10) === 1) ? 'e' :
                        (b === 1) ? 'a' :
                            (b === 2) ? 'a' :
                                (b === 3) ? 'e' : 'e';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : tamil (ta)
// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

    (function (factory) {
        factory(moment);
    }(function (moment) {
        /*var symbolMap = {
         '1': 'ŕŻ§',
         '2': 'ŕŻ¨',
         '3': 'ŕŻŠ',
         '4': 'ŕŻŞ',
         '5': 'ŕŻŤ',
         '6': 'ŕŻŹ',
         '7': 'ŕŻ­',
         '8': 'ŕŻŽ',
         '9': 'ŕŻŻ',
         '0': 'ŕŻŚ'
         },
         numberMap = {
         'ŕŻ§': '1',
         'ŕŻ¨': '2',
         'ŕŻŠ': '3',
         'ŕŻŞ': '4',
         'ŕŻŤ': '5',
         'ŕŻŹ': '6',
         'ŕŻ­': '7',
         'ŕŻŽ': '8',
         'ŕŻŻ': '9',
         'ŕŻŚ': '0'
         }; */

        return moment.lang('ta', {
            months : 'ŕŽŕŽŠŕŽľŕŽ°ŕŽż_ŕŽŞŕŽżŕŽŞŕŻŕŽ°ŕŽľŕŽ°ŕŽż_ŕŽŽŕŽžŕŽ°ŕŻŕŽŕŻ_ŕŽŕŽŞŕŻŕŽ°ŕŽ˛ŕŻ_ŕŽŽŕŻ_ŕŽŕŻŕŽŠŕŻ_ŕŽŕŻŕŽ˛ŕŻ_ŕŽŕŽŕŽ¸ŕŻŕŽŕŻ_ŕŽŕŻŕŽŞŕŻŕŽŕŻŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽŕŻŕŽŕŻŕŽžŕŽŞŕŽ°ŕŻ_ŕŽ¨ŕŽľŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽżŕŽŕŽŽŕŻŕŽŞŕŽ°ŕŻ'.split("_"),
            monthsShort : 'ŕŽŕŽŠŕŽľŕŽ°ŕŽż_ŕŽŞŕŽżŕŽŞŕŻŕŽ°ŕŽľŕŽ°ŕŽż_ŕŽŽŕŽžŕŽ°ŕŻŕŽŕŻ_ŕŽŕŽŞŕŻŕŽ°ŕŽ˛ŕŻ_ŕŽŽŕŻ_ŕŽŕŻŕŽŠŕŻ_ŕŽŕŻŕŽ˛ŕŻ_ŕŽŕŽŕŽ¸ŕŻŕŽŕŻ_ŕŽŕŻŕŽŞŕŻŕŽŕŻŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽŕŻŕŽŕŻŕŽžŕŽŞŕŽ°ŕŻ_ŕŽ¨ŕŽľŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽżŕŽŕŽŽŕŻŕŽŞŕŽ°ŕŻ'.split("_"),
            weekdays : 'ŕŽŕŽžŕŽŻŕŽżŕŽąŕŻŕŽąŕŻŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽ¤ŕŽżŕŽŕŻŕŽŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽŕŻŕŽľŕŻŕŽľŕŽžŕŽŻŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽŞŕŻŕŽ¤ŕŽŠŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽľŕŽżŕŽŻŕŽžŕŽ´ŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽľŕŻŕŽłŕŻŕŽłŕŽżŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽŕŽŠŕŽżŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ'.split("_"),
            weekdaysShort : 'ŕŽŕŽžŕŽŻŕŽżŕŽąŕŻ_ŕŽ¤ŕŽżŕŽŕŻŕŽŕŽłŕŻ_ŕŽŕŻŕŽľŕŻŕŽľŕŽžŕŽŻŕŻ_ŕŽŞŕŻŕŽ¤ŕŽŠŕŻ_ŕŽľŕŽżŕŽŻŕŽžŕŽ´ŕŽŠŕŻ_ŕŽľŕŻŕŽłŕŻŕŽłŕŽż_ŕŽŕŽŠŕŽż'.split("_"),
            weekdaysMin : 'ŕŽŕŽž_ŕŽ¤ŕŽż_ŕŽŕŻ_ŕŽŞŕŻ_ŕŽľŕŽż_ŕŽľŕŻ_ŕŽ'.split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY, LT",
                LLLL : "dddd, D MMMM YYYY, LT"
            },
            calendar : {
                sameDay : '[ŕŽŕŽŠŕŻŕŽąŕŻ] LT',
                nextDay : '[ŕŽ¨ŕŽžŕŽłŕŻ] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[ŕŽ¨ŕŻŕŽąŕŻŕŽąŕŻ] LT',
                lastWeek : '[ŕŽŕŽŕŽ¨ŕŻŕŽ¤ ŕŽľŕŽžŕŽ°ŕŽŽŕŻ] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s ŕŽŕŽ˛ŕŻ",
                past : "%s ŕŽŽŕŻŕŽŠŕŻ",
                s : "ŕŽŕŽ°ŕŻ ŕŽŕŽżŕŽ˛ ŕŽľŕŽżŕŽ¨ŕŽžŕŽŕŽżŕŽŕŽłŕŻ",
                m : "ŕŽŕŽ°ŕŻ ŕŽ¨ŕŽżŕŽŽŕŽżŕŽŕŽŽŕŻ",
                mm : "%d ŕŽ¨ŕŽżŕŽŽŕŽżŕŽŕŽŕŻŕŽŕŽłŕŻ",
                h : "ŕŽŕŽ°ŕŻ ŕŽŽŕŽŁŕŽż ŕŽ¨ŕŻŕŽ°ŕŽŽŕŻ",
                hh : "%d ŕŽŽŕŽŁŕŽż ŕŽ¨ŕŻŕŽ°ŕŽŽŕŻ",
                d : "ŕŽŕŽ°ŕŻ ŕŽ¨ŕŽžŕŽłŕŻ",
                dd : "%d ŕŽ¨ŕŽžŕŽŕŻŕŽŕŽłŕŻ",
                M : "ŕŽŕŽ°ŕŻ ŕŽŽŕŽžŕŽ¤ŕŽŽŕŻ",
                MM : "%d ŕŽŽŕŽžŕŽ¤ŕŽŕŻŕŽŕŽłŕŻ",
                y : "ŕŽŕŽ°ŕŻ ŕŽľŕŽ°ŕŻŕŽŕŽŽŕŻ",
                yy : "%d ŕŽŕŽŁŕŻŕŽŕŻŕŽŕŽłŕŻ"
            },
            /*        preparse: function (string) {
             return string.replace(/[ŕŻ§ŕŻ¨ŕŻŠŕŻŞŕŻŤŕŻŹŕŻ­ŕŻŽŕŻŻŕŻŚ]/g, function (match) {
             return numberMap[match];
             });
             },
             postformat: function (string) {
             return string.replace(/\d/g, function (match) {
             return symbolMap[match];
             });
             },*/
            ordinal : function (number) {
                return number + 'ŕŽľŕŽ¤ŕŻ';
            },


// refer http://ta.wikipedia.org/s/1er1      

            meridiem : function (hour, minute, isLower) {
                if (hour >= 6 && hour <= 10) {
                    return " ŕŽŕŽžŕŽ˛ŕŻ";
                } else   if (hour >= 10 && hour <= 14) {
                    return " ŕŽ¨ŕŽŁŕŻŕŽŞŕŽŕŽ˛ŕŻ";
                } else    if (hour >= 14 && hour <= 18) {
                    return " ŕŽŕŽąŕŻŕŽŞŕŽžŕŽŕŻ";
                } else   if (hour >= 18 && hour <= 20) {
                    return " ŕŽŽŕŽžŕŽ˛ŕŻ";
                } else  if (hour >= 20 && hour <= 24) {
                    return " ŕŽŕŽ°ŕŽľŕŻ";
                } else  if (hour >= 0 && hour <= 6) {
                    return " ŕŽľŕŻŕŽŕŽąŕŻ";
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : thai (th)
// author : Kridsada Thanabulpong : https://github.com/sirn

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('th', {
            months : "ŕ¸Ąŕ¸ŕ¸Łŕ¸˛ŕ¸ŕ¸Ą_ŕ¸ŕ¸¸ŕ¸Ąŕ¸ ŕ¸˛ŕ¸ŕ¸ąŕ¸ŕ¸ŕš_ŕ¸Ąŕ¸ľŕ¸ŕ¸˛ŕ¸ŕ¸Ą_ŕšŕ¸Ąŕ¸Šŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸¤ŕ¸Šŕ¸ ŕ¸˛ŕ¸ŕ¸Ą_ŕ¸Ąŕ¸´ŕ¸ŕ¸¸ŕ¸ŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸Łŕ¸ŕ¸ŕ¸˛ŕ¸ŕ¸Ą_ŕ¸Şŕ¸´ŕ¸ŕ¸Ťŕ¸˛ŕ¸ŕ¸Ą_ŕ¸ŕ¸ąŕ¸ŕ¸˘ŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸¸ŕ¸Ľŕ¸˛ŕ¸ŕ¸Ą_ŕ¸ŕ¸¤ŕ¸¨ŕ¸ŕ¸´ŕ¸ŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸ąŕ¸ŕ¸§ŕ¸˛ŕ¸ŕ¸Ą".split("_"),
            monthsShort : "ŕ¸Ąŕ¸ŕ¸Łŕ¸˛_ŕ¸ŕ¸¸ŕ¸Ąŕ¸ ŕ¸˛_ŕ¸Ąŕ¸ľŕ¸ŕ¸˛_ŕšŕ¸Ąŕ¸Šŕ¸˛_ŕ¸ŕ¸¤ŕ¸Šŕ¸ ŕ¸˛_ŕ¸Ąŕ¸´ŕ¸ŕ¸¸ŕ¸ŕ¸˛_ŕ¸ŕ¸Łŕ¸ŕ¸ŕ¸˛_ŕ¸Şŕ¸´ŕ¸ŕ¸Ťŕ¸˛_ŕ¸ŕ¸ąŕ¸ŕ¸˘ŕ¸˛_ŕ¸ŕ¸¸ŕ¸Ľŕ¸˛_ŕ¸ŕ¸¤ŕ¸¨ŕ¸ŕ¸´ŕ¸ŕ¸˛_ŕ¸ŕ¸ąŕ¸ŕ¸§ŕ¸˛".split("_"),
            weekdays : "ŕ¸­ŕ¸˛ŕ¸ŕ¸´ŕ¸ŕ¸˘ŕš_ŕ¸ŕ¸ąŕ¸ŕ¸ŕ¸Łŕš_ŕ¸­ŕ¸ąŕ¸ŕ¸ŕ¸˛ŕ¸Ł_ŕ¸ŕ¸¸ŕ¸_ŕ¸ŕ¸¤ŕ¸Ťŕ¸ąŕ¸Şŕ¸ŕ¸ŕ¸ľ_ŕ¸¨ŕ¸¸ŕ¸ŕ¸Łŕš_ŕšŕ¸Şŕ¸˛ŕ¸Łŕš".split("_"),
            weekdaysShort : "ŕ¸­ŕ¸˛ŕ¸ŕ¸´ŕ¸ŕ¸˘ŕš_ŕ¸ŕ¸ąŕ¸ŕ¸ŕ¸Łŕš_ŕ¸­ŕ¸ąŕ¸ŕ¸ŕ¸˛ŕ¸Ł_ŕ¸ŕ¸¸ŕ¸_ŕ¸ŕ¸¤ŕ¸Ťŕ¸ąŕ¸Ş_ŕ¸¨ŕ¸¸ŕ¸ŕ¸Łŕš_ŕšŕ¸Şŕ¸˛ŕ¸Łŕš".split("_"), // yes, three characters difference
            weekdaysMin : "ŕ¸­ŕ¸˛._ŕ¸._ŕ¸­._ŕ¸._ŕ¸ŕ¸¤._ŕ¸¨._ŕ¸Ş.".split("_"),
            longDateFormat : {
                LT : "H ŕ¸ŕ¸˛ŕ¸Źŕ¸´ŕ¸ŕ¸˛ m ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
                L : "YYYY/MM/DD",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY ŕšŕ¸§ŕ¸Ľŕ¸˛ LT",
                LLLL : "ŕ¸§ŕ¸ąŕ¸ddddŕ¸ŕ¸ľŕš D MMMM YYYY ŕšŕ¸§ŕ¸Ľŕ¸˛ LT"
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return "ŕ¸ŕšŕ¸­ŕ¸ŕšŕ¸ŕ¸ľŕšŕ¸˘ŕ¸";
                } else {
                    return "ŕ¸Ťŕ¸Ľŕ¸ąŕ¸ŕšŕ¸ŕ¸ľŕšŕ¸˘ŕ¸";
                }
            },
            calendar : {
                sameDay : '[ŕ¸§ŕ¸ąŕ¸ŕ¸ŕ¸ľŕš ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
                nextDay : '[ŕ¸ŕ¸Łŕ¸¸ŕšŕ¸ŕ¸ŕ¸ľŕš ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
                nextWeek : 'dddd[ŕ¸Ťŕ¸ŕšŕ¸˛ ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
                lastDay : '[ŕšŕ¸Ąŕ¸ˇŕšŕ¸­ŕ¸§ŕ¸˛ŕ¸ŕ¸ŕ¸ľŕš ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
                lastWeek : '[ŕ¸§ŕ¸ąŕ¸]dddd[ŕ¸ŕ¸ľŕšŕšŕ¸Ľŕšŕ¸§ ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "ŕ¸­ŕ¸ľŕ¸ %s",
                past : "%sŕ¸ŕ¸ľŕšŕšŕ¸Ľŕšŕ¸§",
                s : "ŕšŕ¸Ąŕšŕ¸ŕ¸ľŕšŕ¸§ŕ¸´ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
                m : "1 ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
                mm : "%d ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
                h : "1 ŕ¸ŕ¸ąŕšŕ¸§ŕšŕ¸Ąŕ¸",
                hh : "%d ŕ¸ŕ¸ąŕšŕ¸§ŕšŕ¸Ąŕ¸",
                d : "1 ŕ¸§ŕ¸ąŕ¸",
                dd : "%d ŕ¸§ŕ¸ąŕ¸",
                M : "1 ŕšŕ¸ŕ¸ˇŕ¸­ŕ¸",
                MM : "%d ŕšŕ¸ŕ¸ˇŕ¸­ŕ¸",
                y : "1 ŕ¸ŕ¸ľ",
                yy : "%d ŕ¸ŕ¸ľ"
            }
        });
    }));
// moment.js language configuration
// language : Tagalog/Filipino (tl-ph)
// author : Dan Hagman

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('tl-ph', {
            months : "Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre".split("_"),
            monthsShort : "Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis".split("_"),
            weekdays : "Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado".split("_"),
            weekdaysShort : "Lin_Lun_Mar_Miy_Huw_Biy_Sab".split("_"),
            weekdaysMin : "Li_Lu_Ma_Mi_Hu_Bi_Sab".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "MM/D/YYYY",
                LL : "MMMM D, YYYY",
                LLL : "MMMM D, YYYY LT",
                LLLL : "dddd, MMMM DD, YYYY LT"
            },
            calendar : {
                sameDay: "[Ngayon sa] LT",
                nextDay: '[Bukas sa] LT',
                nextWeek: 'dddd [sa] LT',
                lastDay: '[Kahapon sa] LT',
                lastWeek: 'dddd [huling linggo] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "sa loob ng %s",
                past : "%s ang nakalipas",
                s : "ilang segundo",
                m : "isang minuto",
                mm : "%d minuto",
                h : "isang oras",
                hh : "%d oras",
                d : "isang araw",
                dd : "%d araw",
                M : "isang buwan",
                MM : "%d buwan",
                y : "isang taon",
                yy : "%d taon"
            },
            ordinal : function (number) {
                return number;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : turkish (tr)
// authors : Erhan Gundogan : https://github.com/erhangundogan,
//           Burak YiÄit Kaya: https://github.com/BYK

    (function (factory) {
        factory(moment);
    }(function (moment) {

        var suffixes = {
            1: "'inci",
            5: "'inci",
            8: "'inci",
            70: "'inci",
            80: "'inci",

            2: "'nci",
            7: "'nci",
            20: "'nci",
            50: "'nci",

            3: "'ĂźncĂź",
            4: "'ĂźncĂź",
            100: "'ĂźncĂź",

            6: "'ncÄą",

            9: "'uncu",
            10: "'uncu",
            30: "'uncu",

            60: "'ÄąncÄą",
            90: "'ÄąncÄą"
        };

        return moment.lang('tr', {
            months : "Ocak_Ĺubat_Mart_Nisan_MayÄąs_Haziran_Temmuz_AÄustos_EylĂźl_Ekim_KasÄąm_AralÄąk".split("_"),
            monthsShort : "Oca_Ĺub_Mar_Nis_May_Haz_Tem_AÄu_Eyl_Eki_Kas_Ara".split("_"),
            weekdays : "Pazar_Pazartesi_SalÄą_ĂarĹamba_PerĹembe_Cuma_Cumartesi".split("_"),
            weekdaysShort : "Paz_Pts_Sal_Ăar_Per_Cum_Cts".split("_"),
            weekdaysMin : "Pz_Pt_Sa_Ăa_Pe_Cu_Ct".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd, D MMMM YYYY LT"
            },
            calendar : {
                sameDay : '[bugĂźn saat] LT',
                nextDay : '[yarÄąn saat] LT',
                nextWeek : '[haftaya] dddd [saat] LT',
                lastDay : '[dĂźn] LT',
                lastWeek : '[geĂ§en hafta] dddd [saat] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : "%s sonra",
                past : "%s Ăśnce",
                s : "birkaĂ§ saniye",
                m : "bir dakika",
                mm : "%d dakika",
                h : "bir saat",
                hh : "%d saat",
                d : "bir gĂźn",
                dd : "%d gĂźn",
                M : "bir ay",
                MM : "%d ay",
                y : "bir yÄąl",
                yy : "%d yÄąl"
            },
            ordinal : function (number) {
                if (number === 0) {  // special case for zero
                    return number + "'ÄąncÄą";
                }
                var a = number % 10,
                    b = number % 100 - a,
                    c = number >= 100 ? 100 : null;

                return number + (suffixes[a] || suffixes[b] || suffixes[c]);
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Morocco Central Atlas TamaziÉŁt in Latin (tzm-latn)
// author : Abdel Said : https://github.com/abdelsaid

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('tzm-latn', {
            months : "innayr_brË¤ayrË¤_marË¤sË¤_ibrir_mayyw_ywnyw_ywlywz_ÉŁwĹĄt_ĹĄwtanbir_ktË¤wbrË¤_nwwanbir_dwjnbir".split("_"),
            monthsShort : "innayr_brË¤ayrË¤_marË¤sË¤_ibrir_mayyw_ywnyw_ywlywz_ÉŁwĹĄt_ĹĄwtanbir_ktË¤wbrË¤_nwwanbir_dwjnbir".split("_"),
            weekdays : "asamas_aynas_asinas_akras_akwas_asimwas_asiá¸yas".split("_"),
            weekdaysShort : "asamas_aynas_asinas_akras_akwas_asimwas_asiá¸yas".split("_"),
            weekdaysMin : "asamas_aynas_asinas_akras_akwas_asimwas_asiá¸yas".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[asdkh g] LT",
                nextDay: '[aska g] LT',
                nextWeek: 'dddd [g] LT',
                lastDay: '[assant g] LT',
                lastWeek: 'dddd [g] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "dadkh s yan %s",
                past : "yan %s",
                s : "imik",
                m : "minuá¸",
                mm : "%d minuá¸",
                h : "saÉa",
                hh : "%d tassaÉin",
                d : "ass",
                dd : "%d ossan",
                M : "ayowr",
                MM : "%d iyyirn",
                y : "asgas",
                yy : "%d isgasn"
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : Morocco Central Atlas TamaziÉŁt (tzm)
// author : Abdel Said : https://github.com/abdelsaid

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('tzm', {
            months : "âľâľâľâ´°âľ˘âľ_â´ąâľâ´°âľ˘âľ_âľâ´°âľâľ_âľâ´ąâľâľâľ_âľâ´°âľ˘âľ˘âľ_âľ˘âľâľâľ˘âľ_âľ˘âľâľâľ˘âľâľŁ_âľâľâľâľ_âľâľâľâ´°âľâ´ąâľâľ_â´˝âľâľâ´ąâľ_âľâľâľĄâ´°âľâ´ąâľâľ_â´ˇâľâľâľâ´ąâľâľ".split("_"),
            monthsShort : "âľâľâľâ´°âľ˘âľ_â´ąâľâ´°âľ˘âľ_âľâ´°âľâľ_âľâ´ąâľâľâľ_âľâ´°âľ˘âľ˘âľ_âľ˘âľâľâľ˘âľ_âľ˘âľâľâľ˘âľâľŁ_âľâľâľâľ_âľâľâľâ´°âľâ´ąâľâľ_â´˝âľâľâ´ąâľ_âľâľâľĄâ´°âľâ´ąâľâľ_â´ˇâľâľâľâ´ąâľâľ".split("_"),
            weekdays : "â´°âľâ´°âľâ´°âľ_â´°âľ˘âľâ´°âľ_â´°âľâľâľâ´°âľ_â´°â´˝âľâ´°âľ_â´°â´˝âľĄâ´°âľ_â´°âľâľâľâľĄâ´°âľ_â´°âľâľâ´šâľ˘â´°âľ".split("_"),
            weekdaysShort : "â´°âľâ´°âľâ´°âľ_â´°âľ˘âľâ´°âľ_â´°âľâľâľâ´°âľ_â´°â´˝âľâ´°âľ_â´°â´˝âľĄâ´°âľ_â´°âľâľâľâľĄâ´°âľ_â´°âľâľâ´šâľ˘â´°âľ".split("_"),
            weekdaysMin : "â´°âľâ´°âľâ´°âľ_â´°âľ˘âľâ´°âľ_â´°âľâľâľâ´°âľ_â´°â´˝âľâ´°âľ_â´°â´˝âľĄâ´°âľ_â´°âľâľâľâľĄâ´°âľ_â´°âľâľâ´šâľ˘â´°âľ".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "dddd D MMMM YYYY LT"
            },
            calendar : {
                sameDay: "[â´°âľâ´ˇâľ â´´] LT",
                nextDay: '[â´°âľâ´˝â´° â´´] LT',
                nextWeek: 'dddd [â´´] LT',
                lastDay: '[â´°âľâ´°âľâľ â´´] LT',
                lastWeek: 'dddd [â´´] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "â´ˇâ´°â´ˇâľ âľ âľ˘â´°âľ %s",
                past : "âľ˘â´°âľ %s",
                s : "âľâľâľâ´˝",
                m : "âľâľâľâľâ´ş",
                mm : "%d âľâľâľâľâ´ş",
                h : "âľâ´°âľâ´°",
                hh : "%d âľâ´°âľâľâ´°âľâľâľ",
                d : "â´°âľâľ",
                dd : "%d oâľâľâ´°âľ",
                M : "â´°âľ˘oâľâľ",
                MM : "%d âľâľ˘âľ˘âľâľâľ",
                y : "â´°âľâ´łâ´°âľ",
                yy : "%d âľâľâ´łâ´°âľâľ"
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : ukrainian (uk)
// author : zemlanin : https://github.com/zemlanin
// Author : Menelion ElensĂşle : https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(word, num) {
            var forms = word.split('_');
            return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                'mm': 'ŃĐ˛Đ¸ĐťĐ¸Đ˝Đ°_ŃĐ˛Đ¸ĐťĐ¸Đ˝Đ¸_ŃĐ˛Đ¸ĐťĐ¸Đ˝',
                'hh': 'ĐłĐžĐ´Đ¸Đ˝Đ°_ĐłĐžĐ´Đ¸Đ˝Đ¸_ĐłĐžĐ´Đ¸Đ˝',
                'dd': 'Đ´ĐľĐ˝Ń_Đ´Đ˝Ń_Đ´Đ˝ŃĐ˛',
                'MM': 'ĐźŃŃŃŃŃ_ĐźŃŃŃŃŃ_ĐźŃŃŃŃŃĐ˛',
                'yy': 'ŃŃĐş_ŃĐžĐşĐ¸_ŃĐžĐşŃĐ˛'
            };
            if (key === 'm') {
                return withoutSuffix ? 'ŃĐ˛Đ¸ĐťĐ¸Đ˝Đ°' : 'ŃĐ˛Đ¸ĐťĐ¸Đ˝Ń';
            }
            else if (key === 'h') {
                return withoutSuffix ? 'ĐłĐžĐ´Đ¸Đ˝Đ°' : 'ĐłĐžĐ´Đ¸Đ˝Ń';
            }
            else {
                return number + ' ' + plural(format[key], +number);
            }
        }

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'ŃŃŃĐľĐ˝Ń_ĐťŃŃĐ¸Đš_ĐąĐľŃĐľĐˇĐľĐ˝Ń_ĐşĐ˛ŃŃĐľĐ˝Ń_ŃŃĐ°Đ˛ĐľĐ˝Ń_ŃĐľŃĐ˛ĐľĐ˝Ń_ĐťĐ¸ĐżĐľĐ˝Ń_ŃĐľŃĐżĐľĐ˝Ń_Đ˛ĐľŃĐľŃĐľĐ˝Ń_ĐśĐžĐ˛ŃĐľĐ˝Ń_ĐťĐ¸ŃŃĐžĐżĐ°Đ´_ĐłŃŃĐ´ĐľĐ˝Ń'.split('_'),
                    'accusative': 'ŃŃŃĐ˝Ń_ĐťŃŃĐžĐłĐž_ĐąĐľŃĐľĐˇĐ˝Ń_ĐşĐ˛ŃŃĐ˝Ń_ŃŃĐ°Đ˛Đ˝Ń_ŃĐľŃĐ˛Đ˝Ń_ĐťĐ¸ĐżĐ˝Ń_ŃĐľŃĐżĐ˝Ń_Đ˛ĐľŃĐľŃĐ˝Ń_ĐśĐžĐ˛ŃĐ˝Ń_ĐťĐ¸ŃŃĐžĐżĐ°Đ´Đ°_ĐłŃŃĐ´Đ˝Ń'.split('_')
                },

                nounCase = (/D[oD]? *MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'Đ˝ĐľĐ´ŃĐťŃ_ĐżĐžĐ˝ĐľĐ´ŃĐťĐžĐş_Đ˛ŃĐ˛ŃĐžŃĐžĐş_ŃĐľŃĐľĐ´Đ°_ŃĐľŃĐ˛ĐľŃ_ĐżâŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐžŃĐ°'.split('_'),
                    'accusative': 'Đ˝ĐľĐ´ŃĐťŃ_ĐżĐžĐ˝ĐľĐ´ŃĐťĐžĐş_Đ˛ŃĐ˛ŃĐžŃĐžĐş_ŃĐľŃĐľĐ´Ń_ŃĐľŃĐ˛ĐľŃ_ĐżâŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐžŃŃ'.split('_'),
                    'genitive': 'Đ˝ĐľĐ´ŃĐťŃ_ĐżĐžĐ˝ĐľĐ´ŃĐťĐşĐ°_Đ˛ŃĐ˛ŃĐžŃĐşĐ°_ŃĐľŃĐľĐ´Đ¸_ŃĐľŃĐ˛ĐľŃĐłĐ°_ĐżâŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐžŃĐ¸'.split('_')
                },

                nounCase = (/(\[[ĐĐ˛ĐŁŃ]\]) ?dddd/).test(format) ?
                    'accusative' :
                    ((/\[?(?:ĐźĐ¸Đ˝ŃĐťĐžŃ|Đ˝Đ°ŃŃŃĐżĐ˝ĐžŃ)? ?\] ?dddd/).test(format) ?
                        'genitive' :
                        'nominative');

            return weekdays[nounCase][m.day()];
        }

        function processHoursFunction(str) {
            return function () {
                return str + 'Đž' + (this.hours() === 11 ? 'Đą' : '') + '] LT';
            };
        }

        return moment.lang('uk', {
            months : monthsCaseReplace,
            monthsShort : "ŃŃŃ_ĐťŃŃ_ĐąĐľŃ_ĐşĐ˛ŃŃ_ŃŃĐ°Đ˛_ŃĐľŃĐ˛_ĐťĐ¸Đż_ŃĐľŃĐż_Đ˛ĐľŃ_ĐśĐžĐ˛Ń_ĐťĐ¸ŃŃ_ĐłŃŃĐ´".split("_"),
            weekdays : weekdaysCaseReplace,
            weekdaysShort : "Đ˝Đ´_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
            weekdaysMin : "Đ˝Đ´_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD.MM.YYYY",
                LL : "D MMMM YYYY Ń.",
                LLL : "D MMMM YYYY Ń., LT",
                LLLL : "dddd, D MMMM YYYY Ń., LT"
            },
            calendar : {
                sameDay: processHoursFunction('[ĐĄŃĐžĐłĐžĐ´Đ˝Ń '),
                nextDay: processHoursFunction('[ĐĐ°Đ˛ŃŃĐ° '),
                lastDay: processHoursFunction('[ĐŃĐžŃĐ° '),
                nextWeek: processHoursFunction('[ĐŁ] dddd ['),
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 5:
                        case 6:
                            return processHoursFunction('[ĐĐ¸Đ˝ŃĐťĐžŃ] dddd [').call(this);
                        case 1:
                        case 2:
                        case 4:
                            return processHoursFunction('[ĐĐ¸Đ˝ŃĐťĐžĐłĐž] dddd [').call(this);
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : "ĐˇĐ° %s",
                past : "%s ŃĐžĐźŃ",
                s : "Đ´ĐľĐşŃĐťŃĐşĐ° ŃĐľĐşŃĐ˝Đ´",
                m : relativeTimeWithPlural,
                mm : relativeTimeWithPlural,
                h : "ĐłĐžĐ´Đ¸Đ˝Ń",
                hh : relativeTimeWithPlural,
                d : "Đ´ĐľĐ˝Ń",
                dd : relativeTimeWithPlural,
                M : "ĐźŃŃŃŃŃ",
                MM : relativeTimeWithPlural,
                y : "ŃŃĐş",
                yy : relativeTimeWithPlural
            },

            // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return "Đ˝ĐžŃŃ";
                } else if (hour < 12) {
                    return "ŃĐ°Đ˝ĐşŃ";
                } else if (hour < 17) {
                    return "Đ´Đ˝Ń";
                } else {
                    return "Đ˛ĐľŃĐžŃĐ°";
                }
            },

            ordinal: function (number, period) {
                switch (period) {
                    case 'M':
                    case 'd':
                    case 'DDD':
                    case 'w':
                    case 'W':
                        return number + '-Đš';
                    case 'D':
                        return number + '-ĐłĐž';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : uzbek
// author : Sardor Muminov : https://github.com/muminoff

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('uz', {
            months : "ŃĐ˝Đ˛Đ°ŃŃ_ŃĐľĐ˛ŃĐ°ĐťŃ_ĐźĐ°ŃŃ_Đ°ĐżŃĐľĐťŃ_ĐźĐ°Đš_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐ˝ŃŃĐąŃŃ_ĐžĐşŃŃĐąŃŃ_Đ˝ĐžŃĐąŃŃ_Đ´ĐľĐşĐ°ĐąŃŃ".split("_"),
            monthsShort : "ŃĐ˝Đ˛_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Đš_Đ¸ŃĐ˝_Đ¸ŃĐť_Đ°Đ˛Đł_ŃĐľĐ˝_ĐžĐşŃ_Đ˝ĐžŃ_Đ´ĐľĐş".split("_"),
            weekdays : "ĐŻĐşŃĐ°Đ˝ĐąĐ°_ĐŃŃĐ°Đ˝ĐąĐ°_ĐĄĐľŃĐ°Đ˝ĐąĐ°_Đ§ĐžŃŃĐ°Đ˝ĐąĐ°_ĐĐ°ĐšŃĐ°Đ˝ĐąĐ°_ĐŃĐźĐ°_Đ¨Đ°Đ˝ĐąĐ°".split("_"),
            weekdaysShort : "ĐŻĐşŃ_ĐŃŃ_ĐĄĐľŃ_Đ§ĐžŃ_ĐĐ°Đš_ĐŃĐź_Đ¨Đ°Đ˝".split("_"),
            weekdaysMin : "ĐŻĐş_ĐŃ_ĐĄĐľ_Đ§Đž_ĐĐ°_ĐŃ_Đ¨Đ°".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM YYYY",
                LLL : "D MMMM YYYY LT",
                LLLL : "D MMMM YYYY, dddd LT"
            },
            calendar : {
                sameDay : '[ĐŃĐłŃĐ˝ ŃĐžĐ°Ń] LT [Đ´Đ°]',
                nextDay : '[Đ­ŃŃĐ°ĐłĐ°] LT [Đ´Đ°]',
                nextWeek : 'dddd [ĐşŃĐ˝Đ¸ ŃĐžĐ°Ń] LT [Đ´Đ°]',
                lastDay : '[ĐĐľŃĐ° ŃĐžĐ°Ń] LT [Đ´Đ°]',
                lastWeek : '[ĐŁŃĐłĐ°Đ˝] dddd [ĐşŃĐ˝Đ¸ ŃĐžĐ°Ń] LT [Đ´Đ°]',
                sameElse : 'L'
            },
            relativeTime : {
                future : "ĐŻĐşĐ¸Đ˝ %s Đ¸ŃĐ¸Đ´Đ°",
                past : "ĐĐ¸Ń Đ˝ĐľŃĐ° %s ĐžĐťĐ´Đ¸Đ˝",
                s : "ŃŃŃŃĐ°Ń",
                m : "ĐąĐ¸Ń Đ´Đ°ĐşĐ¸ĐşĐ°",
                mm : "%d Đ´Đ°ĐşĐ¸ĐşĐ°",
                h : "ĐąĐ¸Ń ŃĐžĐ°Ń",
                hh : "%d ŃĐžĐ°Ń",
                d : "ĐąĐ¸Ń ĐşŃĐ˝",
                dd : "%d ĐşŃĐ˝",
                M : "ĐąĐ¸Ń ĐžĐš",
                MM : "%d ĐžĐš",
                y : "ĐąĐ¸Ń ĐšĐ¸Đť",
                yy : "%d ĐšĐ¸Đť"
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : vietnamese (vi)
// author : Bang Nguyen : https://github.com/bangnk

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('vi', {
            months : "thĂĄng 1_thĂĄng 2_thĂĄng 3_thĂĄng 4_thĂĄng 5_thĂĄng 6_thĂĄng 7_thĂĄng 8_thĂĄng 9_thĂĄng 10_thĂĄng 11_thĂĄng 12".split("_"),
            monthsShort : "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),
            weekdays : "cháť§ nháş­t_tháťŠ hai_tháťŠ ba_tháťŠ tĆ°_tháťŠ nÄm_tháťŠ sĂĄu_tháťŠ báşŁy".split("_"),
            weekdaysShort : "CN_T2_T3_T4_T5_T6_T7".split("_"),
            weekdaysMin : "CN_T2_T3_T4_T5_T6_T7".split("_"),
            longDateFormat : {
                LT : "HH:mm",
                L : "DD/MM/YYYY",
                LL : "D MMMM [nÄm] YYYY",
                LLL : "D MMMM [nÄm] YYYY LT",
                LLLL : "dddd, D MMMM [nÄm] YYYY LT",
                l : "DD/M/YYYY",
                ll : "D MMM YYYY",
                lll : "D MMM YYYY LT",
                llll : "ddd, D MMM YYYY LT"
            },
            calendar : {
                sameDay: "[HĂ´m nay lĂşc] LT",
                nextDay: '[NgĂ y mai lĂşc] LT',
                nextWeek: 'dddd [tuáş§n táťi lĂşc] LT',
                lastDay: '[HĂ´m qua lĂşc] LT',
                lastWeek: 'dddd [tuáş§n ráťi lĂşc] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : "%s táťi",
                past : "%s trĆ°áťc",
                s : "vĂ i giĂ˘y",
                m : "máťt phĂşt",
                mm : "%d phĂşt",
                h : "máťt giáť",
                hh : "%d giáť",
                d : "máťt ngĂ y",
                dd : "%d ngĂ y",
                M : "máťt thĂĄng",
                MM : "%d thĂĄng",
                y : "máťt nÄm",
                yy : "%d nÄm"
            },
            ordinal : function (number) {
                return number;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : chinese
// author : suupic : https://github.com/suupic
// author : Zeno Zeng : https://github.com/zenozeng

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('zh-cn', {
            months : "ä¸ć_äşć_ä¸ć_ĺć_äşć_ĺ­ć_ä¸ć_ĺŤć_äšć_ĺć_ĺä¸ć_ĺäşć".split("_"),
            monthsShort : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
            weekdays : "ćććĽ_ććä¸_ććäş_ććä¸_ććĺ_ććäş_ććĺ­".split("_"),
            weekdaysShort : "ĺ¨ćĽ_ĺ¨ä¸_ĺ¨äş_ĺ¨ä¸_ĺ¨ĺ_ĺ¨äş_ĺ¨ĺ­".split("_"),
            weekdaysMin : "ćĽ_ä¸_äş_ä¸_ĺ_äş_ĺ­".split("_"),
            longDateFormat : {
                LT : "Ahçšmm",
                L : "YYYY-MM-DD",
                LL : "YYYYĺš´MMMDćĽ",
                LLL : "YYYYĺš´MMMDćĽLT",
                LLLL : "YYYYĺš´MMMDćĽddddLT",
                l : "YYYY-MM-DD",
                ll : "YYYYĺš´MMMDćĽ",
                lll : "YYYYĺš´MMMDćĽLT",
                llll : "YYYYĺš´MMMDćĽddddLT"
            },
            meridiem : function (hour, minute, isLower) {
                var hm = hour * 100 + minute;
                if (hm < 600) {
                    return "ĺć¨";
                } else if (hm < 900) {
                    return "ćŠä¸";
                } else if (hm < 1130) {
                    return "ä¸ĺ";
                } else if (hm < 1230) {
                    return "ä¸­ĺ";
                } else if (hm < 1800) {
                    return "ä¸ĺ";
                } else {
                    return "ćä¸";
                }
            },
            calendar : {
                sameDay : function () {
                    return this.minutes() === 0 ? "[äťĺ¤Š]Ah[çšć´]" : "[äťĺ¤Š]LT";
                },
                nextDay : function () {
                    return this.minutes() === 0 ? "[ćĺ¤Š]Ah[çšć´]" : "[ćĺ¤Š]LT";
                },
                lastDay : function () {
                    return this.minutes() === 0 ? "[ć¨ĺ¤Š]Ah[çšć´]" : "[ć¨ĺ¤Š]LT";
                },
                nextWeek : function () {
                    var startOfWeek, prefix;
                    startOfWeek = moment().startOf('week');
                    prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[ä¸]' : '[ćŹ]';
                    return this.minutes() === 0 ? prefix + "dddAhçšć´" : prefix + "dddAhçšmm";
                },
                lastWeek : function () {
                    var startOfWeek, prefix;
                    startOfWeek = moment().startOf('week');
                    prefix = this.unix() < startOfWeek.unix()  ? '[ä¸]' : '[ćŹ]';
                    return this.minutes() === 0 ? prefix + "dddAhçšć´" : prefix + "dddAhçšmm";
                },
                sameElse : 'LL'
            },
            ordinal : function (number, period) {
                switch (period) {
                    case "d":
                    case "D":
                    case "DDD":
                        return number + "ćĽ";
                    case "M":
                        return number + "ć";
                    case "w":
                    case "W":
                        return number + "ĺ¨";
                    default:
                        return number;
                }
            },
            relativeTime : {
                future : "%sĺ",
                past : "%sĺ",
                s : "ĺ ç§",
                m : "1ĺé",
                mm : "%dĺé",
                h : "1ĺ°ćś",
                hh : "%dĺ°ćś",
                d : "1ĺ¤Š",
                dd : "%dĺ¤Š",
                M : "1ä¸Şć",
                MM : "%dä¸Şć",
                y : "1ĺš´",
                yy : "%dĺš´"
            },
            week : {
                // GB/T 7408-1994ăć°ćŽĺĺäş¤ć˘ć źĺźÂˇäżĄćŻäş¤ć˘ÂˇćĽćĺćśé´čĄ¨ç¤şćłăä¸ISO 8601:1988ç­ć
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js language configuration
// language : traditional chinese (zh-tw)
// author : Ben : https://github.com/ben-lin

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.lang('zh-tw', {
            months : "ä¸ć_äşć_ä¸ć_ĺć_äşć_ĺ­ć_ä¸ć_ĺŤć_äšć_ĺć_ĺä¸ć_ĺäşć".split("_"),
            monthsShort : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
            weekdays : "ćććĽ_ććä¸_ććäş_ććä¸_ććĺ_ććäş_ććĺ­".split("_"),
            weekdaysShort : "éąćĽ_éąä¸_éąäş_éąä¸_éąĺ_éąäş_éąĺ­".split("_"),
            weekdaysMin : "ćĽ_ä¸_äş_ä¸_ĺ_äş_ĺ­".split("_"),
            longDateFormat : {
                LT : "Ahéťmm",
                L : "YYYYĺš´MMMDćĽ",
                LL : "YYYYĺš´MMMDćĽ",
                LLL : "YYYYĺš´MMMDćĽLT",
                LLLL : "YYYYĺš´MMMDćĽddddLT",
                l : "YYYYĺš´MMMDćĽ",
                ll : "YYYYĺš´MMMDćĽ",
                lll : "YYYYĺš´MMMDćĽLT",
                llll : "YYYYĺš´MMMDćĽddddLT"
            },
            meridiem : function (hour, minute, isLower) {
                var hm = hour * 100 + minute;
                if (hm < 900) {
                    return "ćŠä¸";
                } else if (hm < 1130) {
                    return "ä¸ĺ";
                } else if (hm < 1230) {
                    return "ä¸­ĺ";
                } else if (hm < 1800) {
                    return "ä¸ĺ";
                } else {
                    return "ćä¸";
                }
            },
            calendar : {
                sameDay : '[äťĺ¤Š]LT',
                nextDay : '[ćĺ¤Š]LT',
                nextWeek : '[ä¸]ddddLT',
                lastDay : '[ć¨ĺ¤Š]LT',
                lastWeek : '[ä¸]ddddLT',
                sameElse : 'L'
            },
            ordinal : function (number, period) {
                switch (period) {
                    case "d" :
                    case "D" :
                    case "DDD" :
                        return number + "ćĽ";
                    case "M" :
                        return number + "ć";
                    case "w" :
                    case "W" :
                        return number + "éą";
                    default :
                        return number;
                }
            },
            relativeTime : {
                future : "%sĺ§",
                past : "%sĺ",
                s : "ĺšžç§",
                m : "ä¸ĺé",
                mm : "%dĺé",
                h : "ä¸ĺ°ć",
                hh : "%dĺ°ć",
                d : "ä¸ĺ¤Š",
                dd : "%dĺ¤Š",
                M : "ä¸ĺć",
                MM : "%dĺć",
                y : "ä¸ĺš´",
                yy : "%dĺš´"
            }
        });
    }));

    moment.lang('en');


    /************************************
     Exposing Moment
     ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    "Accessing Moment through the global scope is " +
                    "deprecated, and will be removed in an upcoming " +
                    "release.",
                moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === "function" && define.amd) {
        define("moment", function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);