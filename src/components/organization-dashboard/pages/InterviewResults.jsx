import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../../../services/token";
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaChartBar, FaComments, FaCode, FaShare } from "react-icons/fa";
import "./InterviewResults.css";
import Card from "../../../ui/Card";
import { backendURL } from "../../../pages/Home";
import ReactMarkdown from "react-markdown";

export default function InterviewResults() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [interviewId]);

  const fetchResults = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interview-results/${interviewId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setResults(data);
      } else {
        console.error("Failed to fetch results");
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to publish these results to the candidate? They will be able to view them in their Results section.")) {
      return;
    }

    setPublishing(true);
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interview-results/${interviewId}/publish`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Results published successfully!");
        fetchResults();
      } else {
        alert("Failed to publish results");
      }
    } catch (error) {
      console.error("Error publishing results:", error);
      alert("Error publishing results");
    } finally {
      setPublishing(false);
    }
  };

  const calculateAverageScore = (scoreObj) => {
    if (typeof scoreObj === 'number') return scoreObj;
    if (typeof scoreObj === 'object' && scoreObj !== null) {
      const scores = Object.values(scoreObj);
      const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
      return average.toFixed(1);
    }
    return 0;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "error";
  };

  const getRatingColor = (rating) => {
    const ratings = {
      "Excellent": "success",
      "Good": "info",
      "Average": "warning",
      "Poor": "error"
    };
    return ratings[rating] || "secondary";
  };

  if (loading) {
    return (
      <div className="interview-results-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading interview results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="interview-results-container">
        <Card className="text-center py-5">
          <FaExclamationTriangle className="empty-icon mb-3" />
          <h3>No Results Found</h3>
          <p className="text-muted">This interview may not have been completed yet.</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Go Back
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="interview-results-container fade-in">
      {/* Header */}
      <div className="results-header mb-4">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Interviews
        </button>
        <div className="header-content">
          <h2 className="dashboard-title">Interview Results</h2>
          <div className="candidate-info">
            <h3>{results.candidateName}</h3>
            <p className="text-muted">{results.candidateEmail} • {results.position}</p>
          </div>
        </div>
        {!results.published && (
          <button 
            className="btn btn-success"
            onClick={handlePublish}
            disabled={publishing}
          >
            <FaShare /> {publishing ? "Publishing..." : "Publish to Candidate"}
          </button>
        )}
        {results.published && (
          <span className="badge badge-success">
            <FaCheckCircle /> Published
          </span>
        )}
      </div>

      {/* Score Overview - Score and Verdict side by side */}
      <div className="score-verdict-grid mb-4">
        <Card className="score-card">
          <div className="score-circle-wrapper">
            <div className={`score-circle score-${getScoreColor(calculateAverageScore(results.score))}`}>
              <span className="score-value">{calculateAverageScore(results.score)}</span>
              <span className="score-label">/ 10</span>
            </div>
          </div>
          <h4>Average Score</h4>
        </Card>

        <Card className="rating-card">
          <FaCode className="rating-icon" />
          <h4>Interview Verdict</h4>
          <span className={`rating-badge badge-${getRatingColor(results.interview_verdict)}`}>
            {results.interview_verdict}
          </span>
        </Card>
      </div>

      {/* Improvement Guide - Full width below */}
      <Card className="improvement-guide-card mb-4">
        <div className="improvement-guide-header">
          <FaComments className="guide-icon" />
          <h3>Improvement Guide</h3>
        </div>
        <div className="improvement-guide-content">
          <ReactMarkdown>{results.improvement_guide}</ReactMarkdown>
        </div>
      </Card>

      {/* Score Breakdown */}
      {typeof results.score === 'object' && results.score !== null && (
        <Card className="score-breakdown-card mb-4">
          <h3 className="mb-3">Score Breakdown</h3>
          <div className="score-breakdown-grid">
            {Object.entries(results.score).map(([category, score]) => (
              <div key={category} className="score-breakdown-item">
                <div className="score-category">{category}</div>
                <div className="score-bar-container">
                  <div 
                    className={`score-bar score-${getScoreColor(score)}`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  >
                    <span className="score-bar-value">{score}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strengths and Improvements */}
      <div className="feedback-grid mb-4">
        <Card className="feedback-card strengths-card">
          <div className="feedback-header">
            <FaCheckCircle className="feedback-icon success" />
            <h3>Strengths</h3>
          </div>
          <ul className="feedback-list">
            {results.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </Card>

        <Card className="feedback-card improvements-card">
          <div className="feedback-header">
            <FaChartBar className="feedback-icon warning" />
            <h3>Areas for Improvement</h3>
          </div>
          <ul className="feedback-list">
            {results.improvements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Q&A Transcript */}
      <Card className="qa-transcript-card">
        <h3 className="mb-4">Interview Transcript</h3>
        <div className="qa-list">
          {results.qa_pairs && results.qa_pairs.map((qa, index) => (
            <div key={index} className="qa-item">
              <div className="question-block">
                <span className="qa-label">Question {index + 1}</span>
                <p className="qa-text">{qa.question}</p>
              </div>
              {qa.answer && (
                <div className="answer-block">
                  <span className="qa-label">Answer</span>
                  <p className="qa-text">{qa.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
