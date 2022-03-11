/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { makeInputContext } from '../common/factories/makeInputContext';
import { LocationContextWrapper } from './LocationContextWrapper';
import { ContentContextWrapperProps } from './ContentContextWrapper';
import React from 'react';

/**
 * The props of InputContextWrapper. No extra attributes, same as ContentContextWrapper.
 */
export type InputContextWrapperProps = ContentContextWrapperProps;

/**
 * Wraps its children in a InputContext.
 */
export const InputContextWrapper = ({ children, id }: InputContextWrapperProps) => (
  <LocationContextWrapper locationContext={makeInputContext({ id })}>
    {(trackingContext) => (typeof children === 'function' ? children(trackingContext) : children)}
  </LocationContextWrapper>
);
