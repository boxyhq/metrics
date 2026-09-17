import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { metrics } from '@opentelemetry/api';
import type { Attributes, MeterProvider, ObservableResult } from '@opentelemetry/api';
import { observeGauge } from '../src/instruments/gauge';

type Observation = { val: number; gaugeAttributes?: Attributes };
type Callback = (result: ObservableResult<Attributes>) => void;

/** Stands in for an ObservableGauge, deduplicating callbacks by reference as ObservableRegistry does. */
class RecordingGauge {
  readonly callbacks: Callback[] = [];

  addCallback(callback: Callback) {
    if (!this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
    }
  }

  removeCallback(callback: Callback) {
    const idx = this.callbacks.indexOf(callback);
    if (idx >= 0) {
      this.callbacks.splice(idx, 1);
    }
  }

  collect(): Observation[] {
    const observations: Observation[] = [];
    const result = {
      observe: (val: number, gaugeAttributes?: Attributes) => {
        observations.push({ val, gaugeAttributes });
      },
    } as ObservableResult<Attributes>;
    for (const callback of this.callbacks) {
      callback(result);
    }
    return observations;
  }
}

class RecordingMeter {
  readonly gauges = new Map<string, RecordingGauge>();

  createObservableGauge(name: string) {
    const gauge = new RecordingGauge();
    this.gauges.set(name, gauge);
    return gauge;
  }
}

class RecordingMeterProvider {
  readonly meters = new Map<string, RecordingMeter>();

  getMeter(name: string) {
    let meter = this.meters.get(name);
    if (meter === undefined) {
      meter = new RecordingMeter();
      this.meters.set(name, meter);
    }
    return meter;
  }
}

const METER = 'test.meter';

let provider: RecordingMeterProvider;
let uniqueSuffix = 0;

const nextName = () => `test.gauge.${process.pid}.${++uniqueSuffix}`;

const gaugeFor = (name: string) => {
  const gauge = provider.meters.get(METER)?.gauges.get(name);
  assert.ok(gauge, `no gauge was created for ${name}`);
  return gauge;
};

describe('observeGauge', () => {
  beforeEach(() => {
    metrics.disable();
    provider = new RecordingMeterProvider();
    metrics.setGlobalMeterProvider(provider as unknown as MeterProvider);
  });

  it('registers a single callback however many times it is called', () => {
    const name = nextName();

    for (let i = 0; i < 100; i++) {
      observeGauge({ meter: METER, name, val: i });
    }

    assert.equal(gaugeFor(name).callbacks.length, 1);
  });

  it('observes the most recent value', () => {
    const name = nextName();

    observeGauge({ meter: METER, name, val: 1 });
    observeGauge({ meter: METER, name, val: 7 });

    assert.deepEqual(gaugeFor(name).collect(), [{ val: 7, gaugeAttributes: undefined }]);
  });

  it('observes the most recent value of every attribute set', () => {
    const name = nextName();

    observeGauge({ meter: METER, name, val: 1, gaugeAttributes: { db_name: 'a' } });
    observeGauge({ meter: METER, name, val: 2, gaugeAttributes: { db_name: 'b' } });
    observeGauge({ meter: METER, name, val: 3, gaugeAttributes: { db_name: 'a' } });

    assert.equal(gaugeFor(name).callbacks.length, 1);
    assert.deepEqual(gaugeFor(name).collect(), [
      { val: 3, gaugeAttributes: { db_name: 'a' } },
      { val: 2, gaugeAttributes: { db_name: 'b' } },
    ]);
  });

  it('treats attribute sets as unordered', () => {
    const name = nextName();

    observeGauge({ meter: METER, name, val: 1, gaugeAttributes: { a: '1', b: '2' } });
    observeGauge({ meter: METER, name, val: 2, gaugeAttributes: { b: '2', a: '1' } });

    assert.deepEqual(gaugeFor(name).collect(), [{ val: 2, gaugeAttributes: { b: '2', a: '1' } }]);
  });

  it('keeps one instrument per metric name', () => {
    const first = nextName();
    const second = nextName();

    observeGauge({ meter: METER, name: first, val: 1 });
    observeGauge({ meter: METER, name: second, val: 2 });

    assert.deepEqual(gaugeFor(first).collect(), [{ val: 1, gaugeAttributes: undefined }]);
    assert.deepEqual(gaugeFor(second).collect(), [{ val: 2, gaugeAttributes: undefined }]);
  });
});
