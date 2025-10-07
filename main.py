from fastapi import FastAPI
from routers import render
from fastapi.staticfiles import StaticFiles



app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(render.router)  
