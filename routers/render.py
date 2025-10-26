from fastapi import APIRouter, Request
from controller import auth
from fastapi.templating import Jinja2Templates

template = Jinja2Templates(directory="templates")
router = APIRouter()

@router.get("/")
async def home(request: Request):
    # Check if user is authenticated
    user = None
    try:
        user = auth.getCurrentUserFromCookie(request.cookies.get("token"))
        return template.TemplateResponse("index.html", {"request": request, "user": user["user"]})
    except Exception as e:
        print(e)
        user = None
    return template.TemplateResponse("index.html", {"request": request, "user": user})

@router.get("/login")
async def login(request: Request):
    return template.TemplateResponse("login.html", {"request": request})

@router.get("/register")
async def register(request: Request):
    return template.TemplateResponse("register.html", {"request": request})

@router.get("/about")
async def about(request: Request):
    return template.TemplateResponse("about.html", {"request": request})

@router.get("/info")
async def info(request: Request):
    try:
        user = auth.getCurrentUserFromCookie(request.cookies.get("token"))
    except Exception as e:
        print(e)
        return template.TemplateResponse("login.html", {"request": request, "error": "Please log in to access this page."})
    return template.TemplateResponse("user_form.html", {"request": request, "user": user})

@router.get("/Dashboard")
async def dashboard(request: Request):
    try:
        user = auth.getCurrentUserFromCookie(request.cookies.get("token"))
        
    except Exception as e:
        print(e)
        return template.TemplateResponse("login.html", {"request": request, "error": "Please log in to access this page."})
    return template.TemplateResponse("dashboard.html", {"request": request, "user": user})

@router.get("/Reminders")
async def reminders(request: Request):
    try:
        user = auth.getCurrentUserFromCookie(request.cookies.get("token"))
    except Exception as e:
        print(e)
        return template.TemplateResponse("login.html", {"request": request, "error": "Please log in to access this page."})
    return template.TemplateResponse("reminder.html", {"request": request, "user": user})

