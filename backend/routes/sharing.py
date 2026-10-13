from flask import Blueprint, request, jsonify
from models import db, Ride, ShareRequest
from math import radians, sin, cos, sqrt, atan2
import uuid

share_bp = Blueprint('share', __name__)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = radians(lat2-lat1), radians(lon2-lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1-a))

@share_bp.route('/api/share/enable/<int:ride_id>', methods=['POST'])
def enable(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    ride.is_shared = True
    ride.share_code = str(uuid.uuid4())[:6].upper()
    db.session.commit()
    fare = float(ride.estimated_fare or 0)
    return jsonify({
        'share_code': ride.share_code,
        'splits': {
            '2': round(fare/2, 2),
            '3': round(fare/3, 2),
            '4': round(fare/4, 2)
        }
    })

@share_bp.route('/api/share/find-matches', methods=['POST'])
def find():
    d = request.json
    rides = Ride.query.filter(Ride.is_shared == True,
                              Ride.status.in_(['searching','accepted','ongoing'])).all()
    out = []
    for r in rides:
        pd = haversine(float(r.pickup_lat), float(r.pickup_lng),
                       d['pickup_lat'], d['pickup_lng'])
        dd = haversine(float(r.dropoff_lat), float(r.dropoff_lng),
                       d['dropoff_lat'], d['dropoff_lng'])
        if pd < 2 and dd < 2:
            out.append({
                'ride_id': r.id, 'pickup': r.pickup, 'dropoff': r.dropoff,
                'total_fare': float(r.estimated_fare or 0),
                'your_share': round(float(r.estimated_fare or 0)/2, 2),
                'share_code': r.share_code
            })
    return jsonify({'matches': out})

@share_bp.route('/api/share/join', methods=['POST'])
def join():
    d = request.json
    ride = Ride.query.filter_by(share_code=d['share_code']).first()
    if not ride:
        return jsonify({'error': 'Invalid code'}), 404
    req = ShareRequest(ride_id=ride.id, joiner_id=d['user_id'],
                       joiner_lat=d['lat'], joiner_lng=d['lng'])
    db.session.add(req)
    db.session.commit()
    return jsonify({'request_id': req.id, 'status': 'pending'})

@share_bp.route('/api/share/respond', methods=['POST'])
def respond():
    d = request.json
    req = ShareRequest.query.get(d['request_id'])
    req.status = d['status']
    db.session.commit()
    if d['status'] == 'accepted':
        ride = Ride.query.get(req.ride_id)
        acc = ShareRequest.query.filter_by(ride_id=ride.id, status='accepted').count()
        total = acc + 1
        per_head = round(float(ride.estimated_fare or 0) / total, 2)
        return jsonify({'total_riders': total, 'per_person': per_head})
    return jsonify({'status': 'ok'})