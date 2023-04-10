import type { Attributes, Counter, MetricOptions } from "@opentelemetry/api";
import { acquireMeter } from "../lib/meter";

const counters: Record<string, Counter<Attributes>> = {};

type CounterOperationParams = {
  /** OTel meter name */
  meter: string;
  /** Metric name being instrumented */
  name: string;
  /** Value by which counter is incremented, defaults to 1 */
  inc?: number;
  /** MetricOptions such as unit */
  counterOptions?: MetricOptions;
  /** Metric Attributes in the form of key value pairs */
  counterAttributes?: Attributes;
};

const incrementCounter = ({
  meter,
  name,
  inc = 1,
  counterOptions,
  counterAttributes,
}: CounterOperationParams) => {
  let counter = counters[name];
  if (counter === undefined) {
    const _otelMeter = acquireMeter(meter);
    counter = counters[name] = _otelMeter.createCounter(name, counterOptions);
  }
  counter.add(inc, counterAttributes);
};

export { incrementCounter, type CounterOperationParams };
