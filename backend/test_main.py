from fastapi.testclient import TestClient
from main import app, ChatResponse
import pytest
from unittest.mock import patch

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


# Mock the Mistral client for chat tests
class MockMistralClient:
    def __init__(self):
        self.chat = self

    def complete(self, model, messages, tools=None, tool_choice=None):
        # Simulate a successful response
        class MockMessage:
            def __init__(self, content, tool_calls=None):
                self.content = content
                self.tool_calls = tool_calls

        class MockChoice:
            def __init__(self, message):
                self.message = message

        if "tool_call_test" in messages[0]["content"]:
            # Simulate a tool call response
            mock_tool_call = type('obj', (object,), {'function': type('obj', (object,), {'name': 'execute_command', 'arguments': '{"command": "ls -l"}'})})()
            return type('obj', (object,), {'choices': [MockChoice(MockMessage("Tool call simulated.", tool_calls=[mock_tool_call]))]})()
        
        return type('obj', (object,), {'choices': [MockChoice(MockMessage("Mock AI response"))]})()


# Mock the Scrapybara client for chat tests
class MockScrapybaraClient:
    def __init__(self):
        pass

    def start_ubuntu(self):
        # Simulate a successful session start
        class MockSession:
            def execute_command(self, command):
                return f"Executed: {command}"

            def close(self):
                pass

        return MockSession()


@patch('main.mistral_client', new=MockMistralClient())
@patch('main.scrapybara_client', new=MockScrapybaraClient())
def test_chat_endpoint_no_tools():
    response = client.post("/chat", json={"message": "Hello AI", "mode": "chat"})
    assert response.status_code == 200
    assert response.json()["response"] == "Mock AI response"
    assert response.json()["tools_used"] == []


@patch('main.mistral_client', new=MockMistralClient())
@patch('main.scrapybara_client', new=MockScrapybaraClient())
def test_chat_endpoint_with_tool_call():
    response = client.post("/chat", json={"message": "tool_call_test", "mode": "cua"})
    assert response.status_code == 200
    assert response.json()["response"] == "Tool call simulated."
    assert len(response.json()["tools_used"]) == 1
    assert response.json()["tools_used"][0]["name"] == "execute_command"
    assert response.json()["tools_used"][0]["args"] == {"command": "ls -l"}
    assert response.json()["desktop_actions"][0]["result"] == "Executed: ls -l"