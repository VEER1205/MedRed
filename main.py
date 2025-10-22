from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import render,auth, reminders
from fastapi.staticfiles import StaticFiles



app = FastAPI()
# In dev, allow localhost & file origins (adjust for your setup)
origins = [
    "http://localhost:5500",     # VSCode Live Server
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "https://medred.onrender.com"
    "http://127.0.0.1:8000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(render.router)  
app.include_router(prefix="/api", router=auth.router)
app.include_router(prefix="/api", router=reminders.router)
