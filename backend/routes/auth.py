from flask import Blueprint, request, jsonify, session
from models import db, User
from datetime import datetime, timedelta
import random

auth_bp = Blueprint('auth', __name__)

def send_otp_sms(phone, otp):
    print(f"📱 [DEV] OTP for {phone}: {otp}")

@auth_bp.route('/api/send-otp', methods=['POST'])
def send_otp():
    phone = request.json['phone']
    otp = str(random.randint(100000, 999999))
    user = User.query.filter_by(phone=phone).first()
    if not user:
        user = User(phone=phone)
        db.session.add(user)
    user.otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    db.session.commit()
    send_otp_sms(phone, otp)
    return jsonify({'status': 'sent', 'dev_otp': otp})

@auth_bp.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    user = User.query.filter_by(phone=data['phone']).first()
    if not user or user.otp != data['otp']:
        return jsonify({'error': 'Invalid OTP'}), 400
    if user.otp_expiry and user.otp_expiry < datetime.utcnow():
        return jsonify({'error': 'OTP expired'}), 400
    user.is_verified = True
    user.otp = None
    db.session.commit()
    session['user_id'] = user.id
    return jsonify({'user': user.to_dict()})

@auth_bp.route('/api/register-driver', methods=['POST'])
def register_driver():
    d = request.json
    user = User.query.filter_by(phone=d['phone']).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.name = d['name']
    user.role = 'driver'
    user.vehicle_type = d['vehicle_type']
    user.vehicle_number = d['vehicle_number']
    user.license_number = d['license_number']
    user.upi_id = d.get('upi_id')
    db.session.commit()
    return jsonify({'user': user.to_dict()})