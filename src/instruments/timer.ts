import type { Attributes, MetricOptions, Histogram } from "@opentelemetry/api";
import { acquireMeter } from "../lib/meter";

const timers: Record<string, Histogram<Attributes>> = {};

type OperationParams = {
  meter: string;
  name: string;
  val: number;
  timerOptions?: MetricOptions;
  timerAttributes?: Attributes;
};

const recordTimer = ({
  meter,
  name,
  val,
  timerOptions,
  timerAttributes,
}: OperationParams) => {
  let timer = timers[name];
  if (timer === undefined) {
    const _otelMeter = acquireMeter(meter);
    timer = timers[name] = _otelMeter.createHistogram(name, {
      ...timerOptions,
      unit: "ns",
    });
  }
  timer.record(val, timerAttributes);
};

export { recordTimer };