from app import repository


def test_set_feedback_up(client):
    conn = client.app.state.conn
    conversation_id = repository.create_conversation(conn, "Feedback test", 1)
    message_id = repository.add_message(conn, conversation_id, "assistant", "An answer")

    response = client.post(f"/api/messages/{message_id}/feedback", json={"rating": "up"})
    assert response.status_code == 200
    assert response.json() == {"id": message_id, "feedback": "up"}

    messages = repository.list_messages(conn, conversation_id)
    assert messages[0]["feedback"] == "up"


def test_set_feedback_invalid_rating_rejected(client):
    conn = client.app.state.conn
    conversation_id = repository.create_conversation(conn, "Feedback test", 1)
    message_id = repository.add_message(conn, conversation_id, "assistant", "An answer")

    response = client.post(f"/api/messages/{message_id}/feedback", json={"rating": "sideways"})
    assert response.status_code == 422


def test_set_feedback_missing_message_404(client):
    response = client.post("/api/messages/999/feedback", json={"rating": "down"})
    assert response.status_code == 404
