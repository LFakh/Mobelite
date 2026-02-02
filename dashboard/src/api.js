const DEFECTDOJO_API_BASE_URL = 'http://localhost:8080/api/v2';
const AI_SERVICE_API_BASE_URL = 'http://localhost:8001';

// Placeholder for DefectDojo API Key - REPLACE WITH ACTUAL KEY IN PRODUCTION
const DEFECTDOJO_API_KEY = 'YOUR_DEFECTDOJO_API_KEY'; 

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
