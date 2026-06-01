import datetime
from app.database import engine, Base, SessionLocal
from app.models import Faculty, LeaveApplication
from app.auth import hash_password

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed departments via explicit faculty entries: one HOD per department, one principal, one admin, and sample faculty
    users = [
        {
            'faculty_id': 'HOD-HS-001',
            'name': 'Dr. Hannah Stone',
            'phone_number': '9000000001',
            'password': 'hodpassword',
            'department': 'H&S',
            'role': 'hod',
            'cl_balance': 12,
            'ml_balance': 10,
        },
        {
            'faculty_id': 'HOD-CSE-001',
            'name': 'Dr. Rajesh Kumar',
            'phone_number': '9000000002',
            'password': 'hodpassword',
            'department': 'CSE',
            'role': 'hod',
            'cl_balance': 12,
            'ml_balance': 10,
        },
        {
            'faculty_id': 'HOD-CSM-001',
            'name': 'Dr. Anita Verma',
            'phone_number': '9000000003',
            'password': 'hodpassword',
            'department': 'CSM',
            'role': 'hod',
            'cl_balance': 12,
            'ml_balance': 10,
        },
        {
            'faculty_id': 'PRINC-001',
            'name': 'Prof. A. Principal',
            'phone_number': '9000000010',
            'password': 'principalpass',
            'department': 'CSE',
            'role': 'principal',
            'cl_balance': 0,
            'ml_balance': 0,
        },
        {
            'faculty_id': 'ADMIN-001',
            'name': 'HR Admin',
            'phone_number': '9000000099',
            'password': 'adminpass',
            'department': 'CSE',
            'role': 'admin',
            'cl_balance': 0,
            'ml_balance': 0,
        },
        {
            'faculty_id': 'FAC-CSE-101',
            'name': 'Alice Johnson',
            'phone_number': '9000000101',
            'password': 'faculty101',
            'department': 'CSE',
            'role': 'faculty',
            'cl_balance': 12,
            'ml_balance': 6,
        },
    ]

    for u in users:
        exists = db.query(Faculty).filter_by(faculty_id=u['faculty_id']).first()
        if exists:
            continue
        f = Faculty(
            faculty_id=u['faculty_id'],
            name=u['name'],
            phone_number=u['phone_number'],
            password_hash=hash_password(u['password']),
            department=u['department'],
            role=u['role'],
            cl_balance=u['cl_balance'],
            ml_balance=u['ml_balance'],
            is_active=True,
        )
        db.add(f)

    db.commit()
    db.close()
    print('Database initialized and seeded.')

if __name__ == '__main__':
    init()
