import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Tab,
  Tabs,
  ListGroup,
  ProgressBar,
} from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useAuth } from "../context/AuthContext";
import { projectAPI, taskAPI, messageAPI, userAPI, activityAPI } from "../services/api";
import socketService from "../services/socket";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Project form data
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  // Task form data
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    status: "todo",
  });

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    // Set up Socket.IO listeners for real-time updates
    const handleTaskUpdate = (task) => {
      console.log('Received real-time task update:', task);
      setTasks((prev) => 
        prev.map(t => t._id === task._id ? task : t)
      );
    };

    const handleProjectUpdate = (project) => {
      console.log('Received real-time project update:', project);
      setProjects((prev) => 
        prev.map(p => p._id === project._id ? project : p)
      );
    };

    const handleNewMessage = (message) => {
      console.log('Received real-time message in dashboard:', message);
      setRecentMessages((prev) => [...prev.slice(-9), message]);
    };

    socketService.onTaskUpdated(handleTaskUpdate);
    socketService.onProjectUpdated(handleProjectUpdate);
    socketService.onMessageReceived(handleNewMessage);

    // Cleanup on unmount
    return () => {
      socketService.offTaskUpdated(handleTaskUpdate);
      socketService.offProjectUpdated(handleProjectUpdate);
      socketService.offMessageReceived(handleNewMessage);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, messagesRes, teamRes, statsRes, activitiesRes] = await Promise.all([
        projectAPI.getAll(),
        taskAPI.getAll(),
        messageAPI.getAll(10), // Get last 10 messages
        userAPI.getTeam(),
        taskAPI.getStats(),
        activityAPI.getTeamActivities(15), // Get last 15 activities
      ]);

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setRecentMessages(messagesRes.data || []);
      setTeamMembers(teamRes.data || []);
      setStats(statsRes.data || {});
      setActivities(activitiesRes.data || []);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Handle project creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await projectAPI.create(projectForm);
      if (response.success) {
        setProjects([response.data, ...projects]);
        setShowProjectModal(false);
        setProjectForm({ name: "", description: "", status: "active" });
      }
    } catch (err) {
      setError("Failed to create project");
    }
  };

  // Handle task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await taskAPI.create(taskForm);
      if (response.success) {
        setTasks([response.data, ...tasks]);
        setShowTaskModal(false);
        setTaskForm({ title: "", description: "", projectId: "", assignedTo: "", status: "todo" });
      }
    } catch (err) {
      setError("Failed to create task");
    }
  };

  // Handle drag and drop for Kanban
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    try {
      const response = await taskAPI.update(draggableId, { status: newStatus });
      
      // Update local state
      const updatedTask = response.data;
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === draggableId ? updatedTask : task
        )
      );

      // Refresh stats
      const statsRes = await taskAPI.getStats();
      setStats(statsRes.data || {});
    } catch (err) {
      setError("Failed to update task status");
    }
  };

  // Group tasks by status for Kanban
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === "todo"),
    "in-progress": tasks.filter(task => task.status === "in-progress"),
    done: tasks.filter(task => task.status === "done"),
  };

  const getRoleBadge = (role) => {
    const variants = {
      ADMIN: "danger",
      MANAGER: "warning",
      MEMBER: "secondary",
    };
    return <Badge bg={variants[role] || "info"}>{role}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: "success",
      "in-progress": "warning",
      completed: "secondary",
      "on-hold": "danger",
    };
    return <Badge bg={variants[status] || "info"}>{status}</Badge>;
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
              <h1>Dashboard</h1>
              <p className="text-muted">Welcome back, {user?.name}!</p>
            </div>
            {canManage && (
              <div>
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => setShowProjectModal(true)}
                >
                  + New Project
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowTaskModal(true)}
                >
                  + New Task
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {error && <Alert variant="warning" dismissible onClose={() => setError("")}>{error}</Alert>}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2 className="text-primary">{projects.length}</h2>
              <p className="text-muted mb-0">Active Projects</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2 className="text-warning">{stats.total || 0}</h2>
              <p className="text-muted mb-0">Total Tasks</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2 className="text-success">{stats.done || 0}</h2>
              <p className="text-muted mb-0">Completed Tasks</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2 className="text-info">{teamMembers.length}</h2>
              <p className="text-muted mb-0">Team Members</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        {/* Overview Tab */}
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Recent Projects</h5>
                    {canManage && (
                      <Button size="sm" variant="outline-primary" onClick={() => setShowProjectModal(true)}>
                        + Add
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {projects.length === 0 ? (
                    <p className="text-muted text-center">No projects yet</p>
                  ) : (
                    <ListGroup variant="flush">
                      {projects.slice(0, 5).map((project) => (
                        <ListGroup.Item key={project._id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{project.name}</strong>
                            <br />
                            <small className="text-muted">{project.description}</small>
                          </div>
                          {getStatusBadge(project.status)}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Team Members</h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {teamMembers.length === 0 ? (
                    <p className="text-muted text-center">No team members</p>
                  ) : (
                    <ListGroup variant="flush">
                      {teamMembers.map((member) => (
                        <ListGroup.Item key={member._id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{member.name}</strong>
                            <br />
                            <small className="text-muted">{member.email}</small>
                          </div>
                          {getRoleBadge(member.role)}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Recent Chat Messages</h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {recentMessages.length === 0 ? (
                    <p className="text-muted text-center">No recent messages</p>
                  ) : (
                    recentMessages.slice(-5).map((message) => (
                      <div key={message._id} className="mb-2">
                        <small className="text-muted">
                          <strong>{message.senderId?.name}</strong> - {new Date(message.timestamp).toLocaleString()}
                        </small>
                        <p className="mb-1">{message.content}</p>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Kanban Board Tab */}
        <Tab eventKey="kanban" title="Task Board (Kanban)">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Row>
              {/* To Do Column */}
              <Col md={4}>
                <Card>
                  <Card.Header className="bg-secondary text-white">
                    <h6 className="mb-0">To Do ({tasksByStatus.todo.length})</h6>
                  </Card.Header>
                  <Droppable droppableId="todo">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ minHeight: "400px", padding: "10px" }}
                      >
                        {tasksByStatus.todo.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 ${snapshot.isDragging ? "shadow-lg" : "shadow-sm"}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <Card.Body className="p-2">
                                  <h6 className="mb-1">{task.title}</h6>
                                  <small className="text-muted">{task.projectId?.name}</small>
                                  <br />
                                  <small className="text-muted">
                                    Assigned: {task.assignedTo?.name || "Unassigned"}
                                  </small>
                                </Card.Body>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card>
              </Col>

              {/* In Progress Column */}
              <Col md={4}>
                <Card>
                  <Card.Header className="bg-warning text-white">
                    <h6 className="mb-0">In Progress ({tasksByStatus["in-progress"].length})</h6>
                  </Card.Header>
                  <Droppable droppableId="in-progress">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ minHeight: "400px", padding: "10px" }}
                      >
                        {tasksByStatus["in-progress"].map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 ${snapshot.isDragging ? "shadow-lg" : "shadow-sm"}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <Card.Body className="p-2">
                                  <h6 className="mb-1">{task.title}</h6>
                                  <small className="text-muted">{task.projectId?.name}</small>
                                  <br />
                                  <small className="text-muted">
                                    Assigned: {task.assignedTo?.name || "Unassigned"}
                                  </small>
                                </Card.Body>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card>
              </Col>

              {/* Done Column */}
              <Col md={4}>
                <Card>
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0">Done ({tasksByStatus.done.length})</h6>
                  </Card.Header>
                  <Droppable droppableId="done">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ minHeight: "400px", padding: "10px" }}
                      >
                        {tasksByStatus.done.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 ${snapshot.isDragging ? "shadow-lg" : "shadow-sm"}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                              >
                                <Card.Body className="p-2">
                                  <h6 className="mb-1">{task.title}</h6>
                                  <small className="text-muted">{task.projectId?.name}</small>
                                  <br />
                                  <small className="text-muted">
                                    Assigned: {task.assignedTo?.name || "Unassigned"}
                                  </small>
                                </Card.Body>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card>
              </Col>
            </Row>
          </DragDropContext>
        </Tab>

        {/* Projects Tab */}
        <Tab eventKey="projects" title="Projects">
          <Row>
            {projects.map((project) => (
              <Col md={4} key={project._id} className="mb-3">
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6>{project.name}</h6>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-muted small">{project.description}</p>
                    <small className="text-muted">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {projects.length === 0 && (
              <Col>
                <Card className="text-center">
                  <Card.Body>
                    <p className="text-muted">No projects yet. Create your first project!</p>
                    {canManage && (
                      <Button variant="primary" onClick={() => setShowProjectModal(true)}>
                        Create Project
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Tab>

        {/* Team Tab */}
        <Tab eventKey="team" title="Team">
          <Row>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Team Members</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {teamMembers.map((member) => (
                      <Col md={6} key={member._id} className="mb-3">
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6>{member.name}</h6>
                                <p className="text-muted small mb-1">{member.email}</p>
                                <small className="text-muted">
                                  Joined: {new Date(member.createdAt).toLocaleDateString()}
                                </small>
                              </div>
                              {getRoleBadge(member.role)}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Team Stats</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Task Completion</span>
                      <span>{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</span>
                    </div>
                    <ProgressBar 
                      now={stats.total > 0 ? (stats.done / stats.total) * 100 : 0} 
                      variant="success" 
                    />
                  </div>
                  <div className="mb-2">
                    <strong>Role Distribution:</strong>
                  </div>
                  <div>
                    <Badge bg="danger" className="me-2">
                      Admin: {teamMembers.filter(m => m.role === "ADMIN").length}
                    </Badge>
                    <Badge bg="warning" className="me-2">
                      Manager: {teamMembers.filter(m => m.role === "MANAGER").length}
                    </Badge>
                    <Badge bg="secondary">
                      Member: {teamMembers.filter(m => m.role === "MEMBER").length}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Activity Logs */}
          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Recent Team Activity</h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {activities.length === 0 ? (
                    <p className="text-muted text-center">No recent activity</p>
                  ) : (
                    <div>
                      {activities.map((activity) => (
                        <div key={activity._id} className="mb-3 pb-2 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <p className="mb-1">{activity.description}</p>
                              <small className="text-muted">
                                {new Date(activity.timestamp).toLocaleString()}
                              </small>
                            </div>
                            <Badge 
                              bg={
                                activity.type.includes('created') ? 'success' :
                                activity.type.includes('updated') ? 'warning' :
                                activity.type.includes('assigned') ? 'info' :
                                'secondary'
                              }
                              className="ms-2"
                            >
                              {activity.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Project Modal */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateProject}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Project
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Task</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTask}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project</Form.Label>
              <Form.Select
                value={taskForm.projectId}
                onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                required
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Dashboard;