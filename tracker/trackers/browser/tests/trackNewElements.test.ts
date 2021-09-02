import { makeSectionVisibleEvent } from '@objectiv/tracker-core';
import { BrowserTracker, ChildrenTrackingAttribute, configureTracker, trackButton, trackElement } from '../src';
import trackNewElements from '../src/observer/trackNewElements';

describe('trackNewElements', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    configureTracker({ applicationId: 'test', endpoint: 'test' });
    expect(window.objectiv.tracker).toBeInstanceOf(BrowserTracker);
    spyOn(window.objectiv.tracker, 'trackEvent');
  });

  it('should apply tracking attributes to Elements tracked via Children Tracking and track them right away', async () => {
    const div1 = document.createElement('div');
    div1.setAttribute(
      ChildrenTrackingAttribute.trackChildren,
      JSON.stringify([
        { query: '#button', trackAs: trackButton({ id: 'button', text: 'button' }) },
        { query: '#child-div', trackAs: trackElement({ id: 'child-div' }) },
      ])
    );

    const button = document.createElement('button');
    button.setAttribute('id', 'button');

    const childDiv = document.createElement('div');
    childDiv.setAttribute('id', 'child-div');

    spyOn(div1, 'addEventListener');
    spyOn(button, 'addEventListener');
    spyOn(childDiv, 'addEventListener');

    div1.appendChild(button);
    div1.appendChild(childDiv);

    trackNewElements(div1);

    expect(div1.addEventListener).not.toHaveBeenCalled();
    expect(childDiv.addEventListener).not.toHaveBeenCalled();
    expect(button.addEventListener).toHaveBeenCalledTimes(1);
    expect(window.objectiv.tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(window.objectiv.tracker.trackEvent).toHaveBeenNthCalledWith(
      1,
      makeSectionVisibleEvent({
        location_stack: [
          expect.objectContaining({
            _context_type: 'SectionContext',
            id: 'child-div',
          }),
        ],
      })
    );
  });
});
