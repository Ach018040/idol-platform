from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/research/run")
def run():
    return {"result": "mock research completed"}
