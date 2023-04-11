import type { Attributes, MetricOptions, Histogram } from "@opentelemetry/api";
import { acquireMeter } from "../lib/meter";

const timers: Record<string, Histogram<Attributes>> = {};

type TimerOperationParams = {
  /** OTel meter name */
  meter: string;
  /** Metric name being instrumented */
  name: string;
  /** Timer value to be recorded */
  val: number;
  /** MetricOptions such as unit */
  timerOptions?: MetricOptions;
  /** Metric Attributes in the form of key value pairs */
  timerAttributes?: Attributes;
};

const recordTimer = ({
  meter,
  name,
  val,
  timerOptions,
  timerAttributes,
}: TimerOperationParams) => {
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

export { recordTimer, type TimerOperationParams };
