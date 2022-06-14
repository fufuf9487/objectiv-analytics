/*
 * Copyright 2022 Objectiv B.V.
 */

import { LocationStack } from './Context';
import { GlobalContextValidationRuleFactory, LocationContextValidationRuleFactory } from './ContextValidationRules';
import { LocationTreeInterface } from './LocationTreeInterface';
import { TrackerConsoleInterface } from './TrackerConsoleInterface';
import { TrackerPluginInterface } from './TrackerPluginInterface';

/**
 * DeveloperTools interface definition.
 */
export interface TrackerDeveloperToolsInterface {
  getLocationPath: (locationStack: LocationStack) => string;
  LocationTree: LocationTreeInterface;
  makeGlobalContextValidationRule: GlobalContextValidationRuleFactory;
  makeLocationContextValidationRule: LocationContextValidationRuleFactory;
  OpenTaxonomyValidationPlugin: TrackerPluginInterface;
  TrackerConsole: TrackerConsoleInterface;
}
