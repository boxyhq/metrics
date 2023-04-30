# @boxyhq/metrics

<a href="https://www.npmjs.com/package/@boxyhq/metrics"><img src="https://img.shields.io/npm/v/@boxyhq/metrics.svg" alt="npm" ></a>

Package for OTel instrumentation

## Running Tests

Tests helps us to ensure that the telemetry export works as expected after every OTEL dependency update.

```shell
npm i
# Copy test/.env.example to test/.env and set the values
cp test/.env.example test/.env
npm run test:manual
```
