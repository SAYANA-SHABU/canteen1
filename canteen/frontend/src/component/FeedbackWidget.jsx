import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./FeedbackWidget.css";

const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const fetchFeedbacks = async () => {
    const res = await axios.get("http://localhost:5000/feedback");
    setFeedbacks(res.data);
  };

  useEffect(() => {
    if (open) fetchFeedbacks();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedbacks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await axios.post("http://localhost:5000/feedback", { message });
    setMessage("");
    fetchFeedbacks();
  };

  return (
    <>
      {/* Floating round button */}
      <div className="feedback-fab" onClick={() => setOpen(!open)}>
        💬
      </div>

      {/* Chat box */}
      {open && (
        <div className="feedback-box">
          <div className="feedback-header">
            Feedback
            <span className="close-btn" onClick={() => setOpen(false)}>✕</span>
          </div>

          <div className="feedback-messages">
            {feedbacks.map((fb) => (
              <div key={fb._id} className="feedback-msg">
                {fb.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="feedback-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type feedback..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit">➤</button>
          </form>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
