import React, { useState } from "react";
import {
  Form,
  Button,
  Card,
  Container,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { firebaseAuth } from "../services/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation for registration
    if (isRegister) {
      if (!name.trim()) {
        setError("Full name is required");
        setLoading(false);
        return;
      }
      if (name.trim().length < 2) {
        setError("Name must be at least 2 characters long");
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegister) {
        // Register new user with Firebase
        const result = await firebaseAuth.register(email, password);
        if (result.success) {
          // Now login with the new account and selected role
          const loginResult = await login(email, password, selectedRole, name.trim());
          if (loginResult.success) {
            navigate("/");
          } else {
            setError(loginResult.error || "Login after registration failed");
          }
        } else {
          setError(result.error || "Registration failed");
        }
      } else {
        // Login existing user
        const result = await login(email, password);
        if (result.success) {
          navigate("/");
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (error) {
      setError(error.message || "An error occurred");
    }
    
    setLoading(false);
  };

  return (
    <Container>
      <Row className="justify-content-center align-items-center min-vh-80">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <Card.Title className="text-center mb-4">
                <h3>Team Collaboration Platform</h3>
                <p className="text-muted small">
                  {isRegister ? "Create your account" : "Sign in to continue"}
                </p>
              </Card.Title>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                {isRegister && (
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isRegister}
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </Form.Group>

                {isRegister && (
                  <Form.Group className="mb-4">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="MEMBER">Member - Basic access</option>
                      <option value="MANAGER">Manager - Can create projects and tasks</option>
                      <option value="ADMIN">Admin - Full access</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Choose your role in the team
                    </Form.Text>
                  </Form.Group>
                )}

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading 
                    ? (isRegister ? "Creating Account..." : "Signing in...") 
                    : (isRegister ? "Create Account" : "Sign In")
                  }
                </Button>
              </Form>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setIsRegister(!isRegister)}
                  disabled={loading}
                >
                  {isRegister 
                    ? "Already have an account? Sign in" 
                    : "Need an account? Register"
                  }
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
