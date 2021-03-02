import { __extends } from "tslib";
import { eventToSentryRequest } from '@sentry/core';
import { getGlobalObject, supportsReferrerPolicy, SyncPromise } from '@sentry/utils';
import { BaseTransport } from './base';
var global = getGlobalObject();
/** `fetch` based transport */
var FetchTransport = /** @class */ (function (_super) {
    __extends(FetchTransport, _super);
    function FetchTransport() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @inheritDoc
     */
    FetchTransport.prototype.sendEvent = function (event) {
        var _this = this;
        var eventType = event.type || 'event';
        if (this._isRateLimited(eventType)) {
            return Promise.reject({
                event: event,
                reason: "Transport locked till " + this._disabledUntil(eventType) + " due to too many requests.",
                status: 429,
            });
        }
        var sentryReq = eventToSentryRequest(event, this._api);
        var options = {
            body: sentryReq.body,
            method: 'POST',
            // Despite all stars in the sky saying that Edge supports old draft syntax, aka 'never', 'always', 'origin' and 'default
            // https://caniuse.com/#feat=referrer-policy
            // It doesn't. And it throw exception instead of ignoring this parameter...
            // REF: https://github.com/getsentry/raven-js/issues/1233
            referrerPolicy: (supportsReferrerPolicy() ? 'origin' : ''),
        };
        if (this.options.fetchParameters !== undefined) {
            Object.assign(options, this.options.fetchParameters);
        }
        if (this.options.headers !== undefined) {
            options.headers = this.options.headers;
        }
        return this._buffer.add(new SyncPromise(function (resolve, reject) {
            global
                .fetch(sentryReq.url, options)
                .then(function (response) {
                var headers = {
                    'x-sentry-rate-limits': response.headers.get('X-Sentry-Rate-Limits'),
                    'retry-after': response.headers.get('Retry-After'),
                };
                _this._handleResponse({ eventType: eventType, response: response, headers: headers, resolve: resolve, reject: reject });
            })
                .catch(reject);
        }));
    };
    return FetchTransport;
}(BaseTransport));
export { FetchTransport };
//# sourceMappingURL=fetch.js.map