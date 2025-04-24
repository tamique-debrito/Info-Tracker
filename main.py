from datetime import date
from datetime import date
from uuid import uuid4
from uuid import UUID
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from typing import Optional
from fastapi.staticfiles import StaticFiles

from Database import DB_FILE, Database
from Models.InfoItem import InfoItem, Recurrence, Tracking
from Models.InfoItem import NewInfoItem

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

db_instance = Database(DB_FILE)


def update_info_item_op(info_item_id: UUID, operation, success_message):
    # Helper function to simplify code for simple operations
    item = db_instance.get_item(info_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"info_item {info_item_id} not found.")
    operation(item)
    db_instance.update_item(item)
    return {"message": success_message}


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
    tracking = Tracking(recurrence=Recurrence.Once, review_date=new_item.target_date)
    item = InfoItem(id=uuid, title=new_item.title, detail=new_item.detail, tracking=tracking)
    db_instance.add_item(item)

@app.post("/info_items/{info_item_id}/done")
def mark_info_item_done(info_item_id: UUID):
    return update_info_item_op(
        info_item_id,
        lambda item: item.mark_done(),
        f"info_item {info_item_id} marked as Done."
    )

@app.post("/info_items/{info_item_id}/deactivate")
def deactivate_info_item(info_item_id: UUID, review_date: date):
    return update_info_item_op(
        info_item_id,
        lambda item: item.deactivate(review_date),
        f"info_item {info_item_id} deactivated."
    )

@app.post("/info_items/{info_item_id}/reactivate")
def reactivate_info_item(info_item_id: UUID, review_date: date):
    return update_info_item_op(
        info_item_id,
        lambda item: item.reactivate(review_date),
        f"info_item {info_item_id} reactivated."
    )

@app.post("/info_items/{info_item_id}/defer")
def defer_info_item(info_item_id: UUID, review_date: date):
    return update_info_item_op(
        info_item_id,
        lambda item: item.set_review_date(review_date),
        f"info_item {info_item_id} deferred."
    )