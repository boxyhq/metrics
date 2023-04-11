import type { Attributes, MetricOptions, Histogram } from '@opentelemetry/api';
import { acquireMeter } from '../lib/meter';

const histograms: Record<string, Histogram<Attributes>> = {};

type HistogramOperationParams = {
  /** OTel meter name */
  meter: string;
  /** Metric name being instrumented */
  name: string;
  /** Value to be recorded  */
  val: number;
  /** MetricOptions such as unit */
  histogramOptions?: MetricOptions;
  /** Metric Attributes in the form of key value pairs */
  histogramAttributes?: Attributes;
};

const recordHistogram = ({
  meter,
  name,
  val,
  histogramOptions,
  histogramAttributes,
}: HistogramOperationParams) => {
  let histogram = histograms[name];
  if (histogram === undefined) {
    const _otelMeter = acquireMeter(meter);
    histogram = histograms[name] = _otelMeter.createHistogram(name, histogramOptions);
  }
  histogram.record(val, histogramAttributes);
};

export { recordHistogram, type HistogramOperationParams };
