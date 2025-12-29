import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { invitationAPI } from "../services/api";

const JoinTeam = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (code) {
      validateInvitation();
    }
  }, [code]);

  const validateInvitation = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await invitationAPI.validate(code);
      setInvitation(response.data);
    } catch (err) {
      setError(err.error || "Invalid or expired invitation code");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!user) {
      setError("Please log in first to join the team");
      return;
    }

    setJoining(true);
    setError("");
    try {
      const response = await invitationAPI.use(code, user.email);
      if (response.success) {
        setSuccess("Successfully joined the team! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
          window.location.reload(); // Refresh to update user context
        }, 2000);
      }
    } catch (err) {
      setError(err.error || "Failed to join team");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Validating invitation...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card className="shadow">
            <Card.Header className="text-center">
              <h4>Team Invitation</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {invitation ? (
                <div>
                  <div className="text-center mb-4">
                    <h5>You're invited to join:</h5>
                    <h3 className="text-primary">{invitation.teamName}</h3>
                    {invitation.teamDescription && (
                      <p className="text-muted">{invitation.teamDescription}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span><strong>Your Role:</strong></span>
                      <Badge bg={
                        invitation.role === "ADMIN" ? "danger" :
                        invitation.role === "MANAGER" ? "warning" : "secondary"
                      }>
                        {invitation.role}
                      </Badge>
                    </div>
                    
                    {invitation.email && (
                      <div className="d-flex justify-content-between align-items-center">
                        <span><strong>Invited Email:</strong></span>
                        <span>{invitation.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <h6>Role Permissions:</h6>
                    <ul className="small text-muted">
                      {invitation.role === "ADMIN" && (
                        <>
                          <li>Full access to all features</li>
                          <li>Manage team members and roles</li>
                          <li>Create and manage projects</li>
                          <li>Create and assign tasks</li>
                          <li>Access team chat</li>
                        </>
                      )}
                      {invitation.role === "MANAGER" && (
                        <>
                          <li>Create and manage projects</li>
                          <li>Create and assign tasks</li>
                          <li>Access team chat</li>
                          <li>View team dashboard</li>
                        </>
                      )}
                      {invitation.role === "MEMBER" && (
                        <>
                          <li>View projects and tasks</li>
                          <li>Update assigned task status</li>
                          <li>Access team chat</li>
                          <li>View team dashboard</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {!user ? (
                    <div className="text-center">
                      <p className="text-muted mb-3">Please log in to join this team</p>
                      <Button 
                        variant="primary" 
                        onClick={() => navigate("/login")}
                      >
                        Go to Login
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="mb-3">
                        Logged in as: <strong>{user.email}</strong>
                      </p>
                      <Button
                        variant="success"
                        size="lg"
                        onClick={handleJoinTeam}
                        disabled={joining}
                      >
                        {joining ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Joining Team...
                          </>
                        ) : (
                          "Join Team"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h5 className="text-danger">Invalid Invitation</h5>
                  <p className="text-muted">
                    This invitation code is invalid, expired, or has already been used.
                  </p>
                  <Button variant="primary" onClick={() => navigate("/")}>
                    Go to Home
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default JoinTeam;