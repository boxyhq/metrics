import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterGRPC } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

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
    const meterProvider = new MeterProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: `${serviceInfo.name}`,
        [SemanticResourceAttributes.SERVICE_VERSION]: `${serviceInfo.version}`,
      }),
    });

    let metricExporter;
    if (
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL === 'grpc' ||
      process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL === 'grpc'
    ) {
      metricExporter = new OTLPMetricExporterGRPC();
    } else {
      metricExporter = new OTLPMetricExporter();
    }

    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 60000,
      })
    );

    metrics.setGlobalMeterProvider(meterProvider);
  }

  if (process.env.OTEL_EXPORTER_DEBUG) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }
}

export { initializeMetrics };
