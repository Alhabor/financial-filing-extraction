#!/usr/bin/env node

const fs = require('node:fs');
const { execFileSync, spawn } = require('node:child_process');

const OLLAMA_MODEL = 'hf.co/QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M';
const SERVER_ALIAS = 'QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function resolveModelPath() {
  if (process.env.FINANCE_LLAMA_GGUF_PATH) return process.env.FINANCE_LLAMA_GGUF_PATH;
  const modelfile = execFileSync('ollama', ['show', '--modelfile', OLLAMA_MODEL], { encoding: 'utf8' });
  const from = modelfile.match(/^FROM\s+(.+)$/m);
  if (!from) throw new Error(`Could not resolve the local GGUF from Ollama model ${OLLAMA_MODEL}.`);
  return from[1].trim();
}

function verifyGguf(modelPath) {
  if (!fs.existsSync(modelPath) || !fs.statSync(modelPath).isFile()) throw new Error('Resolved finance model path is not a file.');
  const descriptor = fs.openSync(modelPath, 'r');
  try {
    const header = Buffer.alloc(4);
    fs.readSync(descriptor, header, 0, 4, 0);
    if (header.toString('ascii') !== 'GGUF') throw new Error('Resolved finance model does not have a GGUF header.');
  } finally {
    fs.closeSync(descriptor);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write([
      'Usage: node scripts/start_finance_llama_server.cjs [--port 8080] [--ctx-size 8192] [--dry-run]',
      '',
      'The GGUF path is resolved from FINANCE_LLAMA_GGUF_PATH or the installed Ollama model.',
      'The server binds only to 127.0.0.1 and exposes the locked experiment model alias.'
    ].join('\n') + '\n');
    return;
  }
  const port = String(args.port || '8080');
  const context = String(args['ctx-size'] || '8192');
  if (!/^\d+$/.test(port) || !/^\d+$/.test(context)) throw new Error('Port and context size must be positive integers.');
  const modelPath = resolveModelPath();
  verifyGguf(modelPath);
  const serverArgs = [
    '--model', modelPath,
    '--alias', SERVER_ALIAS,
    '--host', '127.0.0.1',
    '--port', port,
    '--ctx-size', context,
    '--parallel', '1',
    '--jinja',
    '--metrics',
    '--no-webui'
  ];
  process.stdout.write(`${JSON.stringify({
    status: args['dry-run'] ? 'validated' : 'starting',
    host: '127.0.0.1',
    port: Number(port),
    context_length: Number(context),
    model_alias: SERVER_ALIAS,
    model_path_source: process.env.FINANCE_LLAMA_GGUF_PATH ? 'environment' : 'ollama-modelfile'
  }, null, 2)}\n`);
  if (args['dry-run']) return;
  const child = spawn('llama-server', serverArgs, { stdio: 'inherit' });
  child.on('error', (error) => {
    process.stderr.write(`start_finance_llama_server: ${error.message}\n`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) process.stderr.write(`llama-server exited from signal ${signal}\n`);
    process.exitCode = code ?? 1;
  });
}

try {
  main();
} catch (error) {
  process.stderr.write(`start_finance_llama_server: ${error.message}\n`);
  process.exitCode = 1;
}
