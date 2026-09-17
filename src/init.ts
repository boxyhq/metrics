import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterGRPC } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  defaultResource,
  detectResources,
  envDetector,
  resourceFromAttributes,
  serviceInstanceIdDetector,
  type Resource,
} from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

type ServiceInfo = {
  name: string;
  version: string;
};

/**
 *  Build the Resource that identifies this process in every exported metric.
 *
 *  See https://opentelemetry.io/docs/specs/semconv/resource/
 */
function buildResource(serviceInfo: ServiceInfo): Resource {
  // Replicas of a service share one series identity unless service.instance.id
  // sets them apart; environment attributes merge last so a deployment can override it.
  return defaultResource()
    .merge(detectResources({ detectors: [serviceInstanceIdDetector] }))
    .merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: `${serviceInfo.name}`,
        [ATTR_SERVICE_VERSION]: `${serviceInfo.version}`,
      })
    )
    .merge(detectResources({ detectors: [envDetector] }));
}

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
      resource: buildResource(serviceInfo),
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

export { buildResource, initializeMetrics, type ServiceInfo };
