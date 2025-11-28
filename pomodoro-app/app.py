from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__)

# Routes
@app.route('/')
def home():
    """Serve the main Pomodoro timer page"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files (CSS, JS, images)"""
    return send_from_directory('static', filename)

@app.route('/log_session', methods=['POST'])
def log_session():
    """Log session data to sessions.log file"""
    try:
        # Get JSON data from request
        session_data = request.get_json()
        
        if not session_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['session_type', 'action']
        for field in required_fields:
            if field not in session_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add timestamp if not provided
        if 'timestamp' not in session_data:
            session_data['timestamp'] = datetime.now().isoformat()
        
        # Log the session data
        log_session_data(session_data)
        
        return jsonify({'success': True, 'message': 'Session logged successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/sessions', methods=['GET'])
def get_sessions():
    """Optional: Get session history"""
    try:
        sessions = read_session_history()
        return jsonify(sessions)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Session logging functions
def log_session_data(session_data):
    """Write session data to sessions.log file"""
    try:
        # Ensure the log file exists
        log_file = 'sessions.log'
        
        # Read existing data or create empty list
        sessions = []
        if os.path.exists(log_file) and os.path.getsize(log_file) > 0:
            with open(log_file, 'r') as f:
                content = f.read().strip()
                if content:
                    sessions = json.loads(content)
        
        # Append new session data
        sessions.append(session_data)
        
        # Write back to file
        with open(log_file, 'w') as f:
            json.dump(sessions, f, indent=2)
            
    except Exception as e:
        print(f"Error logging session data: {e}")
        raise


def read_session_history():
    """Read session history from sessions.log file"""
    try:
        log_file = 'sessions.log'
        
        if not os.path.exists(log_file) or os.path.getsize(log_file) == 0:
            return []
        
        with open(log_file, 'r') as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
            
    except Exception as e:
        print(f"Error reading session history: {e}")
        return []

if __name__ == '__main__':
    # Create sessions.log file if it doesn't exist
    if not os.path.exists('sessions.log'):
        with open('sessions.log', 'w') as f:
            pass
    
    app.run(debug=True, host='0.0.0.0', port=5000)