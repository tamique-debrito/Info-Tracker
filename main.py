from enum import Enum
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

class InfoElement(BaseModel):
    id: int
    title: str
    detail: str
    due_date: str
    status: Status = Status.Active

def load_db() -> Dict[int, InfoElement]:
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "rb") as f:
            return pickle.load(f)
    return {}

def save_db(db: Dict[int, InfoElement]):
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

@app.get("/todos")
def get_todos():
    db = load_db()
    return [todo.dict() for todo in db.values()]

@app.post("/todos/{todo_id}/done")
def mark_todo_done(todo_id: int):
    db = load_db()
    if todo_id not in db:
        raise HTTPException(status_code=404, detail="Todo not found.")
    db[todo_id].status = Status.Done
    save_db(db)
    return {"message": f"Todo {todo_id} marked as Done."}