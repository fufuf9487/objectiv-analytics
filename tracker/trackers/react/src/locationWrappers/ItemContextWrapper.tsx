/*
 * Copyright 2021 Objectiv B.V.
 */

import { makeItemContext } from '@objectiv/tracker-core';
import { ItemContextWrapperProps } from '../types';
import { LocationContextWrapper } from './LocationContextWrapper';

export const ItemContextWrapper = ({ children, id }: ItemContextWrapperProps) => (
  <LocationContextWrapper locationContext={makeItemContext({ id })}>{children}</LocationContextWrapper>
);
