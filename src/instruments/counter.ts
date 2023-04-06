import type { Attributes, Counter, MetricOptions } from "@opentelemetry/api";
import { acquireMeter } from "../lib/meter";

const counters: Record<string, Counter<Attributes>> = {};

type OperationParams = {
  meter: string;
  name: string;
  inc?: number;
  counterOptions?: MetricOptions;
  counterAttributes?: Attributes;
};

const incrementCounter = ({
  meter,
  name,
  inc = 1,
  counterOptions,
  counterAttributes,
}: OperationParams) => {
  let counter = counters[name];
  if (counter === undefined) {
    const _otelMeter = acquireMeter(meter);
    counter = counters[name] = _otelMeter.createCounter(name, counterOptions);
  }
  counter.add(inc, counterAttributes);
};

export { incrementCounter };
