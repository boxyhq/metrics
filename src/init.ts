import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterGRPC } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

type ServiceInfo = {
  name: string;
  version: string;
};

/**
 *  Configure the exporter and also a global MeterProvider.
 *
 *  See https://opentelemetry.io/docs/instrumentation/js/instrumentation/#initialize-metrics
 */

function initializeMetrics(serviceInfo: ServiceInfo) {
  if (process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    /** exportIntervalMillis must be greater than exportTimeoutMillis */
    const exportIntervalMillis = Number(process.env.OTEL_EXPORT_INTERVAL_MS) || 60000;
    const exportTimeoutMillis = Number(process.env.OTEL_EXPORT_INTERVAL_MS) - 1000 || 30000;

    let metricExporter;
    if (
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL === 'grpc' ||
      process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL === 'grpc'
    ) {
      metricExporter = new OTLPMetricExporterGRPC();
    } else {
      metricExporter = new OTLPMetricExporter();
    }

    const meterProvider = new MeterProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: `${serviceInfo.name}`,
        [ATTR_SERVICE_VERSION]: `${serviceInfo.version}`,
      }),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis,
          exportTimeoutMillis,
        }),
      ],
    });

    metrics.setGlobalMeterProvider(meterProvider);
  }

  if (process.env.OTEL_EXPORTER_DEBUG) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }
}

export { initializeMetrics };
