import multiprocessing

# Workers: 2-4 × CPU cores. Each worker handles one request at a time.
# With 4 workers, 4 candidates can have active requests simultaneously.
workers = multiprocessing.cpu_count() * 2 + 1

# Use threads within each worker for lightweight I/O-bound tasks.
# This allows each worker to handle multiple concurrent requests.
threads = 4

# Worker class: gthread supports threads, handles concurrent I/O well.
worker_class = "gthread"

# Timeout: how long a worker can spend on a single request before being killed.
# Set high enough for AI engine calls (end-interview) but not infinite.
# Recording uploads no longer block workers (direct-to-Drive), so 120s is safe.
timeout = 300

# Keep-alive: seconds to wait for requests on a keep-alive connection.
keepalive = 5

# Bind address
bind = "0.0.0.0:5000"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
