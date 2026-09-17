import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_TELEMETRY_SDK_LANGUAGE,
} from '@opentelemetry/semantic-conventions';
import { buildResource } from '../src/init';

const ATTR_SERVICE_INSTANCE_ID = 'service.instance.id';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const SERVICE_INFO = { name: 'polis', version: '26.2.0' };

const withEnv = (env: Record<string, string | undefined>, run: () => void) => {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const cleanEnv = {
  OTEL_RESOURCE_ATTRIBUTES: undefined,
  OTEL_SERVICE_NAME: undefined,
};

describe('buildResource', () => {
  afterEach(() => {
    delete process.env.OTEL_RESOURCE_ATTRIBUTES;
    delete process.env.OTEL_SERVICE_NAME;
  });

  it('carries the service name and version it is given', () => {
    withEnv(cleanEnv, () => {
      const { attributes } = buildResource(SERVICE_INFO);

      assert.equal(attributes[ATTR_SERVICE_NAME], 'polis');
      assert.equal(attributes[ATTR_SERVICE_VERSION], '26.2.0');
    });
  });

  it('carries the default SDK attributes', () => {
    withEnv(cleanEnv, () => {
      const { attributes } = buildResource(SERVICE_INFO);

      assert.equal(attributes[ATTR_TELEMETRY_SDK_LANGUAGE], 'nodejs');
    });
  });

  it('generates a service instance id when the environment supplies none', () => {
    withEnv(cleanEnv, () => {
      const { attributes } = buildResource(SERVICE_INFO);

      assert.match(String(attributes[ATTR_SERVICE_INSTANCE_ID]), UUID);
    });
  });

  it('gives each process a different generated service instance id', () => {
    withEnv(cleanEnv, () => {
      const first = buildResource(SERVICE_INFO).attributes[ATTR_SERVICE_INSTANCE_ID];
      const second = buildResource(SERVICE_INFO).attributes[ATTR_SERVICE_INSTANCE_ID];

      assert.notEqual(first, second);
    });
  });

  it('takes the service instance id from OTEL_RESOURCE_ATTRIBUTES', () => {
    withEnv({ ...cleanEnv, OTEL_RESOURCE_ATTRIBUTES: 'service.instance.id=polis-7d9f-kx2mn' }, () => {
      const { attributes } = buildResource(SERVICE_INFO);

      assert.equal(attributes[ATTR_SERVICE_INSTANCE_ID], 'polis-7d9f-kx2mn');
    });
  });

  it('keeps every attribute in OTEL_RESOURCE_ATTRIBUTES', () => {
    withEnv(
      {
        ...cleanEnv,
        OTEL_RESOURCE_ATTRIBUTES: 'service.instance.id=polis-7d9f-kx2mn,deployment.environment=prod-eu',
      },
      () => {
        const { attributes } = buildResource(SERVICE_INFO);

        assert.equal(attributes[ATTR_SERVICE_INSTANCE_ID], 'polis-7d9f-kx2mn');
        assert.equal(attributes['deployment.environment'], 'prod-eu');
      }
    );
  });

  it('lets OTEL_SERVICE_NAME override the service name', () => {
    withEnv({ ...cleanEnv, OTEL_SERVICE_NAME: 'polis-eu' }, () => {
      const { attributes } = buildResource(SERVICE_INFO);

      assert.equal(attributes[ATTR_SERVICE_NAME], 'polis-eu');
    });
  });
});
