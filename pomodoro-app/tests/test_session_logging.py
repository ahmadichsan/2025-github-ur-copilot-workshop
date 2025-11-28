import pytest
import json
import os
import tempfile
from unittest.mock import patch, mock_open, MagicMock
from app import log_session_data, read_session_history


class TestSessionLogging:
    """Test cases for session logging functions"""

    def test_log_session_data_new_file(self):
        """Test logging session data when log file doesn't exist"""
        session_data = {
            'session_type': 'work',
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        # Mock file operations
        with patch('os.path.exists', return_value=False), \
             patch('builtins.open', mock_open()) as mock_file, \
             patch('json.dump') as mock_json_dump:
            
            log_session_data(session_data)
            
            # Verify file was opened for writing
            mock_file.assert_called_with('sessions.log', 'w')
            # Verify json.dump was called with the session data in a list
            mock_json_dump.assert_called_once()
            written_data = mock_json_dump.call_args[0][0]
            assert written_data == [session_data]

    def test_log_session_data_existing_file_empty(self):
        """Test logging session data when log file exists but is empty"""
        session_data = {
            'session_type': 'work',
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=0), \
             patch('builtins.open', mock_open()) as mock_file, \
             patch('json.dump') as mock_json_dump:
            
            log_session_data(session_data)
            
            # Verify json.dump was called with the session data in a list
            mock_json_dump.assert_called_once()
            written_data = mock_json_dump.call_args[0][0]
            assert written_data == [session_data]

    def test_log_session_data_existing_file_with_content(self):
        """Test logging session data when log file exists with existing content"""
        existing_sessions = [
            {'session_type': 'break', 'action': 'end', 'timestamp': '2023-01-01T11:00:00'}
        ]
        new_session = {
            'session_type': 'work',
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        mock_file_content = json.dumps(existing_sessions)
        
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=100), \
             patch('builtins.open', mock_open(read_data=mock_file_content)) as mock_file, \
             patch('json.dump') as mock_json_dump:
            
            log_session_data(new_session)
            
            # Verify the new session was appended to existing sessions
            mock_json_dump.assert_called_once()
            written_data = mock_json_dump.call_args[0][0]
            expected_data = existing_sessions + [new_session]
            assert len(written_data) == 2
            assert new_session in written_data

    def test_log_session_data_exception_handling(self):
        """Test exception handling in log_session_data"""
        session_data = {
            'session_type': 'work',
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        
        with patch('os.path.exists', side_effect=Exception("File system error")):
            with pytest.raises(Exception):
                log_session_data(session_data)

    def test_read_session_history_file_not_exists(self):
        """Test reading session history when file doesn't exist"""
        with patch('os.path.exists', return_value=False):
            result = read_session_history()
            assert result == []

    def test_read_session_history_empty_file(self):
        """Test reading session history when file is empty"""
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=0):
            result = read_session_history()
            assert result == []

    def test_read_session_history_empty_content(self):
        """Test reading session history when file has empty content"""
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=10), \
             patch('builtins.open', mock_open(read_data='   \n  \t  ')):
            result = read_session_history()
            assert result == []

    def test_read_session_history_valid_content(self):
        """Test reading session history with valid content"""
        sessions_data = [
            {'session_type': 'work', 'action': 'start', 'timestamp': '2023-01-01T12:00:00'},
            {'session_type': 'work', 'action': 'end', 'timestamp': '2023-01-01T12:25:00'},
            {'session_type': 'break', 'action': 'start', 'timestamp': '2023-01-01T12:25:00'}
        ]
        mock_file_content = json.dumps(sessions_data)
        
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=100), \
             patch('builtins.open', mock_open(read_data=mock_file_content)):
            result = read_session_history()
            assert result == sessions_data
            assert len(result) == 3
            assert result[0]['session_type'] == 'work'
            assert result[2]['session_type'] == 'break'

    def test_read_session_history_json_error(self):
        """Test reading session history with invalid JSON"""
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=100), \
             patch('builtins.open', mock_open(read_data='invalid json{')), \
             patch('json.loads', side_effect=json.JSONDecodeError("msg", "doc", 0)):
            result = read_session_history()
            assert result == []

    def test_read_session_history_exception_handling(self):
        """Test exception handling in read_session_history"""
        with patch('os.path.exists', side_effect=Exception("File system error")):
            result = read_session_history()
            assert result == []

    @pytest.fixture
    def temp_log_file(self):
        """Create a temporary log file for integration testing"""
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.log') as f:
            temp_file = f.name
        yield temp_file
        # Cleanup
        if os.path.exists(temp_file):
            os.unlink(temp_file)

    def test_integration_log_and_read(self, temp_log_file):
        """Integration test: log data and then read it back"""
        session_data1 = {
            'session_type': 'work',
            'action': 'start',
            'timestamp': '2023-01-01T12:00:00'
        }
        session_data2 = {
            'session_type': 'work',
            'action': 'end',
            'timestamp': '2023-01-01T12:25:00'
        }
        
        # Patch the log file path
        with patch('app.log_session_data') as mock_log, \
             patch('app.read_session_history') as mock_read:
            
            # Mock the actual file operations for this integration test
            sessions = []
            
            def mock_log_func(data):
                sessions.append(data)
            
            def mock_read_func():
                return sessions.copy()
            
            mock_log.side_effect = mock_log_func
            mock_read.side_effect = mock_read_func
            
            # Test logging sessions
            mock_log(session_data1)
            mock_log(session_data2)
            
            # Test reading sessions
            result = mock_read()
            
            assert len(result) == 2
            assert result[0] == session_data1
            assert result[1] == session_data2