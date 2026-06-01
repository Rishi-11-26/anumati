from .antigravity import Antigravity
from flask import request, redirect, make_response, jsonify, send_from_directory
from flask_cors import CORS
from .database import SessionLocal
from sqlalchemy import func, case, or_
from sqlalchemy.orm import joinedload
from .models import Faculty, LeaveApplication, DepartmentEnum, RoleEnum, StatusEnum
from .auth import verify_password, create_token, hash_password, current_user_from_request, logout
import os
import uuid
import datetime


def create_app():
    app = Antigravity(__name__)
    # Enable CORS for frontend dev server and allow credentials for cookie auth
    CORS(app, supports_credentials=True, resources={
        r"/api/*": {"origins": [
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:5174", "http://127.0.0.1:5174",
            "http://localhost:5175", "http://127.0.0.1:5175"
        ]}
    })


    # -------------------- JSON API Endpoints --------------------
    def faculty_to_dict(f):
        return {
            'faculty_id': f.faculty_id,
            'name': f.name,
            'phone_number': f.phone_number,
            'department': f.department.value,
            'role': f.role.value,
            'cl_balance': f.cl_balance,
            'ml_balance': f.ml_balance,
            'is_active': f.is_active,
        }

    def leave_to_dict(l):
        return {
            'leave_id': l.leave_id,
            'faculty_id': l.faculty_id,
            'faculty_name': getattr(l.faculty, 'name', None),
            'department': l.department.value,
            'leave_type': l.leave_type,
            'start_date': l.start_date.isoformat(),
            'end_date': l.end_date.isoformat(),
            'total_days': l.total_days,
            'reason': l.reason,
            'status': l.status.value,
            'hod_remarks': l.hod_remarks,
            'principal_remarks': l.principal_remarks,
        }

    cleanup_state = {'last_run': None}

    def get_current_academic_year_start(today):
        if today.month >= 4:
            return datetime.date(today.year, 4, 1)
        return datetime.date(today.year - 1, 4, 1)

    def cleanup_old_leave_history():
        today = datetime.date.today()
        cutoff = get_current_academic_year_start(today)
        db = SessionLocal()
        deleted = db.query(LeaveApplication).filter(LeaveApplication.end_date < cutoff).delete(synchronize_session=False)
        db.commit()
        db.close()
        return deleted

    @app.before_request
    def maybe_cleanup_leave_history():
        today = datetime.date.today()
        if cleanup_state['last_run'] == today:
            return
        cleanup_old_leave_history()
        cleanup_state['last_run'] = today

    @app.route('/api/login', methods=['POST'])
    def api_login():
        data = request.get_json() or {}
        identifier = data.get('identifier')
        password = data.get('password')
        db = SessionLocal()
        user = db.query(Faculty).filter((Faculty.phone_number == identifier) | (Faculty.faculty_id == identifier)).first()
        if not user or not verify_password(password, user.password_hash) or not user.is_active:
            db.close()
            return jsonify({'error': 'Invalid credentials or inactive account'}), 401
        token = create_token(user.faculty_id, user.role.value, user.department.value)
        resp = jsonify({'ok': True, 'user': faculty_to_dict(user)})
        resp.set_cookie('anam_token', token, httponly=True, samesite='Lax')
        db.close()
        return resp

    @app.route('/api/logout', methods=['POST'])
    def api_logout():
        resp = jsonify({'ok': True})
        return logout(resp)

    @app.route('/api/me')
    def api_me():
        user = current_user_from_request()
        if not user:
            return jsonify({'user': None}), 200
        return jsonify({'user': faculty_to_dict(user)}), 200

    @app.route('/api/leaves', methods=['GET', 'POST'])
    def api_leaves():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        db = SessionLocal()
        if request.method == 'GET':
            leaves = db.query(LeaveApplication).filter_by(faculty_id=user.faculty_id).order_by(LeaveApplication.start_date.desc()).all()
            out = [leave_to_dict(l) for l in leaves]
            db.close()
            return jsonify({'leaves': out}), 200
        # POST: create
        payload = request.get_json() or {}
        leave_type = payload.get('leave_type')
        start_date = payload.get('start_date')
        end_date = payload.get('end_date')
        reason = payload.get('reason')
        import datetime as _dt
        s = _dt.date.fromisoformat(start_date)
        e = _dt.date.fromisoformat(end_date)
        total_days = (e - s).days + 1
        leave = LeaveApplication(
            leave_id=str(uuid.uuid4()),
            faculty_id=user.faculty_id,
            department=user.department,
            leave_type=leave_type,
            start_date=s,
            end_date=e,
            total_days=total_days,
            reason=reason,
            status=StatusEnum.PENDING_HOD,
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)
        out = leave_to_dict(leave)
        db.close()
        return jsonify({'leave': out}), 201

    @app.route('/api/hod/pending')
    def api_hod_pending():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'hod':
            return jsonify({'error': 'forbidden'}), 403
        db = SessionLocal()
        pending = db.query(LeaveApplication).filter_by(department=user.department, status=StatusEnum.PENDING_HOD).order_by(LeaveApplication.start_date.asc()).all()
        out = [leave_to_dict(l) for l in pending]
        db.close()
        return jsonify({'pending': out}), 200

    @app.route('/api/hod/action', methods=['POST'])
    def api_hod_action():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'hod':
            return jsonify({'error': 'forbidden'}), 403
        payload = request.get_json() or {}
        leave_id = payload.get('leave_id')
        action = payload.get('action')
        remarks = payload.get('remarks', '')
        db = SessionLocal()
        leave = db.query(LeaveApplication).filter_by(leave_id=leave_id, department=user.department).first()
        if not leave:
            db.close()
            return jsonify({'error': 'not found'}), 404
        if action == 'recommend':
            leave.status = StatusEnum.PENDING_PRINCIPAL
            leave.hod_remarks = remarks
        elif action == 'reject':
            leave.status = StatusEnum.REJECTED
            leave.hod_remarks = remarks
        db.commit()
        db.close()
        return jsonify({'ok': True}), 200

    @app.route('/api/principal/pending')
    def api_principal_pending():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'principal':
            return jsonify({'error': 'forbidden'}), 403
        db = SessionLocal()
        pending = db.query(LeaveApplication).filter_by(status=StatusEnum.PENDING_PRINCIPAL).order_by(LeaveApplication.start_date.asc()).all()
        out = [leave_to_dict(l) for l in pending]
        db.close()
        return jsonify({'pending': out}), 200

    @app.route('/api/principal/action', methods=['POST'])
    def api_principal_action():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'principal':
            return jsonify({'error': 'forbidden'}), 403
        payload = request.get_json() or {}
        leave_id = payload.get('leave_id')
        action = payload.get('action')
        remarks = payload.get('remarks', '')
        db = SessionLocal()
        leave = db.query(LeaveApplication).filter_by(leave_id=leave_id).first()
        if not leave:
            db.close()
            return jsonify({'error': 'not found'}), 404
        if action == 'approve':
            leave.status = StatusEnum.APPROVED
            leave.principal_remarks = remarks
            fac = db.query(Faculty).filter_by(faculty_id=leave.faculty_id).first()
            if leave.leave_type.upper() == 'CL':
                fac.cl_balance = max(0, fac.cl_balance - leave.total_days)
            else:
                fac.ml_balance = max(0, fac.ml_balance - leave.total_days)
        elif action == 'reject':
            leave.status = StatusEnum.REJECTED
            leave.principal_remarks = remarks
        db.commit()
        db.close()
        return jsonify({'ok': True}), 200

    @app.route('/api/admin/users')
    def api_admin_users():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'admin':
            return jsonify({'error': 'forbidden'}), 403
        db = SessionLocal()
        users = db.query(Faculty).order_by(Faculty.department).all()
        out = [faculty_to_dict(u) for u in users]
        db.close()
        return jsonify({'users': out}), 200

    @app.route('/api/admin/create', methods=['POST'])
    def api_admin_create():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'admin':
            return jsonify({'error': 'forbidden'}), 403
        payload = request.get_json() or {}
        faculty_id = payload.get('faculty_id')
        name = payload.get('name')
        phone = payload.get('phone_number')
        password = payload.get('password')
        department = payload.get('department')
        role = payload.get('role')
        cl = int(payload.get('cl_balance') or 0)
        ml = int(payload.get('ml_balance') or 0)
        db = SessionLocal()
        exists = db.query(Faculty).filter_by(faculty_id=faculty_id).first()
        if exists:
            db.close()
            return jsonify({'error': 'exists'}), 400
        fac = Faculty(
            faculty_id=faculty_id,
            name=name,
            phone_number=phone,
            password_hash=hash_password(password),
            department=DepartmentEnum(department),
            role=RoleEnum(role),
            cl_balance=cl,
            ml_balance=ml,
            is_active=True,
        )
        db.add(fac)
        db.commit()
        db.close()
        return jsonify({'ok': True}), 201

    @app.route('/api/admin/create_bulk', methods=['POST'])
    def api_admin_create_bulk():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'admin':
            return jsonify({'error': 'forbidden'}), 403
        payload = request.get_json() or {}
        users = payload.get('users')
        if not isinstance(users, list) or not users:
            return jsonify({'error': 'invalid payload, expected users list'}), 400

        faculty_ids = set()
        phone_numbers = set()
        parsed_users = []
        for idx, u in enumerate(users, start=1):
            faculty_id = (u.get('faculty_id') or '').strip()
            name = (u.get('name') or '').strip()
            phone = (u.get('phone_number') or '').strip()
            password = (u.get('password') or '').strip()
            department = (u.get('department') or '').strip()
            role = (u.get('role') or '').strip()
            cl = int(u.get('cl_balance') or 0)
            ml = int(u.get('ml_balance') or 0)

            if not faculty_id or not name or not phone or not password or not department or not role:
                return jsonify({'error': f'Invalid data on row {idx}, all fields are required'}), 400
            if faculty_id in faculty_ids:
                return jsonify({'error': f'Duplicate faculty_id in upload: {faculty_id}'}), 400
            if phone in phone_numbers:
                return jsonify({'error': f'Duplicate phone_number in upload: {phone}'}), 400
            faculty_ids.add(faculty_id)
            phone_numbers.add(phone)

            if department not in [d.value for d in DepartmentEnum]:
                return jsonify({'error': f'Invalid department on row {idx}: {department}'}), 400
            if role not in [r.value for r in RoleEnum]:
                return jsonify({'error': f'Invalid role on row {idx}: {role}'}), 400

            parsed_users.append({
                'faculty_id': faculty_id,
                'name': name,
                'phone_number': phone,
                'password': password,
                'department': department,
                'role': role,
                'cl_balance': cl,
                'ml_balance': ml,
            })

        db = SessionLocal()
        existing = db.query(Faculty).filter(
            or_(Faculty.faculty_id.in_(list(faculty_ids)), Faculty.phone_number.in_(list(phone_numbers)))
        ).all()
        if existing:
            conflicts = [f.faculty_id or f.phone_number for f in existing]
            db.close()
            return jsonify({'error': f'Conflicting existing users: {conflicts}'}), 400

        created_users = []
        for u in parsed_users:
            fac = Faculty(
                faculty_id=u['faculty_id'],
                name=u['name'],
                phone_number=u['phone_number'],
                password_hash=hash_password(u['password']),
                department=DepartmentEnum(u['department']),
                role=RoleEnum(u['role']),
                cl_balance=u['cl_balance'],
                ml_balance=u['ml_balance'],
                is_active=True,
            )
            db.add(fac)
            created_users.append({
                'faculty_id': u['faculty_id'],
                'name': u['name'],
                'phone_number': u['phone_number'],
                'department': u['department'],
                'role': u['role'],
                'cl_balance': u['cl_balance'],
                'ml_balance': u['ml_balance'],
                'is_active': True,
            })

        db.commit()
        db.close()
        return jsonify({'ok': True, 'created': created_users}), 201

    @app.route('/api/admin/toggle_active', methods=['POST'])
    def api_admin_toggle_active():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'admin':
            return jsonify({'error': 'forbidden'}), 403
        payload = request.get_json() or {}
        faculty_id = payload.get('faculty_id')
        db = SessionLocal()
        fac = db.query(Faculty).filter_by(faculty_id=faculty_id).first()
        if fac:
            fac.is_active = not fac.is_active
            db.commit()
        db.close()
        return jsonify({'ok': True}), 200

    @app.route('/api/change_password', methods=['POST'])
    def api_change_password():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        payload = request.get_json() or {}
        current_password = payload.get('current_password', '')
        new_password = payload.get('new_password', '')
        confirm_password = payload.get('confirm_password', '')

        if not current_password or not new_password or not confirm_password:
            return jsonify({'error': 'All password fields are required'}), 400
        if new_password != confirm_password:
            return jsonify({'error': 'New password and confirm password do not match'}), 400
        if not verify_password(current_password, user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 400

        db = SessionLocal()
        fac = db.query(Faculty).filter_by(faculty_id=user.faculty_id).first()
        if not fac:
            db.close()
            return jsonify({'error': 'User not found'}), 404
        fac.password_hash = hash_password(new_password)
        db.commit()
        db.close()
        return jsonify({'ok': True}), 200

    @app.route('/api/admin/reset_term', methods=['POST'])
    def api_admin_reset_term():
        user = current_user_from_request()
        if not user:
            return jsonify({'error': 'unauthenticated'}), 401
        if user.role.value != 'admin':
            return jsonify({'error': 'forbidden'}), 403
        payload = request.get_json() or {}
        default_cl = int(payload.get('default_cl') or 12)
        default_ml = int(payload.get('default_ml') or 6)
        db = SessionLocal()
        all_fac = db.query(Faculty).filter(Faculty.is_active == True).all()
        for f in all_fac:
            f.cl_balance = default_cl
            f.ml_balance = default_ml
        db.commit()
        db.close()
        return jsonify({'ok': True}), 200

    def serve_react_app(path=''):
        root_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
        requested_path = os.path.join(root_dir, path)
        if path != '' and os.path.exists(requested_path):
            return send_from_directory(root_dir, path)
        return send_from_directory(root_dir, 'index.html')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def spa(path):
        return serve_react_app(path)

    return app
