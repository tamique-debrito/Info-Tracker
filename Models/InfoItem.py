

from dataclasses import dataclass
from enum import Enum
from pydantic import BaseModel


from datetime import date
from uuid import UUID


class Status(Enum):
    Active = 1
    Inactive = 2
    Done = 3


class InfoItem(BaseModel):
    id: UUID
    title: str
    detail: str
    due_date: date
    status: Status = Status.Active


class NewInfoItem(BaseModel):
    title: str
    detail: str
    due_date: date


class Recurrence(Enum):
    Once = 1
    Daily = 2
    Always = 3


@dataclass
class Tracking:
    recurrence: Recurrence
    review_date: Optional[date] # If this has a particular review date (e.g. the due date of a todo, the next time to reflect on a certain thing, the time to review whether to reactivate something else)
    status: Status