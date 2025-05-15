from dataclasses import dataclass
from enum import Enum
from typing import Optional
from pydantic import BaseModel


from datetime import date
from uuid import UUID


class Status(Enum):
    Active = 1
    Inactive = 2
    Done = 3

class Recurrence(Enum):
    Once = 1
    Periodic = 2

class TodoType(Enum):
    Todo = 1
    ProjectIdea = 2
    PhilosophicalIdea = 3

@dataclass
class Tracking:
    recurrence: Recurrence
    review_date: Optional[date]  # If this has a particular review date (e.g. the due date of a todo, the next time to reflect on a certain thing, the time to review whether to reactivate something else)
    status: Status = Status.Active
    period: Optional[int] = None # If this is a periodic item, this is the period in days

class NewInfoItem(BaseModel):
    title: str
    detail: str
    target_date: date
    todo_type: TodoType = TodoType.Todo

class InfoItem(BaseModel):
    id: UUID
    title: str
    detail: str
    tracking: Tracking
    todo_type: TodoType = TodoType.Todo

    def mark_done(self):
        self.tracking.status = Status.Done
        self.tracking.review_date = None
    
    def deactivate(self, review_date: date):
        self.tracking.status = Status.Inactive
        self.tracking.review_date = review_date
    
    def reactivate(self, review_date: date):
        self.tracking.status = Status.Active
        self.tracking.review_date = review_date

    def set_review_date(self, review_date: date):
        self.tracking.review_date = review_date

    def set_status(self, review_date: date, new_status: Optional[Status]):
        self.set_review_date(review_date)
        if new_status is not None:
            self.tracking.status = new_status
