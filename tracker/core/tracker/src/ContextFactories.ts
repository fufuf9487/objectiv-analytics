import {
  ActionContext,
  ButtonContext,
  ExpandableSectionContext,
  InputContext,
  ItemContext,
  LinkContext,
  MediaPlayerContext,
  NavigationContext,
  OverlayContext,
  ScreenContext,
  SectionContext,
  WebDocumentContext,
} from '@objectiv/schema';

/**
 * SectionContext Factory
 */
export const makeSectionContext = (props: { id: string }): SectionContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'SectionContext',
  id: props.id,
});

/**
 * WebDocumentContext Factory
 */
export const makeWebDocumentContext = (props: { id: string; url: string }): WebDocumentContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'WebDocumentContext',
  id: props.id,
  url: props.url,
});

/**
 * ScreenContext Factory
 */
export const makeScreenContext = (props: { id: string; screen: string }): ScreenContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'ScreenContext',
  id: props.id,
  screen: props.screen,
});

/**
 * ExpandableSectionContext Factory
 */
export const makeExpandableSectionContext = (props: { id: string }): ExpandableSectionContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'ExpandableSectionContext',
  id: props.id,
});

/**
 * MediaPlayerContext Factory
 */
export const makeMediaPlayerContext = (props: { id: string }): MediaPlayerContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'MediaPlayerContext',
  id: props.id,
});

/**
 * NavigationContext Factory
 */
export const makeNavigationContext = (props: { id: string }): NavigationContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'NavigationContext',
  id: props.id,
});

/**
 * OverlayContext Factory
 */
export const makeOverlayContext = (props: { id: string }): OverlayContext => ({
  _location_context: true,
  _section_context: true,
  _context_type: 'OverlayContext',
  id: props.id,
});

/**
 * ItemContext Factory
 */
export const makeItemContext = (props: { id: string }): ItemContext => ({
  _location_context: true,
  _item_context: true,
  _context_type: 'ItemContext',
  id: props.id,
});

/**
 * InputContext Factory
 */
export const makeInputContext = (props: { id: string }): InputContext => ({
  _location_context: true,
  _item_context: true,
  _context_type: 'InputContext',
  id: props.id,
});

/**
 * ActionContext Factory
 */
export const makeActionContext = (props: { id: string; path: string; text: string }): ActionContext => ({
  _location_context: true,
  _item_context: true,
  _action_context: true,
  _context_type: 'ActionContext',
  id: props.id,
  path: props.path,
  text: props.text,
});

/**
 * ButtonContext Factory
 */
export const makeButtonContext = (props: { id: string; text: string }): ButtonContext => ({
  _location_context: true,
  _item_context: true,
  _action_context: true,
  _context_type: 'ButtonContext',
  id: props.id,
  path: '', // TODO OSF does not support optional properties; default to empty string. See also AbstractActionContext
  text: props.text,
});

/**
 * LinkContext Factory
 */
export const makeLinkContext = (props: { id: string; href: string; text: string }): LinkContext => ({
  _location_context: true,
  _item_context: true,
  _action_context: true,
  _context_type: 'LinkContext',
  id: props.id,
  path: props.href,
  text: props.text,
});
