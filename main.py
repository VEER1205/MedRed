from fastapi import FastAPI
from routers import render


app = FastAPI()
app.include_router(render.router)  
