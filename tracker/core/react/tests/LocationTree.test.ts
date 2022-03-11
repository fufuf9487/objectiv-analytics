/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { Tracker } from '@objectiv/tracker-core';
import {
  locationNodes,
  LocationTree,
  makeContentContext,
  makeLinkContext,
  makeNavigationContext,
  makePressableContext,
  makeRootLocationContext,
  rootNode,
} from '../src';

describe('LocationTree', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    LocationTree.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  it('should not log anything (empty LocationTree)', () => {
    LocationTree.log();

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should add nodes', () => {
    const root = makeRootLocationContext({ id: 'root' });
    const nav = makeNavigationContext({ id: 'nav' });
    const button = makePressableContext({ id: 'button' });
    const footer = makeNavigationContext({ id: 'footer' });

    expect(locationNodes).toHaveLength(1);

    LocationTree.add(root, null);
    LocationTree.add(nav, root);
    LocationTree.add(button, nav);
    LocationTree.add(footer, root);

    expect(locationNodes).toHaveLength(5);
    expect(locationNodes).toStrictEqual([
      expect.objectContaining({
        _type: 'LocationTreeRoot',
        id: 'location-tree-root',
      }),
      expect.objectContaining({
        __location_id: root.__location_id,
        _type: 'RootLocationContext',
        id: 'root',
        parentLocationId: rootNode.__location_id,
      }),
      expect.objectContaining({
        _type: 'NavigationContext',
        id: 'nav',
        parentLocationId: root.__location_id,
      }),
      expect.objectContaining({
        _type: 'PressableContext',
        id: 'button',
        parentLocationId: nav.__location_id,
      }),
      expect.objectContaining({
        _type: 'NavigationContext',
        id: 'footer',
        parentLocationId: root.__location_id,
      }),
    ]);
  });

  it('should remove nodes', () => {
    const root = makeRootLocationContext({ id: 'root' });
    const nav = makeNavigationContext({ id: 'nav' });
    const button = makePressableContext({ id: 'button' });
    const footer = makeNavigationContext({ id: 'footer' });

    expect(locationNodes).toHaveLength(1);

    LocationTree.add(root, null);
    LocationTree.add(nav, root);
    LocationTree.add(button, nav);
    LocationTree.add(footer, root);

    expect(locationNodes).toHaveLength(5);

    LocationTree.remove(button);

    expect(locationNodes).toHaveLength(4);
    expect(locationNodes).toStrictEqual([
      expect.objectContaining({
        _type: 'LocationTreeRoot',
        id: 'location-tree-root',
      }),
      expect.objectContaining({
        __location_id: root.__location_id,
        _type: 'RootLocationContext',
        id: 'root',
        parentLocationId: rootNode.__location_id,
      }),
      expect.objectContaining({
        _type: 'NavigationContext',
        id: 'nav',
        parentLocationId: root.__location_id,
      }),
      expect.objectContaining({
        _type: 'NavigationContext',
        id: 'footer',
        parentLocationId: root.__location_id,
      }),
    ]);
  });

  it('should remove branches', () => {
    const root = makeRootLocationContext({ id: 'root' });
    const nav = makeNavigationContext({ id: 'nav' });
    const button = makePressableContext({ id: 'button' });
    const footer = makeNavigationContext({ id: 'footer' });

    expect(locationNodes).toHaveLength(1);

    LocationTree.add(root, null);
    LocationTree.add(nav, root);
    LocationTree.add(button, nav);
    LocationTree.add(footer, root);

    expect(locationNodes).toHaveLength(5);

    LocationTree.remove(nav);

    expect(locationNodes).toHaveLength(3);
    expect(locationNodes).toStrictEqual([
      expect.objectContaining({
        _type: 'LocationTreeRoot',
        id: 'location-tree-root',
      }),
      expect.objectContaining({
        __location_id: root.__location_id,
        _type: 'RootLocationContext',
        id: 'root',
        parentLocationId: rootNode.__location_id,
      }),
      expect.objectContaining({
        _type: 'NavigationContext',
        id: 'footer',
        parentLocationId: root.__location_id,
      }),
    ]);
  });

  it('should remove orphan nodes and branches', () => {
    const root = makeRootLocationContext({ id: 'root' });
    const nav = makeNavigationContext({ id: 'nav' });
    const button = makePressableContext({ id: 'button' });
    const main = makeContentContext({ id: 'main' });
    const hero = makeContentContext({ id: 'hero' });
    const link1 = makeLinkContext({ id: 'link', href: '/link1' });
    const link2 = makeLinkContext({ id: 'link', href: '/link2' });
    const footer = makeNavigationContext({ id: 'footer' });

    expect(locationNodes).toHaveLength(1);

    LocationTree.add(root, null);
    LocationTree.add(nav, root);
    LocationTree.add(button, nav);
    LocationTree.add(main, root);
    LocationTree.add(hero, main);
    LocationTree.add(link1, hero);
    LocationTree.add(footer, root);
    LocationTree.add(link2, footer);

    expect(locationNodes).toHaveLength(9);

    LocationTree.remove(footer);
    LocationTree.remove(main);

    expect(locationNodes).toHaveLength(4);
    expect(locationNodes).toStrictEqual([
      expect.objectContaining({
        _type: 'LocationTreeRoot',
        id: 'location-tree-root',
      }),
      expect.objectContaining({
        __location_id: root.__location_id,
        _type: 'RootLocationContext',
        id: 'root',
        parentLocationId: rootNode.__location_id,
      }),
      expect.objectContaining({
        _type: 'NavigationContext',
        id: 'nav',
        parentLocationId: root.__location_id,
      }),
      expect.objectContaining({
        _type: 'PressableContext',
        id: 'button',
        parentLocationId: nav.__location_id,
      }),
    ]);
  });

  it('should console.error collisions', () => {
    const rootSection = makeContentContext({ id: 'root' });
    const section1 = makeContentContext({ id: '1' });
    const section2 = makeContentContext({ id: 'oops' });
    const section3 = makeContentContext({ id: 'oops' });
    const section4 = makeContentContext({ id: 'oops' });

    LocationTree.add(rootSection, null);
    LocationTree.add(section1, rootSection);
    LocationTree.add(section2, rootSection);
    LocationTree.add(section3, rootSection);
    LocationTree.add(section4, rootSection);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      '｢objectiv｣ Location collision detected: Content:root / Content:oops'
    );
    expect(console.error).toHaveBeenNthCalledWith(
      2,
      '｢objectiv｣ Location collision detected: Content:root / Content:oops'
    );
  });

  it('should not console.error collisions in children of already colliding nodes', () => {
    const rootSection = makeContentContext({ id: 'root' });
    const section1 = makeContentContext({ id: '1' });
    const section2 = makeContentContext({ id: 'oops' });
    const section3 = makeContentContext({ id: 'oops' });
    const section4 = makeContentContext({ id: '1' });
    const section5 = makeContentContext({ id: 'oops' });
    const section6 = makeContentContext({ id: 'oops' });

    LocationTree.add(rootSection, null);
    LocationTree.add(section1, rootSection);
    LocationTree.add(section2, rootSection);
    LocationTree.add(section3, rootSection);
    LocationTree.add(section4, rootSection);
    LocationTree.add(section5, section4);
    LocationTree.add(section6, section4);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      '｢objectiv｣ Location collision detected: Content:root / Content:oops'
    );
    expect(console.error).toHaveBeenNthCalledWith(
      2,
      '｢objectiv｣ Location collision detected: Content:root / Content:1'
    );
  });

  it('should log the Location tree', () => {
    const rootSection = makeContentContext({ id: 'root' });
    const section1 = makeContentContext({ id: '1' });
    const section2 = makeContentContext({ id: '2' });
    const section2a = makeContentContext({ id: '2a' });
    const section2b = makeContentContext({ id: '2b' });
    const section3 = makeContentContext({ id: '3' });
    const section3a = makeContentContext({ id: '3a' });
    const footer = makeContentContext({ id: 'footer' });
    const section4 = makeContentContext({ id: '4' });

    LocationTree.add(rootSection, null);
    LocationTree.add(section1, rootSection);
    LocationTree.add(section2, rootSection);
    LocationTree.add(section2a, section2);
    LocationTree.add(section2b, section2);
    LocationTree.add(section3, rootSection);
    LocationTree.add(section3a, section3);
    LocationTree.add(footer, rootSection);
    LocationTree.add(section4, footer);

    jest.spyOn(console, 'log').mockImplementation(() => {});

    LocationTree.log();

    expect(console.log).toHaveBeenCalledTimes(9);
    expect(console.log).toHaveBeenNthCalledWith(1, 'ContentContext:root');
    expect(console.log).toHaveBeenNthCalledWith(2, '  ContentContext:1');
    expect(console.log).toHaveBeenNthCalledWith(3, '  ContentContext:2');
    expect(console.log).toHaveBeenNthCalledWith(4, '    ContentContext:2a');
    expect(console.log).toHaveBeenNthCalledWith(5, '    ContentContext:2b');
    expect(console.log).toHaveBeenNthCalledWith(6, '  ContentContext:3');
    expect(console.log).toHaveBeenNthCalledWith(7, '    ContentContext:3a');
    expect(console.log).toHaveBeenNthCalledWith(8, '  ContentContext:footer');
    expect(console.log).toHaveBeenNthCalledWith(9, '    ContentContext:4');
  });

  it('should initialize the LocationTree with the Location Contexts originating from Plugins', () => {
    const tracker = new Tracker({
      applicationId: 'app-id',
      plugins: [
        {
          pluginName: 'TestPlugin',
          enrich: ({ location_stack }) => {
            location_stack.push({
              __location_context: true,
              _type: 'LocationContext',
              id: 'test',
            });
          },
          isUsable() {
            return true;
          },
        },
      ],
    });

    jest.spyOn(LocationTree, 'add');

    LocationTree.initialize(tracker);

    expect(LocationTree.add).toHaveBeenCalledTimes(1);
    expect(LocationTree.add).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'LocationContext',
        id: 'test',
      }),
      null
    );
  });
});
