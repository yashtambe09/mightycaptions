import os
import shutil
from starlette.background import BackgroundTask


def cleanup_job(job_id: str) -> BackgroundTask:
    def _cleanup():
        job_dir = f"/tmp/{job_id}"
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)

    return BackgroundTask(_cleanup)
