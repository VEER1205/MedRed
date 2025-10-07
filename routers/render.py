from fastapi import APIRouter,HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

template = Jinja2Templates(directory="templates")
router = APIRouter()

@router.get("/")
async def home(request: Request):
    return template.TemplateResponse("index.html", {"request": request})

@router.get("/login")
async def login(request: Request):
    return template.TemplateResponse("login.html", {"request": request})

@router.get("/about")
async def about(request: Request):
    return template.TemplateResponse("about.html", {"request": request})