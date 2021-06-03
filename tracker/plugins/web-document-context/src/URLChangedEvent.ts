import { Tracker, TrackerEvent } from '@objectiv/tracker-core';

/**
 * The event name definition
 */
export const URL_CHANGE_EVENT_NAME = 'URLChangeEvent';

/**
 * URLChangedEvent triggers on each URL change. The actual URL can be retrieved from the WebDocumentContext
 */
export class URLChangedEvent extends TrackerEvent {}

/**
 * Although a `popstate` Event exists, it's only triggered on actual user's interactions with the browser's buttons.
 * To solve this problem, instead, we spy on History's methods.
 * When calls to the aforementioned methods are detected we use the pre-factored URLChangedEvent and track it via the
 * given Tracker instance.
 */
export const trackURLChangedEvent = (tracker: Tracker): void => {
  // Just to keep things short
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history: { [index: string]: any } = window.history;

  // Make a backup copy of all the History methods we intend to spy on
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyBackup: { [index: string]: any } = {
    pushState: history.pushState,
    replaceState: history.replaceState,
    go: history.go,
    back: history.back,
    forward: history.forward,
  };

  // Factor URLChangedEvent. The actual URL can be retrieved via the WebDocumentContext in the Global Contexts list
  const urlChangedEvent = new URLChangedEvent({ eventName: URL_CHANGE_EVENT_NAME });

  // Create all the spies: for each of them we just track the URLChangeEvent and run the original backed-up method.
  Object.keys(historyBackup).forEach((methodToSpy) => {
    history[methodToSpy] = (...rest: unknown[]) => {
      tracker.trackEvent(urlChangedEvent);
      return historyBackup[methodToSpy].apply(history, rest);
    };
  });
};
