#!/usr/bin/env node
// NR-02: Measure login + room-list latency against the running Node server.
// Usage: npm run benchmark:login -- --url http://192.168.1.10:3000
const { performance } = require('node:perf_hooks');

const baseUrl = (process.env.BASE_URL || process.argv.find((arg) => arg.startsWith('http')) || 'http://127.0.0.1:3000').replace(/\/$/, '');
const iterations = Math.max(5, Number(process.env.ITERATIONS || 20));
const username = process.env.BENCH_USERNAME;
const password = process.env.BENCH_PASSWORD;

if (!username || !password) {
  console.error('Set BENCH_USERNAME and BENCH_PASSWORD to an existing test account.');
  process.exit(2);
}

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new Error(`${path} returned HTTP ${response.status}: ${body.message || 'request failed'}`);
  }
  return body;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

(async () => {
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const started = performance.now();
    const login = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const rooms = await request('/api/rooms', {
      headers: { authorization: `Bearer ${login.token}` }
    });
    if (!Array.isArray(rooms.rooms)) throw new Error('Room list response was malformed.');
    samples.push(performance.now() - started);
  }

  const p95 = percentile(samples, 0.95);
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  console.log(JSON.stringify({
    target: 'login + room list <= 2000 ms',
    baseUrl, iterations,
    averageMs: Number(average.toFixed(2)),
    p50Ms: Number(percentile(samples, 0.50).toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    maxMs: Number(Math.max(...samples).toFixed(2)),
    passed: p95 <= 2000
  }, null, 2));
  if (p95 > 2000) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
