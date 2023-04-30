import { incrementCounter, initializeMetrics, instrument, observeGauge, recordHistogram } from '../src';
import packageInfo from '../package.json';
import { setTimeout } from 'timers/promises';

const SERVICE_NAME = '@boxyhq/metrics';
initializeMetrics({ name: SERVICE_NAME, version: packageInfo.version });

const METER = 'meter';

async function testInstruments() {
  incrementCounter({
    meter: METER,
    name: 'test.counter',
    counterOptions: { description: 'Test counter' },
  });

  observeGauge({
    meter: METER,
    name: 'test.gauge',
    gaugeOptions: { description: 'Test gauge', unit: 'm/s' },
    val: 100,
  });

  recordHistogram({
    meter: METER,
    name: 'test.histogram',
    histogramOptions: { description: 'Test histogram' },
    val: 200,
  });

  await instrument({
    meter: METER,
    name: 'test.instrument',
    delegate: () => Promise.resolve(),
  });

  /** Essential to set a timeout below that is more than the export interval of 60 seconds*/
  await setTimeout(70000);
}

testInstruments();
