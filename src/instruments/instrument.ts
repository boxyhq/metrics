import type { Attributes } from '@opentelemetry/api';
import { incrementCounter } from './counter';
import { recordTimer } from './timer';

type InstrumentOperationParams = {
  /** OTel meter name */
  meter: string;
  /** Function name being instrumented */
  name: string;
  /** Handle to execute the function */
  delegate: () => unknown;
  /** Metric Attributes in the form of key value pairs  */
  instrumentAttributes?: Attributes;
};

/**
 * Run the given function, recording throughput, latency and errors
 *
 * @param operationParams
 */

async function instrument({ meter, name, delegate, instrumentAttributes }: InstrumentOperationParams) {
  const start = process.hrtime();
  try {
    return await delegate();
  } catch (err) {
    incrementCounter({
      meter,
      name: 'function.errors',
      counterAttributes: { function: name, ...instrumentAttributes },
    });
    throw err;
  } finally {
    const elapsed = process.hrtime(start);
    const elapsedNanos = elapsed[0] * 1000000000 + elapsed[1];
    recordTimer({
      meter,
      name: 'function.executionTime',
      val: elapsedNanos,
      timerAttributes: { function: name, ...instrumentAttributes },
    });
  }
}

/**
 * Decorator that instruments a class method
 *
 * @param meter - Name of OTel meter
 */
function instrumented(meter: string) {
  return function (target: any, key: string, descriptor?: PropertyDescriptor) {
    if (descriptor === undefined) {
      descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    if (descriptor === undefined) {
      return descriptor;
    }

    const originalMethod = descriptor.value;
    const klass = target.constructor.name;

    // this needs to be a non-arrow function or we'll get the wrong `this`
    function overrideMethod(this: unknown, ...args: any[]) {
      return instrument({
        meter,
        name: `${klass}.${key}`,
        delegate: async () => {
          return await originalMethod.apply(this, args);
        },
      });
    }

    descriptor.value = overrideMethod;

    return descriptor;
  };
}

export { instrument, instrumented, type InstrumentOperationParams };
