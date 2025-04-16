from datetime import date
from enum import Enum
from uuid import uuid4
from uuid import UUID
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from typing import Dict
import pickle
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

DB_FILE = "database.pkl"

class Status(Enum):
    Active = 1
    Done = 2

class NewInfoItem(BaseModel):
    title: str
    detail: str
    due_date: date

class InfoItem(BaseModel):
    id: UUID
    title: str
    detail: str
    due_date: date
    status: Status = Status.Active

class Database:
    def __init__(self, db_file: str):
        self.db_file = db_file

    def load(self) -> Dict[UUID, InfoItem]:
        if os.path.exists(self.db_file):
            with open(self.db_file, "rb") as f:
                return pickle.load(f)
        return {}

    def save(self, db: Dict[UUID, InfoItem]):
        with open(self.db_file, "wb") as f:
            pickle.dump(db, f)
    
    def get_all_items(self):
        return self.load().values()

    def get_item(self, id: UUID):
        data = self.load()
        if id not in data:
            return None
        return data[id]

    def add_item(self, item: InfoItem):
        data = self.load()
        data[item.id] = item
        self.save(data)
    
    def update_item(self, item: InfoItem):
        self.add_item(item)

db_instance = Database(DB_FILE)

@app.get("/", response_class=HTMLResponse)
def get_main_page():
    return FileResponse('static/main.html')

@app.get("/info_items")
def get_info_items():
    items = db_instance.get_all_items()
    return [info_item.dict() for info_item in items]

@app.post("/info_items")
def new_info_item(new_item: NewInfoItem):
    uuid = uuid4()
    item = InfoItem(id=uuid, title=new_item.title, detail=new_item.detail, due_date=new_item.due_date)
    db_instance.add_item(item)

@app.post("/info_items/{info_item_id}/done")
def mark_info_item_done(info_item_id: UUID):
    item = db_instance.get_item(info_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="info_item not found.")
    item.status = Status.Done
    db_instance.update_item(item)
    return {"message": f"info_item {info_item_id} marked as Done."}