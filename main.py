from datetime import date
from enum import Enum
from uuid import UUID
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Dict
import pickle
import os

app = FastAPI()
DB_FILE = "database.pkl"

class Status(Enum):
    Active = 1
    Done = 2

class InfoItem(BaseModel):
    id: UUID
    title: str
    detail: str
    due_date: date
    status: Status = Status.Active

def load_db() -> Dict[UUID, InfoItem]:
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "rb") as f:
            return pickle.load(f)
    return {}

def save_db(db: Dict[UUID, InfoItem]):
    with open(DB_FILE, "wb") as f:
        pickle.dump(db, f)

@app.get("/", response_class=HTMLResponse)
def get_main_page():
    return """
    <html>
        <head><title>Todo App</title></head>
        <body>
            <h1>Welcome to the Todo App</h1>
            <p>The app does not yet support loading or creating todos</p>
        </body>
    </html>
    """

@app.get("/info_items")
def get_info_items():
    db = load_db()
    return [info_item.dict() for info_item in db.values()]

@app.post("/info_items")
def new_info_item(title: str, detail: str, due_date: date):
    uuid = UUID()
    
    db = load_db()
    item = InfoItem(id=uuid, title=title, detail=detail, due_date=due_date)
    db[uuid] = item

@app.post("/info_items/{info_item_id}/done")
def mark_info_item_done(info_item_id: UUID):
    db = load_db()
    if info_item_id not in db:
        raise HTTPException(status_code=404, detail="info_item not found.")
    db[info_item_id].status = Status.Done
    save_db(db)
    return {"message": f"info_item {info_item_id} marked as Done."}