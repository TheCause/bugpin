import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { installDom } from '../helpers/dom';
import { installFakeIndexedDB } from '../helpers/fake-indexeddb';

const originalFetch = globalThis.fetch;
let restoreDom: () => void;

function failWith(error: Error): void {
  globalThis.fetch = (async () => {
    throw error;
  }) as unknown as typeof fetch;
}

function respondWith(status: number, body: Record<string, unknown>): void {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;
}

beforeEach(() => {
  restoreDom = installDom('https://app.example.com');
  installFakeIndexedDB();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreDom();
});

// The default (option unset) renders the widget with built-in defaults. It is not
// exercised here: a rendered widget installs page-wide capture hooks that would
// leak into the other test files, which share this process.
describe('widget initialization when the server cannot provide its configuration', () => {
  it('stays hidden with hideWhenUnavailable when the server is unreachable', async () => {
    failWith(new TypeError('Failed to fetch'));

    const { default: BugPin } = await import('../../index');
    await BugPin.init({
      apiKey: 'proj_unreachable',
      serverUrl: 'https://bugpin.example.com',
      hideWhenUnavailable: true,
    });

    expect(document.getElementById('bugpin-widget')).toBeNull();
  });

  it('stays hidden with hideWhenUnavailable when the server answers with an error', async () => {
    respondWith(502, { success: false, error: 'BAD_GATEWAY' });

    const { default: BugPin } = await import('../../index');
    await BugPin.init({
      apiKey: 'proj_unreachable',
      serverUrl: 'https://bugpin.example.com',
      hideWhenUnavailable: true,
    });

    expect(document.getElementById('bugpin-widget')).toBeNull();
  });
});
