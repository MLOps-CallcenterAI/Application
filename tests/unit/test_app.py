import pytest
from app import app


class TestFlaskApp:
    """Test suite for the Flask application"""

    @pytest.fixture
    def client(self):
        """Create a test client for the Flask app"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client

    def test_index_route(self, client):
        """Test the index route returns HTML page"""
        response = client.get('/')
        
        assert response.status_code == 200
        assert response.content_type == 'text/html; charset=utf-8'

    def test_index_route_content(self, client):
        """Test index route serves the main page"""
        response = client.get('/')
        
        # Check if it's serving an HTML page
        assert response.status_code == 200
        assert 'text/html' in response.content_type