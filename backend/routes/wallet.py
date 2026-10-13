from flask import Blueprint, request, jsonify
from models import db, User, WalletTransaction, Ride
import uuid

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/api/wallet/<int:user_id>')
def get_wallet(user_id):
    user = User.query.get(user_id)
    txns = WalletTransaction.query.filter_by(user_id=user_id)\
                                  .order_by(WalletTransaction.created_at.desc())\
                                  .limit(30).all()
    return jsonify({
        'balance': float(user.wallet_balance or 0),
        'transactions': [{
            'id': t.id, 'amount': float(t.amount), 'type': t.type,
            'method': t.method, 'description': t.description,
            'date': t.created_at.isoformat()
        } for t in txns]
    })

@wallet_bp.route('/api/wallet/add-money', methods=['POST'])
def add_money():
    d = request.json
    user = User.query.get(d['user_id'])
    amount = float(d['amount'])
    user.wallet_balance = float(user.wallet_balance or 0) + amount
    txn = WalletTransaction(
        user_id=user.id, amount=amount, type='credit',
        method=d.get('method', 'upi'),
        reference=d.get('reference', str(uuid.uuid4())),
        description='Wallet top-up'
    )
    db.session.add(txn)
    db.session.commit()
    return jsonify({'new_balance': float(user.wallet_balance), 'txn_id': txn.id})

@wallet_bp.route('/api/wallet/pay-ride', methods=['POST'])
def pay_ride():
    d = request.json
    ride = Ride.query.get(d['ride_id'])
    user = User.query.get(ride.customer_id)
    amount = float(ride.final_fare or ride.estimated_fare)
    if float(user.wallet_balance or 0) < amount:
        return jsonify({'error': 'Insufficient balance'}), 400
    user.wallet_balance = float(user.wallet_balance) - amount
    ride.payment_method = 'wallet'
    ride.payment_status = 'paid'
    txn = WalletTransaction(
        user_id=user.id, amount=amount, type='debit',
        method='wallet', reference=f'ride_{ride.id}',
        description=f'Ride #{ride.id} payment'
    )
    db.session.add(txn)
    db.session.commit()
    return jsonify({'status': 'paid', 'new_balance': float(user.wallet_balance)})