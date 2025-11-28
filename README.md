# GitHub Copilot Workshop

This is a sample repository for Github Copilot Workshop in Github Universe Recap 2025, Jakarta, Indonesia.

Using the files in this repository, we are going to create a web application for Pomodoro Technique using Python, JavaScript, HTML, and CSS.

## Installation

We need to have `uv` and `venv` installed for this project.

### uv

`uv` is an extremely fast Python package and project manager, written in Rust. Open  [this link](https://docs.astral.sh/uv/#installation) for the installation information.


### venv

`venv` is a module included with Python (version 3.3 and later) used to create isolated Python virtual environments.

After `uv` is available on your system, install `venv` to create a virtual environment for this work project. Go to the root of your project and run this command:
```bash
uv venv
```

Then, activate virtual environment:
```bash
source .venv/bin/activate
```

Note: to deactivate virtual environment:
```bash
deactivate
```

## Installation of Dependencies

After activating the virtual environment, install the project dependencies:

```bash
uv pip install -r pomodoro-app/requirements.txt
```

## Running the Application

Navigate to the `pomodoro-app` directory and run:

```bash
cd pomodoro-app
python app.py
```

The application will be available at `http://localhost:5000`.

## Running Unit Tests

This project includes comprehensive unit tests for all major functions. The tests are located in the `pomodoro-app/tests/` directory and use pytest as the testing framework.

### Prerequisites

Make sure you have the testing dependencies installed (they should be included if you ran the installation command above):
- pytest
- pytest-flask
- pytest-cov

### Running Tests

To run all tests:

```bash
cd pomodoro-app
python -m pytest
```

To run tests with verbose output:

```bash
cd pomodoro-app
python -m pytest -v
```

To run tests with coverage report:

```bash
cd pomodoro-app
python -m pytest --cov=. --cov-report=html
```

This will generate an HTML coverage report in the `htmlcov/` directory.

### Running Specific Tests

To run tests for specific modules:

```bash
# Test Flask routes only
cd pomodoro-app
python -m pytest tests/test_app.py -v

# Test session logging functions only
cd pomodoro-app
python -m pytest tests/test_session_logging.py -v
```

### Test Structure

The test suite includes:

- **`tests/test_app.py`**: Tests for Flask routes and endpoints
  - Home route testing
  - Session logging endpoint testing
  - Session retrieval endpoint testing
  - Error handling and validation testing

- **`tests/test_session_logging.py`**: Tests for session logging utility functions
  - File I/O operations testing
  - JSON handling testing
  - Error handling testing
  - Integration testing

### Understanding Test Results

Tests will show:
- ✅ **PASSED**: Test executed successfully
- ❌ **FAILED**: Test failed with error details
- **Coverage percentage**: Shows how much of your code is tested

All tests should pass on a fresh installation. If tests fail, check:
1. Virtual environment is activated
2. All dependencies are installed
3. You're running from the correct directory (`pomodoro-app/`)
```