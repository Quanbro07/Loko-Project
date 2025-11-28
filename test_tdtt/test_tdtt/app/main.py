# app/main.py
from fastapi import FastAPI
from app.routers import locations, schedules, routing

app = FastAPI(title="Travel AI Server")

# Đăng ký các router
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(schedules.router, prefix="/api/v1/schedule", tags=["Schedule"])
app.include_router(routing.router, prefix="/api/v1/routing", tags=["Routing"])

@app.get("/ping")
def ping():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)