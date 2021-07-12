import { isNonEmptyArray, TrackerEvent, TrackerTransport, TransportableEvent } from '@objectiv/tracker-core';
import { NonEmptyArray } from '../../../core/tracker/src/helpers';

/**
 * The default XMLHttpRequest function implementation.
 */
export const defaultXMLHttpRequestFunction = ({
  endpoint,
  events,
}: {
  endpoint: string;
  events: [TrackerEvent, ...TrackerEvent[]];
}): Promise<unknown> => {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    const async = true;
    xhr.open('POST', endpoint, async);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.withCredentials = true;
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: xhr.status,
        statusText: xhr.statusText,
      });
    };
    events.forEach((event) => event.setTransportTime());
    xhr.send(JSON.stringify(events));
  });
};

/**
 * The configuration of the XMLHttpRequestTransport class
 */
export type XMLHttpRequestTransportConfig = {
  /**
   * Collector's URI. Where to send the Events to.
   */
  endpoint: string;

  /**
   * Optional. Override the default XMLHttpRequestFunction implementation with a custom one.
   */
  xmlHttpRequestFunction?: typeof defaultXMLHttpRequestFunction;
};

/**
 * A TrackerTransport based on XMLHttpRequest. Sends event to the specified Collector endpoint.
 * Optionally supports specifying a custom `xmlHttpRequestFunction`.
 */
export class XMLHttpRequestTransport implements TrackerTransport {
  readonly transportName = 'XMLHttpRequestTransport';
  readonly endpoint: string;
  readonly xmlHttpRequestFunction: typeof defaultXMLHttpRequestFunction;

  constructor(config: XMLHttpRequestTransportConfig) {
    this.endpoint = config.endpoint;
    this.xmlHttpRequestFunction = config.xmlHttpRequestFunction ?? defaultXMLHttpRequestFunction;
  }

  async handle(...args: NonEmptyArray<TransportableEvent>): Promise<any> {
    const events = await Promise.all(args);
    if (isNonEmptyArray(events)) {
      return this.xmlHttpRequestFunction({ endpoint: this.endpoint, events });
    }
  }

  isUsable(): boolean {
    return Boolean(XMLHttpRequest);
  }
}
