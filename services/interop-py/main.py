import os
from typing import Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HIMS Interoperability Service",
    description="Python/FastAPI microservice for HL7/FHIR Laboratory, NHIA/HMO claims, and Radiology",
    version="0.1.0",
)

# CORS Middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "ok",
        "service": "interop-py",
    }


@app.get("/api/v1/health")
def api_health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "service": "interop-py",
        "version": "v1",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
