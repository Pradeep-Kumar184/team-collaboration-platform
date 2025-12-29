import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { messageAPI } from "../services/api";
import socketService from "../services/socket";
import ChatMessage from "../components/ChatMessage";

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages from API
  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      console.log('Fetching messages for user:', user);
      const response = await messageAPI.getAll();
      console.log('Messages response:', response);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Set up Socket.IO listeners for real-time messages
      const handleNewMessage = (message) => {
        console.log('Received real-time message:', message);
        // Only add message if it's not from the current user (to avoid duplicates)
        if (message.senderId?._id !== user?._id && message.senderId?.email !== user?.email) {
          setMessages((prev) => [...prev, message]);
        }
      };

      socketService.onMessageReceived(handleNewMessage);

      // Cleanup on unmount
      return () => {
        socketService.offMessageReceived(handleNewMessage);
      };
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError("");

    const messageData = {
      content: newMessage.trim(),
    };

    try {
      console.log('Sending message:', messageData);
      const response = await messageAPI.send(messageData);
      console.log('Message sent response:', response);
      
      if (response.success) {
        // Add the new message to the list
        setMessages((prev) => [...prev, response.data]);
        setNewMessage("");
      } else {
        setError(response.error || "Failed to send message");
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.response?.data?.error || err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-4">
        <h1>Team Chat</h1>
        <p className="text-muted">Real-time communication with your team</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      <Card className="shadow-sm" style={{ height: "600px" }}>
        <Card.Header>
          <strong>Team Discussion</strong>
          <small className="text-muted ms-2">({messages.length} messages)</small>
        </Card.Header>
        
        <Card.Body
          className="d-flex flex-column"
          style={{ height: "100%", overflow: "hidden" }}
        >
          {/* Messages Area */}
          <div
            className="flex-grow-1 mb-3"
            style={{
              overflowY: "auto",
              maxHeight: "450px",
              border: "1px solid #dee2e6",
              borderRadius: "0.375rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message._id}
                  message={message}
                  isOwn={message.senderId?._id === user?._id || message.senderId?.email === user?.email}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <Form onSubmit={handleSendMessage}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                maxLength={1000}
              />
              <Button
                variant="primary"
                type="submit"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              Press Enter to send • {newMessage.length}/1000 characters
            </Form.Text>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Chat;