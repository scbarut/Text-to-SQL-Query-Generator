from sqlalchemy import Column, Integer, String
from database import Base

class Employees(Base):
    __tablename__ = 'employees'

    id = Column(Integer, primary_key=True, index=True, unique= True)
    first_name = Column(String)
    last_name = Column(String)
    gender = Column(String)
    date_of_birth = Column(String)
    email = Column(String, unique= True)
    phone = Column(String, unique= True)