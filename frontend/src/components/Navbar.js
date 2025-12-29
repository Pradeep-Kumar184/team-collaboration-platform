import React from "react";
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="shadow">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold">
          TeamCollab
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                <Nav.Link as={Link} to="/">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/projects">
                  Projects
                </Nav.Link>
                <Nav.Link as={Link} to="/tasks">
                  Tasks
                </Nav.Link>
                <Nav.Link as={Link} to="/chat">
                  Chat
                </Nav.Link>
                <Nav.Link as={Link} to="/team">
                  Team
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <NavDropdown title={user.name} id="user-dropdown" align="end">
                <NavDropdown.ItemText>
                  <small className="text-muted">{user.email}</small>
                </NavDropdown.ItemText>
                <NavDropdown.ItemText>
                  <span
                    className={`badge bg-${
                      user.role === "ADMIN"
                        ? "danger"
                        : user.role === "MANAGER"
                        ? "warning"
                        : "secondary"
                    }`}
                  >
                    {user.role}
                  </span>
                </NavDropdown.ItemText>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
