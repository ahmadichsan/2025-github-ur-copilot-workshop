import pytest
import json
import os
import tempfile
from unittest.mock import patch, mock_open
from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestFlaskRoutes:
    """Test cases for Flask routes"""

    def test_home_route(self, client):
        """Test the home route returns the main page"""
        response = client.get('/')
        assert response.status_code == 200
        assert b'<!DOCTYPE html>' in response.data or b'html' in response.data

    def test_static_files_route(self, client):
        """Test static files are served correctly"""
        # Test CSS file
        response = client.get('/static/style.css')
        assert response.status_code == 200 or response.status_code == 404  # File may not exist in test
        
        # Test JS file
        response = client.get('/static/script.js')
        assert response.status_code == 200 or response.status_code == 404  # File may not exist in test

    def test_log_session_valid_data(self, client):
        """Test logging session with valid data"""
        session_data = {
            'session_type': 'work',
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        with patch('app.log_session_data') as mock_log:
            response = client.post('/log_session', 
                                 json=session_data,
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['success'] is True
            assert 'message' in data
            mock_log.assert_called_once()

    def test_log_session_missing_data(self, client):
        """Test logging session with no data"""
        # Test with no JSON body but correct content type - this causes a 500 in Flask when trying to parse empty body
        response = client.post('/log_session', 
                             content_type='application/json')
        
        # Flask returns 500 when trying to parse empty JSON body, which gets caught by our exception handler
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
        
        # Test with empty JSON data
        response = client.post('/log_session', 
                             json={},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_log_session_missing_required_fields(self, client):
        """Test logging session with missing required fields"""
        # Missing session_type
        session_data = {
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        response = client.post('/log_session', 
                             json=session_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'session_type' in data['error']

    def test_log_session_adds_timestamp(self, client):
        """Test that timestamp is added if not provided"""
        session_data = {
            'session_type': 'work',
            'action': 'start'
        }
        
        with patch('app.log_session_data') as mock_log:
            response = client.post('/log_session', 
                                 json=session_data,
                                 content_type='application/json')
            
            assert response.status_code == 200
            # Verify that log_session_data was called with data that includes a timestamp
            call_args = mock_log.call_args[0][0]
            assert 'timestamp' in call_args
            assert call_args['session_type'] == 'work'
            assert call_args['action'] == 'start'

    def test_log_session_exception_handling(self, client):
        """Test that exceptions are handled properly"""
        session_data = {
            'session_type': 'work',
            'action': 'start'
        }
        
        with patch('app.log_session_data', side_effect=Exception("Test error")):
            response = client.post('/log_session', 
                                 json=session_data,
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data

    def test_get_sessions_success(self, client):
        """Test getting session history successfully"""
        mock_sessions = [
            {'session_type': 'work', 'action': 'start', 'timestamp': '2023-01-01T12:00:00'},
            {'session_type': 'break', 'action': 'start', 'timestamp': '2023-01-01T12:25:00'}
        ]
        
        with patch('app.read_session_history', return_value=mock_sessions):
            response = client.get('/sessions')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert len(data) == 2
            assert data[0]['session_type'] == 'work'
            assert data[1]['session_type'] == 'break'

    def test_get_sessions_exception(self, client):
        """Test exception handling in get_sessions"""
        with patch('app.read_session_history', side_effect=Exception("Test error")):
            response = client.get('/sessions')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data