/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { BrowserTracker } from './BrowserTracker';
import { BrowserTrackerConfig } from './definitions/BrowserTrackerConfig';
import { getTrackerRepository } from './getTrackerRepository';
import { startAutoTracking } from './startAutoTracking';

/**
 * Allows to easily create and configure a new BrowserTracker instance and also starts auto tracking
 */
export const makeTracker = (trackerConfig: BrowserTrackerConfig): BrowserTracker => {
  const newTracker = new BrowserTracker(trackerConfig);
  const trackerRepository = getTrackerRepository();

  trackerRepository.add(newTracker);
  startAutoTracking(trackerConfig);

  return newTracker;
};
