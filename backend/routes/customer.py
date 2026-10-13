from flask import Blueprint, request, jsonify
from models import db, User, Ride
from math import radians, sin, cos, sqrt, atan2
import random

customer_bp = Blueprint('customer', __name__)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = radians(lat2-lat1), radians(lon2-lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1-a))

def calc_fare(distance, vtype):
    rates = {'auto': (30, 12), 'bike': (15, 7), 'cab': (50, 15)}
    base, per_km = rates.get(vtype, rates['auto'])
    return round(base + distance * per_km, 2)

@customer_bp.route('/api/estimate', methods=['POST'])
def estimate():
    d = request.json
    dist = haversine(d['pickup_lat'], d['pickup_lng'],
                     d['dropoff_lat'], d['dropoff_lng'])
    return jsonify({
        'distance_km': round(dist, 2),
        'auto': calc_fare(dist, 'auto'),
        'bike': calc_fare(dist, 'bike'),
        'cab': calc_fare(dist, 'cab')
    })

@customer_bp.route('/api/rides/book', methods=['POST'])
def book_ride():
    d = request.json
    dist = haversine(d['pickup_lat'], d['pickup_lng'],
                     d['dropoff_lat'], d['dropoff_lng'])
    fare = calc_fare(dist, d['vehicle_type'])
    ride = Ride(
        customer_id=d['user_id'],
        pickup=d['pickup'], dropoff=d['dropoff'],
        pickup_lat=d['pickup_lat'], pickup_lng=d['pickup_lng'],
        dropoff_lat=d['dropoff_lat'], dropoff_lng=d['dropoff_lng'],
        distance_km=round(dist, 2),
        estimated_fare=fare,
        vehicle_type=d['vehicle_type'],
        otp=str(random.randint(1000, 9999)),
        status='searching'
    )
    db.session.add(ride)
    db.session.commit()
    return jsonify(ride.to_dict())

@customer_bp.route('/api/rides/<int:ride_id>')
def get_ride(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    return jsonify(ride.to_dict())

@customer_bp.route('/api/rides/<int:ride_id>/cancel', methods=['POST'])
def cancel_ride(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    ride.status = 'cancelled'
    db.session.commit()
    return jsonify({'status': 'cancelled'})

@customer_bp.route('/api/rides/history/<int:user_id>')
def history(user_id):
    rides = Ride.query.filter_by(customer_id=user_id)\
                      .order_by(Ride.created_at.desc()).limit(20).all()
    return jsonify([r.to_dict() for r in rides])