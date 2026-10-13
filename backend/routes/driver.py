from flask import Blueprint, request, jsonify
from models import db, User, Ride
from datetime import datetime

driver_bp = Blueprint('driver', __name__)

@driver_bp.route('/api/driver/toggle-online', methods=['POST'])
def toggle_online():
    d = request.json
    driver = User.query.get(d['user_id'])
    driver.is_online = not driver.is_online
    if d.get('lat'):
        driver.current_lat = d['lat']
        driver.current_lng = d['lng']
    db.session.commit()
    return jsonify(driver.to_dict())

@driver_bp.route('/api/driver/nearby-rides/<int:driver_id>')
def nearby(driver_id):
    driver = User.query.get(driver_id)
    rides = Ride.query.filter_by(status='searching',
                                 vehicle_type=driver.vehicle_type)\
                      .order_by(Ride.created_at.desc()).limit(20).all()
    return jsonify([r.to_dict() for r in rides])

@driver_bp.route('/api/driver/accept/<int:ride_id>', methods=['POST'])
def accept(ride_id):
    d = request.json
    ride = Ride.query.get_or_404(ride_id)
    if ride.status != 'searching':
        return jsonify({'error': 'Already taken'}), 400
    ride.driver_id = d['driver_id']
    ride.status = 'accepted'
    db.session.commit()
    return jsonify(ride.to_dict())

@driver_bp.route('/api/driver/start/<int:ride_id>', methods=['POST'])
def start(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    if request.json['otp'] != ride.otp:
        return jsonify({'error': 'Wrong OTP'}), 400
    ride.status = 'ongoing'
    db.session.commit()
    return jsonify({'status': 'started'})

@driver_bp.route('/api/driver/end/<int:ride_id>', methods=['POST'])
def end(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    ride.status = 'completed'
    ride.final_fare = ride.estimated_fare
    ride.completed_at = datetime.utcnow()
    driver = User.query.get(ride.driver_id)
    driver.total_earnings = float(driver.total_earnings or 0) + float(ride.final_fare) * 0.8
    db.session.commit()
    return jsonify(ride.to_dict())
@driver_bp.route('/api/rides/<int:ride_id>/mark-paid', methods=['POST'])
def mark_paid(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    ride.payment_method = 'upi'
    ride.payment_status = 'paid'
    db.session.commit()
    return jsonify({'status': 'paid'})