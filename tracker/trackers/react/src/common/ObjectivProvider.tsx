/*
 * Copyright 2021 Objectiv B.V.
 */

import { useContext } from 'react';
import { trackApplicationLoadedEvent } from '../eventTrackers/trackApplicationLoadedEvent';
import { trackURLChangeEvent } from '../eventTrackers/trackURLChangeEvent';
import { LocationEntry, TrackerProviderProps } from '../types';
import { LocationProviderContext, LocationProvider } from './LocationProvider';
import { TrackerProvider } from './TrackerProvider';

/**
 * ObjectivProvider wraps its children with TrackerProvider and LocationProvider. It's meant to be used as
 * high as possible in the Component tree. Children gain access to both the Tracker and their LocationStack.
 *
 * TrackerProvider can track ApplicationLoadedEvent and URLChangeEvent automatically.
 */
export const ObjectivProvider = ({ children, tracker }: TrackerProviderProps) => {
  const locationProviderContext = useContext(LocationProviderContext);
  const locationEntries: LocationEntry[] = locationProviderContext?.locationEntries ?? [];

  // TODO make configurable
  trackApplicationLoadedEvent({ tracker });
  trackURLChangeEvent({ tracker });

  return (
    <TrackerProvider tracker={tracker}>
      <LocationProvider locationEntries={locationEntries}>
        {(locationProviderContextState) =>
          typeof children === 'function' ? children({ tracker, ...locationProviderContextState }) : children
        }
      </LocationProvider>
    </TrackerProvider>
  );
};
