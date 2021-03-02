Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("@sentry/core");
var utils_1 = require("@sentry/utils");
var base_1 = require("./base");
/** `XHR` based transport */
var XHRTransport = /** @class */ (function (_super) {
    tslib_1.__extends(XHRTransport, _super);
    function XHRTransport() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @inheritDoc
     */
    XHRTransport.prototype.sendEvent = function (event) {
        var _this = this;
        var eventType = event.type || 'event';
        if (this._isRateLimited(eventType)) {
            return Promise.reject({
                event: event,
                reason: "Transport locked till " + this._disabledUntil(eventType) + " due to too many requests.",
                status: 429,
            });
        }
        var sentryReq = core_1.eventToSentryRequest(event, this._api);
        return this._buffer.add(new utils_1.SyncPromise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    var headers = {
                        'x-sentry-rate-limits': request.getResponseHeader('X-Sentry-Rate-Limits'),
                        'retry-after': request.getResponseHeader('Retry-After'),
                    };
                    _this._handleResponse({ eventType: eventType, response: request, headers: headers, resolve: resolve, reject: reject });
                }
            };
            request.open('POST', sentryReq.url);
            for (var header in _this.options.headers) {
                if (_this.options.headers.hasOwnProperty(header)) {
                    request.setRequestHeader(header, _this.options.headers[header]);
                }
            }
            request.send(sentryReq.body);
        }));
    };
    return XHRTransport;
}(base_1.BaseTransport));
exports.XHRTransport = XHRTransport;
//# sourceMappingURL=xhr.js.map