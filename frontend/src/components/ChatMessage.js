import React from "react";
import { Card } from "react-bootstrap";

const ChatMessage = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`mb-3 d-flex ${isOwn ? "justify-content-end" : "justify-content-start"}`}>
      <Card
        className={`shadow-sm ${isOwn ? "bg-primary text-white" : "bg-light"}`}
        style={{ maxWidth: "70%" }}
      >
        <Card.Body className="py-2 px-3">
          {!isOwn && (
            <div className="small mb-1">
              <strong className={isOwn ? "text-white" : "text-primary"}>
                {message.senderId?.name || "Unknown User"}
              </strong>
            </div>
          )}
          <div className="mb-1">{message.content}</div>
          <div className={`small ${isOwn ? "text-white-50" : "text-muted"}`}>
            {formatTime(message.timestamp)}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ChatMessage;