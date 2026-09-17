import type { Attributes, MetricOptions } from '@opentelemetry/api';
import { acquireMeter } from '../lib/meter';

type Observation = {
  val: number;
  gaugeAttributes?: Attributes;
};

const meters = new Map<string, Map<string, Map<string, Observation>>>();

type GaugeOperationParams = {
  /** OTel meter name */
  meter: string;
  /** Metric name being instrumented */
  name: string;
  /** Non-additive value observed at a point in time */
  val: number;
  /** MetricOptions such as unit */
  gaugeOptions?: MetricOptions;
  /** Metric Attributes in the form of key value pairs */
  gaugeAttributes?: Attributes;
};

/** Identifies an attribute set independently of the order its keys were written in. */
const observationKey = (gaugeAttributes?: Attributes): string =>
  gaugeAttributes === undefined
    ? ''
    : JSON.stringify(
        Object.keys(gaugeAttributes)
          .sort()
          .map((key) => [key, gaugeAttributes[key]])
      );

const observeGauge = ({ meter, name, val, gaugeOptions, gaugeAttributes }: GaugeOperationParams) => {
  // An instrument belongs to the meter that created it, so two meters may each
  // hold an instrument of the same name and the registry is keyed by both.
  let gauges = meters.get(meter);
  if (gauges === undefined) {
    gauges = new Map<string, Map<string, Observation>>();
    meters.set(meter, gauges);
  }

  let observations = gauges.get(name);
  if (observations === undefined) {
    const created = new Map<string, Observation>();
    const gauge = acquireMeter(meter).createObservableGauge(name, gaugeOptions);

    // The registry deduplicates callbacks by reference, so a callback registered
    // per call would accumulate for the lifetime of the process.
    gauge.addCallback((result) => {
      for (const observation of created.values()) {
        result.observe(observation.val, observation.gaugeAttributes);
      }
    });

    observations = created;
    gauges.set(name, created);
  }

  observations.set(observationKey(gaugeAttributes), { val, gaugeAttributes });
};

export { observeGauge, type GaugeOperationParams };
