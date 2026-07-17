class MetricsRegistry {
  private apiRequests: Record<string, number> = {};
  private apiLatencies: Record<string, number[]> = {};
  private dbLatencies: number[] = [];
  private aiLatencies: Record<string, number[]> = {};
  private whatsappFailures = 0;

  public recordApiRequest(method: string, endpoint: string, status: number): void {
    const key = `${method}_${endpoint}_${status}`;
    this.apiRequests[key] = (this.apiRequests[key] || 0) + 1;
  }

  public recordApiLatency(method: string, endpoint: string, durationMs: number): void {
    const key = `${method}_${endpoint}`;
    if (!this.apiLatencies[key]) this.apiLatencies[key] = [];
    this.apiLatencies[key].push(durationMs);
  }

  public recordDbLatency(durationMs: number): void {
    this.dbLatencies.push(durationMs);
  }

  public recordAiLatency(task: string, durationMs: number): void {
    if (!this.aiLatencies[task]) this.aiLatencies[task] = [];
    this.aiLatencies[task].push(durationMs);
  }

  public recordWhatsappFailure(): void {
    this.whatsappFailures += 1;
  }

  public getPrometheusFormat(): string {
    let output = '';

    // API requests counter
    output += '# HELP propx_api_requests_total Total number of HTTP requests processed.\n';
    output += '# TYPE propx_api_requests_total counter\n';
    Object.entries(this.apiRequests).forEach(([key, count]) => {
      const parts = key.split('_');
      const method = parts[0];
      const status = parts[parts.length - 1];
      const endpoint = parts.slice(1, -1).join('_');
      output += `propx_api_requests_total{method="${method}",endpoint="${endpoint}",status="${status}"} ${count}\n`;
    });

    // Process uptime
    output += '# HELP propx_uptime_seconds Process uptime in seconds.\n';
    output += '# TYPE propx_uptime_seconds gauge\n';
    output += `propx_uptime_seconds ${process.uptime()}\n`;

    // Process memory usage
    const memory = process.memoryUsage();
    output += '# HELP propx_memory_heap_used_bytes Memory heap used in bytes.\n';
    output += '# TYPE propx_memory_heap_used_bytes gauge\n';
    output += `propx_memory_heap_used_bytes ${memory.heapUsed}\n`;
    output += '# HELP propx_memory_rss_bytes Resident set size in bytes.\n';
    output += '# TYPE propx_memory_rss_bytes gauge\n';
    output += `propx_memory_rss_bytes ${memory.rss}\n`;

    // DB queries latency
    const avgDb = this.dbLatencies.length ? this.dbLatencies.reduce((a, b) => a + b, 0) / this.dbLatencies.length : 0;
    output += '# HELP propx_db_latency_avg_ms Average database query latency in ms.\n';
    output += '# TYPE propx_db_latency_avg_ms gauge\n';
    output += `propx_db_latency_avg_ms ${avgDb.toFixed(2)}\n`;

    // AI queries latency
    output += '# HELP propx_ai_latency_avg_ms Average AI provider query latency in ms.\n';
    output += '# TYPE propx_ai_latency_avg_ms gauge\n';
    Object.entries(this.aiLatencies).forEach(([task, list]) => {
      const avgAi = list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
      output += `propx_ai_latency_avg_ms{task="${task}"} ${avgAi.toFixed(2)}\n`;
    });

    // WhatsApp API failures
    output += '# HELP propx_whatsapp_delivery_failures_total Total WhatsApp API send failures.\n';
    output += '# TYPE propx_whatsapp_delivery_failures_total counter\n';
    output += `propx_whatsapp_delivery_failures_total ${this.whatsappFailures}\n`;

    return output;
  }
}

export const metrics = new MetricsRegistry();
export default metrics;
