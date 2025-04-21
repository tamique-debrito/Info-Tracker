from Models.InfoItem import InfoItem, Status


import os
import pickle
from typing import Dict
from uuid import UUID


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

    def get_all_active_items(self):
        return [item for item in self.get_all_items() if item.tracking.status == Status.Active]

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


DB_FILE = "database.pkl"