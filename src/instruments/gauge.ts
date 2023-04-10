import type {
  Attributes,
  MetricOptions,
  ObservableGauge,
} from "@opentelemetry/api";
import { acquireMeter } from "../lib/meter";

const gauges: Record<string, ObservableGauge<Attributes>> = {};

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

const observeGauge = ({
  meter,
  name,
  val,
  gaugeOptions,
  gaugeAttributes,
}: GaugeOperationParams) => {
  let gauge = gauges[name];
  if (gauge === undefined) {
    const _otelMeter = acquireMeter(meter);
    gauge = gauges[name] = _otelMeter.createObservableGauge(name, gaugeOptions);
  }
  gauge.addCallback((result) => {
    result.observe(val, gaugeAttributes);
  });
};

export { observeGauge, type GaugeOperationParams };
