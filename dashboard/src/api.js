const DEFECTDOJO_API_BASE_URL = 'http://localhost:8080/api/v2';
const AI_SERVICE_API_BASE_URL = 'http://localhost:8001';

const DEFECTDOJO_API_KEY = '1a3f266de4373d51627269d7ef5ac2b70d914d07'; 

export const getFindings = async () => {
  try {
    const response = await fetch(`${DEFECTDOJO_API_BASE_URL}/findings/`, {
      headers: {
        'Authorization': `Token ${DEFECTDOJO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results; // DefectDojo API typically returns results in a 'results' array
  } catch (error) {
    console.error("Error fetching findings:", error);
    return [];
  }
};

export const prioritizeFinding = async (findingData) => {
  try {
    const response = await fetch(`${AI_SERVICE_API_BASE_URL}/prioritize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(findingData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error prioritizing finding:", error);
    return null;
  }
};

export const updateFindingPriority = async (findingId, aiPriority, aiJustification) => {
  try {
    const response = await fetch(`${DEFECTDOJO_API_BASE_URL}/findings/${findingId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${DEFECTDOJO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        severity: aiPriority, // Assuming AI priority maps directly to severity
        // DefectDojo API might require a custom field for justification, or we can append to description
        description: `(AI Priority: ${aiPriority}, Justification: ${aiJustification})\n` + aiJustification // Example: appending to description
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating finding priority:", error);
    return null;
  }
};
