import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { apiFetch } from "./api";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access"))
  );

  const [showRegister, setShowRegister] = useState(false);

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const [question, setQuestion] = useState("");

  const [uploading, setUploading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      loadDocuments();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedDocument) {
      loadChatSessions(selectedDocument.id);
    } else {
      setChatSessions([]);
      setSelectedSession(null);
      setChatMessages([]);
    }
  }, [selectedDocument]);

  // -----------------------------
  // AUTHENTICATION
  // -----------------------------

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.non_field_errors?.[0] ||
            "Invalid username or password."
        );
        return;
      }

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      setIsLoggedIn(true);

      setLoginData({
        username: "",
        password: "",
      });

      setSuccess("Login successful.");
    } catch (error) {
      setError("Unable to connect to the backend.");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.username) {
          setError(data.username[0]);
        } else if (data.email) {
          setError(data.email[0]);
        } else if (data.password) {
          setError(data.password[0]);
        } else {
          setError("Registration failed.");
        }

        return;
      }

      setSuccess("Registration successful. Please login.");

      setRegisterData({
        username: "",
        email: "",
        password: "",
      });

      setShowRegister(false);
    } catch (error) {
      setError("Unable to connect to the backend.");
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh");

    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        });
      } catch (error) {
        console.error("Logout request failed:", error);
      }
    }

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setIsLoggedIn(false);

    setDocuments([]);
    setSelectedDocument(null);

    setChatSessions([]);
    setSelectedSession(null);
    setChatMessages([]);

    setError("");
    setSuccess("");
  };

  // -----------------------------
  // DOCUMENTS
  // -----------------------------

  const loadDocuments = async () => {
    try {
      const response = await apiFetch("/api/documents/");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please login again.");
        }

        return;
      }

      const data = await response.json();

      setDocuments(data);
    } catch (error) {
      setError("Unable to load documents.");
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();

    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await apiFetch("/api/documents/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      setSuccess("Document uploaded successfully.");

      await loadDocuments();

      event.target.value = "";
    } catch (error) {
      setError("Unable to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
    setSelectedSession(null);
    setChatMessages([]);
    setError("");
    setSuccess("");
  };

  const handleDeleteDocument = async (documentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/api/documents/${documentId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Unable to delete document.");
        return;
      }

      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setSelectedSession(null);
        setChatMessages([]);
      }

      await loadDocuments();

      setSuccess("Document deleted successfully.");
    } catch (error) {
      setError("Unable to delete document.");
    }
  };

  const handleDownloadDocument = async (documentId, originalName) => {
    try {
      const response = await apiFetch(
        `/api/documents/${documentId}/download/`
      );

      if (!response.ok) {
        setError("Unable to download document.");
        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = originalName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Unable to download document.");
    }
  };

  // -----------------------------
  // CHAT SESSIONS
  // -----------------------------

  const loadChatSessions = async (documentId) => {
    try {
      const response = await apiFetch(
        `/api/chats/sessions/?document_id=${documentId}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please login again.");
        }

        return;
      }

      const data = await response.json();

      setChatSessions(data);
    } catch (error) {
      setError("Unable to load chat sessions.");
    }
  };

  const handleNewChat = async () => {
    if (!selectedDocument) {
      setError("Please select a document first.");
      return;
    }

    try {
      const response = await apiFetch("/api/chats/sessions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: selectedDocument.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to create chat.");
        return;
      }

      setSelectedSession(data);
      setChatMessages([]);

      await loadChatSessions(selectedDocument.id);

      setSuccess("New chat created.");
    } catch (error) {
      setError("Unable to create new chat.");
    }
  };

  const openChatSession = async (sessionId) => {
    setLoadingMessages(true);
    setError("");

    try {
      const response = await apiFetch(
        `/api/chats/sessions/${sessionId}/`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to open chat.");
        return;
      }

      setSelectedSession(data);
      setChatMessages(data.messages || []);
    } catch (error) {
      setError("Unable to open chat.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    if (!selectedSession) {
      setError("Please create or select a chat first.");
      return;
    }

    setSendingMessage(true);
    setError("");

    try {
      const response = await apiFetch(
        `/api/chats/sessions/${selectedSession.id}/messages/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to send message.");
        return;
      }

      setChatMessages((previousMessages) => [
        ...previousMessages,
        data,
      ]);

      setQuestion("");

      await loadChatSessions(selectedDocument.id);
    } catch (error) {
      setError("Unable to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // -----------------------------
  // LOGIN / REGISTER SCREEN
  // -----------------------------

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <h1>AI Document Chatbot</h1>

          {error && <p style={{ color: "red" }}>{error}</p>}

          {success && <p style={{ color: "green" }}>{success}</p>}

          {!showRegister ? (
            <>
              <h2>Login</h2>

              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginData.username}
                  onChange={(event) =>
                    setLoginData({
                      ...loginData,
                      username: event.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(event) =>
                    setLoginData({
                      ...loginData,
                      password: event.target.value,
                    })
                  }
                />

                <button type="submit">Login</button>
              </form>

              <p>
                Don't have an account?

                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Register
                </button>
              </p>
            </>
          ) : (
            <>
              <h2>Register</h2>

              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="Username"
                  value={registerData.username}
                  onChange={(event) =>
                    setRegisterData({
                      ...registerData,
                      username: event.target.value,
                    })
                  }
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(event) =>
                    setRegisterData({
                      ...registerData,
                      email: event.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(event) =>
                    setRegisterData({
                      ...registerData,
                      password: event.target.value,
                    })
                  }
                />

                <button type="submit">Register</button>
              </form>

              <p>
                Already have an account?

                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------
  // MAIN APPLICATION
  // -----------------------------

  return (
    <div className="app">
      <header className="header">
        <h1>AI Document Chatbot</h1>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <div className="main-content">

        {/* SIDEBAR */}

        <aside className="sidebar">
          <h2>Documents</h2>

          <label className="upload-button">
            {uploading ? "Uploading..." : "Upload Documents"}

            <input
              type="file"
              accept=".pdf,.docx"
              multiple
              onChange={handleFileUpload}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>

          {documents.length === 0 && (
            <p>No documents uploaded.</p>
          )}

          {documents.map((document) => (
            <div
              key={document.id}
              className="document-item"
              onClick={() => handleDocumentSelect(document)}
              style={{
                border:
                  selectedDocument?.id === document.id
                    ? "2px solid #2563eb"
                    : "1px solid #ddd",
              }}
            >
              <strong>{document.original_name}</strong>

              <div style={{ marginTop: "8px" }}>
                <button
                  onClick={(event) => {
                    event.stopPropagation();

                    handleDownloadDocument(
                      document.id,
                      document.original_name
                    );
                  }}
                  style={{
                    marginRight: "6px",
                    padding: "5px 8px",
                  }}
                >
                  Download
                </button>

                <button
                  onClick={(event) => {
                    event.stopPropagation();

                    handleDeleteDocument(document.id);
                  }}
                  style={{
                    padding: "5px 8px",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* PREVIOUS CHATS */}

          {selectedDocument && (
            <>
              <hr />

              <h2>Previous Chats</h2>

              {chatSessions.length === 0 && (
                <p>No previous chats.</p>
              )}

              {chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => openChatSession(session.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginBottom: "8px",
                    textAlign: "left",
                    border:
                      selectedSession?.id === session.id
                        ? "2px solid #2563eb"
                        : "1px solid #ddd",
                    borderRadius: "6px",
                    background:
                      selectedSession?.id === session.id
                        ? "#eff6ff"
                        : "white",
                  }}
                >
                  {session.title !== "New Chat"
                    ? session.title
                    : `Chat #${session.id}`}
                </button>
              ))}
            </>
          )}
        </aside>

        {/* CHAT AREA */}

        <main className="chat-area">

          <div className="chat-header">
            <div>
              <h2>
                {selectedDocument
                  ? selectedDocument.original_name
                  : "Select a document"}
              </h2>

              {selectedSession && (
                <p>
                  {selectedSession.title !== "New Chat"
                    ? selectedSession.title
                    : `Chat #${selectedSession.id}`}
                </p>
              )}
            </div>

            {selectedDocument && (
              <button onClick={handleNewChat}>
                New Chat
              </button>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "10px 24px",
                color: "red",
                background: "#fee2e2",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: "10px 24px",
                color: "green",
                background: "#dcfce7",
              }}
            >
              {success}
            </div>
          )}

          <div className="messages">

            {!selectedDocument && (
              <p>
                Select a document from the left to start chatting.
              </p>
            )}

            {selectedDocument && !selectedSession && (
              <p>
                Click <strong>New Chat</strong> to start a conversation,
                or select a previous chat.
              </p>
            )}

            {loadingMessages && (
              <p>Loading conversation...</p>
            )}

            {chatMessages.map((chatMessage) => (
              <React.Fragment key={chatMessage.id}>

                <div className="message user-message">
                  <strong>You</strong>

                  <p>{chatMessage.question}</p>
                </div>

                <div className="message assistant-message">
                  <strong>AI</strong>

                  <ReactMarkdown>
                    {chatMessage.answer}
                  </ReactMarkdown>
                </div>

              </React.Fragment>
            ))}

          </div>

          {selectedSession && (
            <form
              className="message-input"
              onSubmit={handleSendMessage}
            >
              <input
                type="text"
                placeholder="Ask something about the document..."
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                disabled={sendingMessage}
              />

              <button
                type="submit"
                disabled={sendingMessage}
              >
                {sendingMessage ? "Thinking..." : "Send"}
              </button>
            </form>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;