/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it, jest} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

jest.mock('../src/app', () => ({
  AppProviders: () => null,
  useAppStore: () => ({
    initAuth: jest.fn(),
    isInitialized: true,
    isLoading: false,
  }),
}));

it('renders correctly', async () => {
  await act(async () => {
    renderer.create(<App />);
  });
});
