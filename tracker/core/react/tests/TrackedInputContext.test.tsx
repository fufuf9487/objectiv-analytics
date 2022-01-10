/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { SpyTransport } from '@objectiv/testing-tools';
import { Tracker } from '@objectiv/tracker-core';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { createRef } from 'react';
import { LocationTree, ObjectivProvider } from '../src';
import { TrackedInputContext } from '../src/trackedContexts/TrackedInputContext';

describe('TrackedInputContext', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should wrap the given Component in an InputContext and not trigger InputChangeEvent on mount', () => {
    const spyTransport = new SpyTransport();
    jest.spyOn(spyTransport, 'handle');
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });

    render(
      <ObjectivProvider tracker={tracker}>
        <TrackedInputContext Component={'input'} type={'text'} id={'input-id'} data-testid={'test-input'} />
      </ObjectivProvider>
    );

    fireEvent.blur(screen.getByTestId('test-input'));

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _type: 'ApplicationLoadedEvent',
      })
    );
  });

  it('should not track an InputChangeEvent when value did not change from the previous InputChangeEvent', () => {
    const spyTransport = new SpyTransport();
    jest.spyOn(spyTransport, 'handle');
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });

    render(
      <ObjectivProvider tracker={tracker}>
        <TrackedInputContext
          Component={'input'}
          type={'text'}
          id={'input-id'}
          defaultValue={'some text'}
          data-testid={'test-input'}
        />
      </ObjectivProvider>
    );

    fireEvent.blur(screen.getByTestId('test-input'), { target: { value: 'some text' } });
    fireEvent.blur(screen.getByTestId('test-input'), { target: { value: 'some text' } });
    fireEvent.blur(screen.getByTestId('test-input'), { target: { value: 'some text' } });

    expect(spyTransport.handle).not.toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'InputChangeEvent',
      })
    );
  });

  it('should track an InputChangeEvent when value changed from the previous InputChangeEvent', () => {
    const spyTransport = new SpyTransport();
    jest.spyOn(spyTransport, 'handle');
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });

    render(
      <ObjectivProvider tracker={tracker}>
        <TrackedInputContext
          Component={'input'}
          type={'text'}
          id={'input-id'}
          defaultValue={'some text'}
          data-testid={'test-input'}
        />
      </ObjectivProvider>
    );

    fireEvent.blur(screen.getByTestId('test-input'), { target: { value: 'some new text' } });

    expect(spyTransport.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'InputChangeEvent',
        location_stack: [
          expect.objectContaining({
            _type: 'InputContext',
            id: 'input-id',
          }),
        ],
      })
    );
  });

  it('should allow forwarding the id property', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });

    render(
      <ObjectivProvider tracker={tracker}>
        <TrackedInputContext
          Component={'div'}
          type={'text'}
          defaultValue={'test 1'}
          id={'input-id-1'}
          data-testid={'test-input-1'}
        />
        <TrackedInputContext
          Component={'div'}
          type={'text'}
          defaultValue={'test 2'}
          id={'input-id-2'}
          forwardId={true}
          data-testid={'test-input-2'}
        />
      </ObjectivProvider>
    );

    expect(screen.getByTestId('test-input-1').id).toBe('');
    expect(screen.getByTestId('test-input-2').id).toBe('input-id-2');
  });

  it('should allow forwarding refs', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    const ref = createRef<HTMLInputElement>();

    render(
      <ObjectivProvider tracker={tracker}>
        <TrackedInputContext Component={'input'} type={'text'} defaultValue={'test 1'} id={'expandable-id'} ref={ref} />
      </ObjectivProvider>
    );

    expect(ref.current).toMatchInlineSnapshot(`
      <input
        type="text"
        value="test 1"
      />
    `);
  });

  it('should execute the given onBlur as well', () => {
    const blurSpy = jest.fn();
    const tracker = new Tracker({ applicationId: 'app-id' });

    render(
      <ObjectivProvider tracker={tracker}>
        <TrackedInputContext
          Component={'input'}
          type={'text'}
          defaultValue={''}
          id={'expandable-id'}
          onBlur={blurSpy}
          data-testid={'test-input'}
        />
      </ObjectivProvider>
    );

    fireEvent.blur(screen.getByTestId('test-input'), { target: { value: 'some text' } });

    expect(blurSpy).toHaveBeenCalledTimes(1);
  });
});
