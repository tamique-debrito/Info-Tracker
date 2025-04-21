from uuid import uuid4
from uuid import UUID
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from typing import Optional
from fastapi.staticfiles import StaticFiles

from Database import DB_FILE, Database
from Models.InfoItem import InfoItem, Tracking
from Models.InfoItem import Status
from Models.InfoItem import NewInfoItem

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

db_instance = Database(DB_FILE)

@app.get("/", response_class=HTMLResponse)
def get_main_page():
    return FileResponse('static/main.html')

@app.get("/info_items")
def get_info_items():
    items = db_instance.get_all_active_items()
    return [info_item.dict() for info_item in items]

@app.post("/info_items")
def new_info_item(new_item: NewInfoItem):
    uuid = uuid4()
    tracking = Tracking()
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