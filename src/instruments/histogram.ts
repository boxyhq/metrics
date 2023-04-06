import type { Attributes, MetricOptions, Histogram } from "@opentelemetry/api";
import { acquireMeter } from "../lib/meter";

const histograms: Record<string, Histogram<Attributes>> = {};

type OperationParams = {
  meter: string;
  name: string;
  val: number;
  histogramOptions?: MetricOptions;
  histogramAttributes?: Attributes;
};

const recordHistogram = ({
  meter,
  name,
  val,
  histogramOptions,
  histogramAttributes,
}: OperationParams) => {
  let histogram = histograms[name];
  if (histogram === undefined) {
    const _otelMeter = acquireMeter(meter);
    histogram = histograms[name] = _otelMeter.createHistogram(
      name,
      histogramOptions
    );
  }
  histogram.record(val, histogramAttributes);
};

export { recordHistogram };
