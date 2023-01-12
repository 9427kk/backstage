/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import {
  useEntity,
  useAsyncEntity,
  EntityProvider,
  AsyncEntityProvider,
} from './useEntity';
import { Entity } from '@backstage/catalog-model';
import { analyticsApiRef, useAnalytics } from '@backstage/core-plugin-api';
import { MockAnalyticsApi, TestApiRegistry } from '@backstage/test-utils';
import { ApiProvider } from '@backstage/core-app-api';

const entity = { metadata: { name: 'my-entity' }, kind: 'MyKind' } as Entity;

describe('useEntity', () => {
  it('should throw if no entity is provided', async () => {
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => <EntityProvider children={children} />;
    const { result } = renderHook(() => useEntity(), {
      wrapper,
    });

    expect(result.error?.message).toMatch(/entity has not been loaded/);
  });

  it('should provide an entity', async () => {
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => <EntityProvider entity={entity} children={children} />;
    const { result } = renderHook(() => useEntity(), {
      wrapper,
    });

    expect(result.current.entity).toBe(entity);
  });

  it('should provide entityRef analytics context', () => {
    const analyticsSpy = new MockAnalyticsApi();
    const apis = TestApiRegistry.from([analyticsApiRef, analyticsSpy]);
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => (
      <ApiProvider apis={apis}>
        <EntityProvider entity={entity} children={children} />
      </ApiProvider>
    );
    const { result } = renderHook(() => useAnalytics(), {
      wrapper,
    });

    result.current.captureEvent('test', 'value');

    expect(analyticsSpy.getEvents()[0]).toMatchObject({
      context: { entityRef: 'mykind:default/my-entity' },
    });
  });
});

describe('useAsyncEntity', () => {
  it('should provide no entity', async () => {
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => <AsyncEntityProvider loading={false} children={children} />;
    const { result } = renderHook(() => useAsyncEntity(), {
      wrapper,
    });

    expect(result.current.entity).toBe(undefined);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(undefined);
    expect(result.current.refresh).toBe(undefined);
  });

  it('should provide an entity', async () => {
    const refresh = () => {};
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => (
      <AsyncEntityProvider
        loading={false}
        entity={entity}
        refresh={refresh}
        children={children}
      />
    );
    const { result } = renderHook(() => useAsyncEntity(), {
      wrapper,
    });

    expect(result.current.entity).toBe(entity);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(undefined);
    expect(result.current.refresh).toBe(refresh);
  });

  it('should provide an error', async () => {
    const error = new Error('oh no');
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => (
      <AsyncEntityProvider loading={false} error={error} children={children} />
    );
    const { result } = renderHook(() => useAsyncEntity(), {
      wrapper,
    });

    expect(result.current.entity).toBe(undefined);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.refresh).toBe(undefined);
  });

  it('should provide entityRef analytics context', () => {
    const analyticsSpy = new MockAnalyticsApi();
    const apis = TestApiRegistry.from([analyticsApiRef, analyticsSpy]);
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => (
      <ApiProvider apis={apis}>
        <AsyncEntityProvider
          loading={false}
          entity={entity}
          refresh={() => {}}
          children={children}
        />
      </ApiProvider>
    );
    const { result } = renderHook(() => useAnalytics(), {
      wrapper,
    });

    result.current.captureEvent('test', 'value');

    expect(analyticsSpy.getEvents()[0]).toMatchObject({
      context: { entityRef: 'mykind:default/my-entity' },
    });
  });

  it('should omit entityRef analytics context', () => {
    const analyticsSpy = new MockAnalyticsApi();
    const apis = TestApiRegistry.from([analyticsApiRef, analyticsSpy]);
    const wrapper: WrapperComponent<{ children?: React.ReactNode }> = ({
      children,
    }) => (
      <ApiProvider apis={apis}>
        <AsyncEntityProvider loading={false} children={children} />
      </ApiProvider>
    );
    const { result } = renderHook(() => useAnalytics(), {
      wrapper,
    });

    result.current.captureEvent('test', 'value');

    expect(analyticsSpy.getEvents()[0].context).not.toHaveProperty('entityRef');
  });
});
