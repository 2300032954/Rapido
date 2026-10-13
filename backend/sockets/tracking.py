from flask_socketio import SocketIO, emit, join_room
from models import db, User, Ride

socketio = SocketIO(async_mode='threading')

def init_socket(app):
    socketio.init_app(app)

@socketio.on('join_tracking')
def join(data):
    join_room(f"ride_{data['ride_id']}")
    emit('joined', {'ride_id': data['ride_id']})

@socketio.on('driver_location_update')
def driver_loc(data):
    ride = Ride.query.get(data['ride_id'])
    if ride:
        ride.driver_lat = data['lat']
        ride.driver_lng = data['lng']
        db.session.commit()
    emit('location_update', {'lat': data['lat'], 'lng': data['lng']},
         room=f"ride_{data['ride_id']}")

@socketio.on('customer_location_update')
def customer_loc(data):
    emit('customer_location', {'lat': data['lat'], 'lng': data['lng']},
         room=f"ride_{data['ride_id']}")

@socketio.on('ride_status_change')
def status_change(data):
    ride = Ride.query.get(data['ride_id'])
    ride.status = data['status']
    db.session.commit()
    emit('status_changed', {'status': data['status']},
         room=f"ride_{data['ride_id']}")