from flask import Blueprint, request, jsonify, send_file
from models import db, Ride, User, PaymentQR
import qrcode, os

qr_bp = Blueprint('qr', __name__)

@qr_bp.route('/api/qr/generate/<int:ride_id>', methods=['POST'])
def generate_qr(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    driver = User.query.get(ride.driver_id) if ride.driver_id else None
    amount = float(ride.final_fare or ride.estimated_fare or 0)
    upi_id = (driver.upi_id if driver and driver.upi_id else 'driver@upi')
    name = (driver.name if driver else 'Driver')
    upi_link = f"upi://pay?pa={upi_id}&pn={name}&am={amount}&cu=INR&tn=Rapido Ride {ride.id}"

    os.makedirs('uploads/qr_codes', exist_ok=True)
    qr_path = f'uploads/qr_codes/ride_{ride_id}.png'
    qrcode.make(upi_link).save(qr_path)

    qr = PaymentQR(ride_id=ride.id, amount=amount,
                   upi_link=upi_link, qr_path=qr_path)
    db.session.add(qr)
    db.session.commit()

    return jsonify({
        'qr_url': f'/api/qr/image/{ride_id}',
        'upi_link': upi_link,
        'amount': amount,
        'qr_id': qr.id
    })

@qr_bp.route('/api/qr/image/<int:ride_id>')
def qr_image(ride_id):
    return send_file(f'uploads/qr_codes/ride_{ride_id}.png', mimetype='image/png')

@qr_bp.route('/api/qr/verify', methods=['POST'])
def verify_qr():
    qr = PaymentQR.query.get(request.json['qr_id'])
    qr.is_paid = True
    ride = Ride.query.get(qr.ride_id)
    ride.payment_method = 'upi'
    ride.payment_status = 'paid'
    db.session.commit()
    return jsonify({'status': 'verified'})
@qr_bp.route('/api/qr/driver-ride/<int:ride_id>', methods=['POST'])
def driver_ride_qr(ride_id):
    """Generates a UPI QR from driver's ID for the customer to scan."""
    ride = Ride.query.get_or_404(ride_id)
    driver = User.query.get(ride.driver_id) if ride.driver_id else None
    if not driver:
        return jsonify({'error': 'No driver assigned'}), 400

    amount = float(ride.final_fare or ride.estimated_fare or 0)
    upi_id = driver.upi_id or f"{driver.phone}@upi"
    name = driver.name or 'Rapido Driver'
    note = f"Rapido Ride #{ride.id}"

    # UPI deep link (used by PhonePe/GPay/Paytm/BHIM)
    upi_link = (
        f"upi://pay?"
        f"pa={upi_id}"
        f"&pn={name.replace(' ', '%20')}"
        f"&am={amount}"
        f"&cu=INR"
        f"&tn={note.replace(' ', '%20')}"
    )

    os.makedirs('uploads/qr_codes', exist_ok=True)
    qr_path = f'uploads/qr_codes/driver_ride_{ride_id}.png'

    # Generate QR with high error correction (better for phone screens)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_link)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(qr_path)

    return jsonify({
        'qr_url': f'/api/qr/driver-image/{ride_id}',
        'upi_link': upi_link,
        'amount': amount,
        'upi_id': upi_id,
        'payee_name': name,
        'ride_id': ride.id
    })


@qr_bp.route('/api/qr/driver-image/<int:ride_id>')
def driver_qr_image(ride_id):
    return send_file(f'uploads/qr_codes/driver_ride_{ride_id}.png', mimetype='image/png')