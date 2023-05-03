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

  console.log(`Operation for counter metric ... DONE`);

  observeGauge({
    meter: METER,
    name: 'test.gauge',
    gaugeOptions: { description: 'Test gauge', unit: 'm/s' },
    val: 100,
  });

  console.log(`Operation for gauge metric ... DONE`);

  recordHistogram({
    meter: METER,
    name: 'test.histogram',
    histogramOptions: { description: 'Test histogram' },
    val: 200,
  });

  console.log(`Operation for histogram metric ... DONE`);

  await instrument({
    meter: METER,
    name: 'test.instrument',
    delegate: () => Promise.resolve(),
  });

  console.log(`Operation for function instrumentation ... DONE`);
  console.log(`Waiting for export to happen ....`);
  /** Essential to set a timeout below that is more than the export interval of 60 seconds*/
  await setTimeout(70000);
  console.log(`Export operation ... COMPLETE, please check the configured OTEL service for recorded values`);
}

testInstruments();
