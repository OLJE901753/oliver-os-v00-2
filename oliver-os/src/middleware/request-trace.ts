import type { Request, Response, NextFunction } from 'express';
import fs from 'fs-extra';
import path from 'node:path';

export async function requestTrace(req: Request, res: Response, next: NextFunction): Promise<void> {
  const start = process.hrtime.bigint();
  const startedAt = new Date().toISOString();
  const { method, originalUrl } = req;

  function done() {
    res.removeListener('finish', done);
    res.removeListener('close', done);
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const line = JSON.stringify({
      ts: startedAt,
      method,
      url: originalUrl,
      status: res.statusCode,
      durationMs: Math.round(ms),
      trace: (req.headers['x-request-id'] as string) || undefined
    }) + '\n';
    const logDir = path.join(process.cwd(), 'logs');
    fs.ensureDir(logDir).then(() => {
      fs.appendFile(path.join(logDir, 'trace.log'), line, 'utf-8').catch(() => void 0);
    }).catch(() => void 0);
  }

  res.on('finish', done);
  res.on('close', done);
  next();
}
