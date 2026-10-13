from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from sockets.tracking import socketio, init_socket
from routes.auth import auth_bp
from routes.customer import customer_bp
from routes.driver import driver_bp
from routes.wallet import wallet_bp
from routes.qr_payment import qr_bp
from routes.sharing import share_bp
import os

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

db.init_app(app)
init_socket(app)
socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')

app.register_blueprint(auth_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(driver_bp)
app.register_blueprint(wallet_bp)
app.register_blueprint(qr_bp)
app.register_blueprint(share_bp)


@app.route('/')
def root():
    return {'status': 'Rapido API running ✅', 'db': 'MySQL connected'}


@app.route('/uploads/qr_codes/<path:f>')
def qr_files(f):
    return send_from_directory('uploads/qr_codes', f)


@app.route('/api/health')
def health():
    try:
        db.session.execute(db.text('SELECT 1'))
        return {'db': 'ok', 'msg': 'MySQL connected'}
    except Exception as e:
        return {'db': 'error', 'msg': str(e)}, 500


if __name__ == '__main__':
    os.makedirs('uploads/qr_codes', exist_ok=True)
    with app.app_context():
        # Don't call create_all() — you already created tables in Workbench
        pass
    print("\n🚀 Backend running: http://localhost:5000")
    print("📊 Database: rapido_db (MySQL)")
    print("🌐 Frontend should be on: http://localhost:3000\n")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)