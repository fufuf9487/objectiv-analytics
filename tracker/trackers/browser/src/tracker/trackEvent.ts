import { LocationStack, TrackerEvent, UntrackedEvent } from '@objectiv/tracker-core';
import ExtendableError from 'es6-error';
import { getTracker } from '../global/getTracker';
import { BrowserTracker } from '../tracker/BrowserTracker';
import { getElementLocationStack } from '../tracker/getElementLocationStack';
import { trackerErrorHandler, TrackOnErrorCallback } from '../trackerErrorHandler';
import { TaggableElement } from '../typeGuards';

/**
 * The parameters of `trackEvent`
 */
export type TrackEventParameters = {
  event: UntrackedEvent;
  element?: TaggableElement | EventTarget;
  tracker?: BrowserTracker;
  trackerId?: string;
  onError?: TrackOnErrorCallback;
};

/**
 * A custom error thrown by trackEvent calls.
 */
export class TrackEventError extends ExtendableError {}

/**
 * 1. Reconstruct a LocationStack for the given Element by traversing its DOM parents
 * 2. Factors a new Event with the given `_type`
 * 3. Tracks the new Event via WebTracker
 */
export const trackEvent = (parameters: TrackEventParameters) => {
  try {
    const { event, element, tracker = getTracker(parameters.trackerId) } = parameters;

    // If the Location Stack of the given Event is empty and we have an Element, attempt to generate one from the DOM
    let locationStack: LocationStack = event.location_stack;
    if (locationStack.length === 0 && element) {
      locationStack = getElementLocationStack({ element });
    }

    // Clone the given Event onto a new one with an updated Location Stack that may have been generated
    const newEvent = new TrackerEvent({ ...event, location_stack: locationStack });

    // Track
    tracker.trackEvent(newEvent);
  } catch (error) {
    trackerErrorHandler(error, parameters, parameters.onError);
  }
};
