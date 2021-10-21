/**
 * @jest-environment node
 */
import { makeClickEvent } from '@objectiv/tracker-core';
import {
  BrowserTracker,
  makeTracker,
  getLocationHref,
  makeMutationCallback,
  startAutoTracking,
  trackApplicationLoaded,
  trackEvent,
  trackURLChange,
  getTracker,
} from '../src';

describe('Without DOM', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw if Window does not exists', async () => {
    expect(() => makeTracker({ applicationId: 'test', endpoint: 'test' })).toThrow(
      'Cannot access the Window interface.'
    );

    expect(() => getTracker()).toThrow('Cannot access the Window interface.');
  });

  it('should console.error if a Tracker instance cannot be retrieved because DOM is not available', async () => {
    const parameters = { eventFactory: makeClickEvent, element: null };
    // @ts-ignore
    trackEvent(parameters);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(1, Error('Cannot access the Window interface.'), parameters);
  });

  it('should console.error id Application Loaded Event fails at retrieving the document element', () => {
    trackApplicationLoaded();

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(1, new ReferenceError('document is not defined'), {});

    trackApplicationLoaded({ onError: console.error });
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(2, new ReferenceError('document is not defined'));
  });

  it('should console.error id URL Change Event fails at retrieving the document element', () => {
    trackURLChange();

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(1, new ReferenceError('document is not defined'), {});

    trackURLChange({ onError: console.error });
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(2, new ReferenceError('document is not defined'));
  });

  it('should return undefined', () => {
    expect(getLocationHref()).toBeUndefined();
  });

  it('should console error when MutationObserver is not available', async () => {
    jest.spyOn(console, 'error');
    const tracker = new BrowserTracker({ endpoint: 'endpoint', applicationId: 'app' });
    jest.spyOn(tracker, 'trackEvent');

    startAutoTracking();

    expect(tracker.trackEvent).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should console error when mutationCallback receives garbled data', async () => {
    jest.spyOn(console, 'error');
    const tracker = new BrowserTracker({ endpoint: 'endpoint', applicationId: 'app' });
    jest.spyOn(tracker, 'trackEvent');
    const mutationCallback = makeMutationCallback(false);

    // @ts-ignore
    mutationCallback('not a list');

    expect(tracker.trackEvent).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
