import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routes import auth, assessments

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("thyrocare.main")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ThyroCare-AI API")

# CORS: reads FRONTEND_URL from env on Render, falls back to localhost for dev
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(assessments.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ThyroCare-AI API"}
