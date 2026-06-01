from sqlalchemy import Column, String, Integer, Boolean, Date, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import enum


class DepartmentEnum(str, enum.Enum):
    HS = 'H&S'
    CSE = 'CSE'
    CSM = 'CSM'


class RoleEnum(str, enum.Enum):
    FACULTY = 'faculty'
    HOD = 'hod'
    PRINCIPAL = 'principal'
    ADMIN = 'admin'


class StatusEnum(str, enum.Enum):
    PENDING_HOD = 'PENDING_HOD'
    PENDING_PRINCIPAL = 'PENDING_PRINCIPAL'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'


class Faculty(Base):
    __tablename__ = 'faculty'

    faculty_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(300), nullable=False)
    department = Column(Enum(DepartmentEnum), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.FACULTY)
    cl_balance = Column(Integer, nullable=False, default=0)
    ml_balance = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    leaves = relationship('LeaveApplication', back_populates='faculty')


class LeaveApplication(Base):
    __tablename__ = 'leave_applications'

    leave_id = Column(String(64), primary_key=True, index=True)
    faculty_id = Column(String(64), ForeignKey('faculty.faculty_id'), nullable=False)
    department = Column(Enum(DepartmentEnum), nullable=False)
    leave_type = Column(String(32), nullable=False)  # e.g., 'CL' or 'ML'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.PENDING_HOD)
    hod_remarks = Column(Text, nullable=True)
    principal_remarks = Column(Text, nullable=True)

    faculty = relationship('Faculty', back_populates='leaves')
