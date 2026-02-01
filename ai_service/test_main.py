import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def mock_llm():
    with patch('main.llm') as mock:
        yield mock

def test_prioritize_vulnerability_success(mock_llm):
    # Mock the LLM response
    mock_llm.return_value = {
        'choices': [{
            'text': '''{
  "new_priority": "Critical",
  "justification": "This is a mocked critical vulnerability."
}'''
        }]
    }

    # Make a request to the endpoint
    response = client.post("/prioritize", json={
        "description": "Test SQL Injection",
        "severity": "High",
        "cwe": "CWE-89"
    })

    # Assert the response
    assert response.status_code == 200
    assert response.json() == {
        "new_priority": "Critical",
        "justification": "This is a mocked critical vulnerability."
    }

def test_prioritize_vulnerability_llm_not_loaded():
    with patch('main.llm', None):
        response = client.post("/prioritize", json={
            "description": "Test SQL Injection",
            "severity": "High",
            "cwe": "CWE-89"
        })
        assert response.status_code == 500
        assert response.json() == {"error": "LLM model not loaded"}

def test_prioritize_vulnerability_invalid_json_from_llm(mock_llm):
    # Mock the LLM response with invalid JSON
    mock_llm.return_value = {
        'choices': [{
            'text': 'This is not JSON'
        }]
    }

    response = client.post("/prioritize", json={
        "description": "Test invalid JSON",
        "severity": "Medium"
    })

    assert response.status_code == 500
    assert "error" in response.json()
    assert response.json()["error"] == "Failed to parse JSON from LLM response"
