import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Container,
  Card,
  Modal,
  Form,
  Badge,
  Alert,
  Spinner,
  Row,
  Col,
  InputGroup,
  Dropdown,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { taskAPI, projectAPI, userAPI } from "../services/api";

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    assignedTo: '',
    projectId: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    projectId: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDelete = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Fetch initial data
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchTeamMembers();
    fetchStats();
  }, [filters]);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await taskAPI.getAll(queryParams.toString());
      setTasks(response.data || []);
    } catch (err) {
      setError("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error("Failed to load projects");
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await userAPI.getTeam();
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error("Failed to load team members");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await taskAPI.getStats();
      setStats(response.data || {});
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  const handleShowModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        projectId: task.projectId?._id || "",
        assignedTo: task.assignedTo?._id || "",
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        status: "todo",
        projectId: projects.length > 0 ? projects[0]._id : "",
        assignedTo: "",
      });
    }
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    // Basic frontend validation
    if (!formData.title.trim()) {
      setError("Task title is required");
      setSubmitLoading(false);
      return;
    }

    if (!formData.projectId) {
      setError("Please select a project");
      setSubmitLoading(false);
      return;
    }

    try {
      // Clean and prepare task data
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        projectId: formData.projectId,
      };

      // Only add assignedTo if selected
      if (formData.assignedTo) {
        taskData.assignedTo = formData.assignedTo;
      }

      console.log('Submitting task data:', taskData);

      if (editingTask) {
        const response = await taskAPI.update(editingTask._id, taskData);
        if (response.success) {
          setTasks((prev) =>
            prev.map((t) => (t._id === editingTask._id ? response.data : t))
          );
          setShowModal(false);
          fetchStats();
        } else {
          setError(response.error || "Update failed");
        }
      } else {
        const response = await taskAPI.create(taskData);
        if (response.success) {
          setTasks((prev) => [response.data, ...prev]);
          setShowModal(false);
          fetchStats();
        } else {
          setError(response.error || "Create failed");
        }
      }
    } catch (err) {
      console.error('Task submission error:', err);
      
      // Handle validation errors specifically
      if (err.response?.data?.details) {
        const validationErrors = err.response.data.details
          .map(detail => `${detail.field}: ${detail.message}`)
          .join(', ');
        setError(`Validation Error: ${validationErrors}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.error) {
        setError(err.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Operation failed. Please check your input and try again.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await taskAPI.delete(taskId);
        if (response.success) {
          setTasks((prev) => prev.filter((t) => t._id !== taskId));
          fetchStats();
        } else {
          setError(response.error || "Delete failed");
        }
      } catch (err) {
        setError(err.error || err.message || "Failed to delete task");
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await taskAPI.update(taskId, { status: newStatus });
      if (response.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? response.data : t))
        );
        fetchStats();
      }
    } catch (err) {
      setError("Failed to update task status");
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      "todo": "secondary",
      "in-progress": "primary", 
      "done": "success"
    };
    const labels = {
      "todo": "To Do",
      "in-progress": "In Progress",
      "done": "Done"
    };
    return <Badge bg={variants[status]}>{labels[status]}</Badge>;
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
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Task Management</h1>
              <p className="text-muted">Manage and track your team's tasks</p>
            </div>
            {canEdit && (
              <Button variant="primary" onClick={() => handleShowModal()}>
                + New Task
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{stats.total || 0}</h3>
              <p className="text-muted mb-0">Total Tasks</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-secondary">{stats.todo || 0}</h3>
              <p className="text-muted mb-0">To Do</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{stats.inProgress || 0}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{stats.done || 0}</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.projectId}
                onChange={(e) => setFilters({...filters, projectId: e.target.value})}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.assignedTo}
                onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
              >
                <option value="">All Assignees</option>
                {teamMembers.map(member => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <InputGroup>
                <Form.Control
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Tasks Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td>
                    <div>
                      <strong>{task.title}</strong>
                      {task.description && (
                        <div className="text-muted small">{task.description.substring(0, 100)}...</div>
                      )}
                    </div>
                  </td>
                  <td>{task.projectId?.name}</td>
                  <td>{task.assignedTo?.name || "Unassigned"}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="link" size="sm" className="p-0">
                        {getStatusBadge(task.status)}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleStatusChange(task._id, 'todo')}>
                          To Do
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange(task._id, 'in-progress')}>
                          In Progress
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange(task._id, 'done')}>
                          Done
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                  <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {canEdit && (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleShowModal(task)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(task._id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {tasks.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">
                No tasks found. {canEdit && "Create your first task!"}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTask ? "Edit Task" : "Create New Task"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Enter task title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project *</Form.Label>
                  <Form.Select
                    value={formData.projectId}
                    onChange={(e) =>
                      setFormData({ ...formData, projectId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter task description"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assignee</Form.Label>
                  <Form.Select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member._id} value={member._id}>{member.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {editingTask ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingTask ? "Update Task" : "Create Task"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Tasks;