/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { trackInputChangeEvent } from '../../eventTrackers/trackInputChangeEvent';
import { EventTrackerHookParameters } from '../../types';
import { useLocationStack } from '../consumers/useLocationStack';
import { useTracker } from '../consumers/useTracker';

/**
 * The parameters of useInputChangeEventTracker. No extra attributes, same as EventTrackerHookParameters.
 */
export type InputChangeEventTrackerHookParameters = EventTrackerHookParameters;

/**
 * Returns an InputChangeEvent Tracker callback function, ready to be triggered.
 */
export const useInputChangeEventTracker = (parameters: InputChangeEventTrackerHookParameters = {}) => {
  const { tracker = useTracker(), locationStack = useLocationStack(), globalContexts } = parameters;

  return () => trackInputChangeEvent({ tracker, locationStack, globalContexts });
};
