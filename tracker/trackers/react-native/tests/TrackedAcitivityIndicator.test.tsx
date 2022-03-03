/*
 * Copyright 2022 Objectiv B.V.
 */

import { mockConsole, SpyTransport } from '@objectiv/testing-tools';
import { render } from '@testing-library/react-native';
import React from 'react';
import {
  LocationTree,
  ReactTracker,
  RootLocationContextWrapper,
  TrackedActivityIndicator,
  TrackedActivityIndicatorProps,
  TrackingContextProvider,
} from '../src';

describe('TrackedActivityIndicator', () => {
  const spyTransport = new SpyTransport();
  jest.spyOn(spyTransport, 'handle');
  const tracker = new ReactTracker({ applicationId: 'app-id', transport: spyTransport, console: mockConsole });

  const TestTrackedActivityIndicator = (props: TrackedActivityIndicatorProps & { testID?: string }) => (
    <TrackingContextProvider tracker={tracker}>
      <RootLocationContextWrapper id={'test'}>
        <TrackedActivityIndicator {...props} />
      </RootLocationContextWrapper>
    </TrackingContextProvider>
  );

  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  it('should not track VisibleEvent or HiddenEvent when visible is undefined', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} />);
    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} />);
    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));
  });

  it('should not track VisibleEvent when visible toggles from undefined to true', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));
  });

  it('should not track HiddenEvent when visible toggles from true to undefined', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={undefined} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));
  });

  it('should not track VisibleEvent when visible did not change', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);
    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);
    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));
  });

  it('should not track HiddenEvent when visible did not change', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={false} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={false} />);
    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={false} />);
    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={false} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));
  });

  it('should track VisibleEvent when visible toggles from false to true', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={false} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(1, expect.objectContaining({ _type: 'VisibleEvent' }));
  });

  it('should track HiddenEvent when visible toggles from true to false', () => {
    const { rerender } = render(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={true} />);

    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'VisibleEvent' }));
    expect(spyTransport.handle).not.toHaveBeenCalledWith(expect.objectContaining({ _type: 'HiddenEvent' }));

    rerender(<TestTrackedActivityIndicator id={'test-activity-indicator'} animating={false} />);

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(1, expect.objectContaining({ _type: 'HiddenEvent' }));
  });
});
