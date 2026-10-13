from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(120))
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(20), default='customer')
    wallet_balance = db.Column(db.Numeric(10, 2), default=0.00)
    otp = db.Column(db.String(6))
    otp_expiry = db.Column(db.DateTime)
    is_verified = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Numeric(3, 2), default=5.00)
    upi_id = db.Column(db.String(100))
    vehicle_type = db.Column(db.String(20))
    vehicle_number = db.Column(db.String(20))
    license_number = db.Column(db.String(50))
    is_online = db.Column(db.Boolean, default=False)
    current_lat = db.Column(db.Numeric(10, 7))
    current_lng = db.Column(db.Numeric(10, 7))
    total_earnings = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'phone': self.phone,
            'role': self.role, 'wallet': float(self.wallet_balance or 0),
            'rating': float(self.rating or 5),
            'upi_id': self.upi_id,
            'vehicle_type': self.vehicle_type,
            'vehicle_number': self.vehicle_number,
            'is_online': self.is_online,
            'total_earnings': float(self.total_earnings or 0)
        }


class Ride(db.Model):
    __tablename__ = 'rides'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    pickup = db.Column(db.String(200))
    dropoff = db.Column(db.String(200))
    pickup_lat = db.Column(db.Numeric(10, 7))
    pickup_lng = db.Column(db.Numeric(10, 7))
    dropoff_lat = db.Column(db.Numeric(10, 7))
    dropoff_lng = db.Column(db.Numeric(10, 7))
    distance_km = db.Column(db.Numeric(6, 2))
    estimated_fare = db.Column(db.Numeric(10, 2))
    final_fare = db.Column(db.Numeric(10, 2))
    vehicle_type = db.Column(db.String(20))
    status = db.Column(db.String(30), default='searching')
    otp = db.Column(db.String(4))
    is_shared = db.Column(db.Boolean, default=False)
    share_code = db.Column(db.String(10), unique=True)
    payment_method = db.Column(db.String(20))
    payment_status = db.Column(db.String(20), default='pending')
    driver_lat = db.Column(db.Numeric(10, 7))
    driver_lng = db.Column(db.Numeric(10, 7))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        driver = User.query.get(self.driver_id) if self.driver_id else None
        return {
            'id': self.id,
            'status': self.status,
            'pickup': self.pickup, 'dropoff': self.dropoff,
            'pickup_lat': float(self.pickup_lat) if self.pickup_lat else None,
            'pickup_lng': float(self.pickup_lng) if self.pickup_lng else None,
            'dropoff_lat': float(self.dropoff_lat) if self.dropoff_lat else None,
            'dropoff_lng': float(self.dropoff_lng) if self.dropoff_lng else None,
            'distance_km': float(self.distance_km or 0),
            'fare': float(self.final_fare or self.estimated_fare or 0),
            'estimated_fare': float(self.estimated_fare or 0),
            'vehicle_type': self.vehicle_type,
            'otp': self.otp,
            'is_shared': self.is_shared,
            'share_code': self.share_code,
            'payment_status': self.payment_status,
            'driver_lat': float(self.driver_lat) if self.driver_lat else None,
            'driver_lng': float(self.driver_lng) if self.driver_lng else None,
            'driver': {
                'id': driver.id, 'name': driver.name,
                'phone': driver.phone,
                'vehicle': driver.vehicle_number,
                'rating': float(driver.rating or 5)
            } if driver else None
        }


class ShareRequest(db.Model):
    __tablename__ = 'share_requests'
    id = db.Column(db.Integer, primary_key=True)
    ride_id = db.Column(db.Integer, db.ForeignKey('rides.id'))
    joiner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    joiner_lat = db.Column(db.Numeric(10, 7))
    joiner_lng = db.Column(db.Numeric(10, 7))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    amount = db.Column(db.Numeric(10, 2))
    type = db.Column(db.String(20))
    method = db.Column(db.String(20))
    status = db.Column(db.String(20), default='success')
    reference = db.Column(db.String(100))
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PaymentQR(db.Model):
    __tablename__ = 'payment_qr'
    id = db.Column(db.Integer, primary_key=True)
    ride_id = db.Column(db.Integer, db.ForeignKey('rides.id'))
    amount = db.Column(db.Numeric(10, 2))
    upi_link = db.Column(db.String(500))
    qr_path = db.Column(db.String(200))
    is_paid = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)