/*
 * Copyright 2021-2022 Objectiv B.V.
 */

/**
 * Helper function to check if window exists. Used to detect non-browser environments or SSR.
 */
export const windowExists = () => typeof window !== 'undefined';
