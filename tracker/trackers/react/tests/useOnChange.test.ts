import { renderHook } from '@testing-library/react-hooks';
import { useOnChange } from '../src';

describe('useOnChange', () => {
  const initialState = { property: 1, attribute: 'a' };
  const mockEffectCallback = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not execute on mount', () => {
    renderHook((state) => useOnChange(state, mockEffectCallback), { initialProps: initialState });
    expect(mockEffectCallback).not.toHaveBeenCalled();
  });

  it('should not execute on re-render if the state did not change', () => {
    const hook = renderHook((state) => useOnChange(state, mockEffectCallback), { initialProps: initialState });
    hook.rerender(initialState);
    hook.rerender(initialState);
    hook.rerender(initialState);
    expect(mockEffectCallback).not.toHaveBeenCalled();
  });

  it('should not execute on re-render if the state is identical', () => {
    const newState = { ...initialState };
    const hook = renderHook((state) => useOnChange(state, mockEffectCallback), { initialProps: initialState });
    hook.rerender(newState);
    hook.rerender(newState);
    hook.rerender(newState);
    expect(mockEffectCallback).not.toHaveBeenCalled();
  });

  it('should execute on re-render each time state changes', () => {
    const newState1 = { property: 2, attribute: 'b' };
    const newState2 = { property: 3, attribute: 'c' };
    const hook = renderHook((state) => useOnChange(state, mockEffectCallback), { initialProps: initialState });
    hook.rerender(newState1);
    hook.rerender(newState1);
    hook.rerender(newState1);
    expect(mockEffectCallback).toHaveBeenCalledTimes(1);
    hook.rerender(newState2);
    hook.rerender(newState2);
    hook.rerender(newState2);
    expect(mockEffectCallback).toHaveBeenCalledTimes(2);
  });

  it('should execute the latest version of of the effect callback', () => {
    const newState = { property: 2, attribute: 'b' };
    const mockEffectCallback2 = jest.fn();
    const mockEffectCallback3 = jest.fn();
    const mockEffectCallback4 = jest.fn();
    const hook = renderHook(({ state, effect }) => useOnChange(state, effect), {
      initialProps: { state: initialState, effect: mockEffectCallback },
    });

    hook.rerender({ state: initialState, effect: mockEffectCallback2 });
    hook.rerender({ state: initialState, effect: mockEffectCallback3 });
    hook.rerender({ state: newState, effect: mockEffectCallback4 });

    expect(mockEffectCallback).not.toHaveBeenCalled();
    expect(mockEffectCallback2).not.toHaveBeenCalled();
    expect(mockEffectCallback3).not.toHaveBeenCalled();
    expect(mockEffectCallback4).toHaveBeenCalledTimes(1);
  });
});
