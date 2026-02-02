import React, { useState, useEffect } from 'react';
import { getFindings, prioritizeFinding, updateFindingPriority } from './api';

function App() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const data = await getFindings();
        setFindings(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFindings();
  }, []);

  const handlePrioritize = async (finding) => {
    // For now, let's just use description, severity, and cwe
    const vulnerabilityData = {
      description: finding.description || '',
      severity: finding.severity,
      cwe: finding.cwe // Assuming cwe is available
    };
    const aiResult = await prioritizeFinding(vulnerabilityData);

    if (aiResult) {
      // Update finding in DefectDojo via API
      const updatedDojoFinding = await updateFindingPriority(
        finding.id,
        aiResult.priority,
        aiResult.justification
      );

      if (updatedDojoFinding) {
        setFindings(prevFindings =>
          prevFindings.map(f =>
            f.id === finding.id ? {
              ...f,
              severity: updatedDojoFinding.severity, // Update severity from DefectDojo
              description: updatedDojoFinding.description, // Update description from DefectDojo
              ai_priority: aiResult.priority,
              ai_justification: aiResult.justification
            } : f
          )
        );
      } else {
        // If DefectDojo API update failed, just update local state with AI result
        setFindings(prevFindings =>
          prevFindings.map(f =>
            f.id === finding.id ? { ...f, ai_priority: aiResult.priority, ai_justification: aiResult.justification } : f
          )
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>DevSecOps Dashboard</h1>
        </header>
        <main>
          <section className="findings-section">
            <h2>Vulnerability Findings</h2>
            <p>Loading findings...</p>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>DevSecOps Dashboard</h1>
        </header>
        <main>
          <section className="findings-section">
            <h2>Vulnerability Findings</h2>
            <p>Error: {error.message}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>DevSecOps Dashboard</h1>
      </header>
      <main>
        <section className="findings-section">
          <h2>Vulnerability Findings</h2>
          <div className="findings-table-container">
            {findings.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>AI Priority</th>
                    <th>AI Justification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((finding) => (
                    <tr key={finding.id}>
                      <td>{finding.id}</td>
                      <td>{finding.title}</td>
                      <td>{finding.severity}</td>
                      <td>{finding.ai_priority || 'N/A'}</td>
                      <td>{finding.ai_justification || 'N/A'}</td>
                      <td>
                        <button onClick={() => handlePrioritize(finding)}>
                          Prioritize with AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No findings to display.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App
