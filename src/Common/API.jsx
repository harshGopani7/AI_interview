import axios from "axios";
//https://ai4cs.in

// export const backend_URL = "http://127.0.0.1:5000";
// export const backend_URL = "https://backend.ai4cs.in.up.railway.app";
export const backend_URL = "https://ai4cs-production.up.railway.app";

// Import centralized backend URL
// import { backend_URL } from "../components/HomePage";

const APIService = async ({ question, onResponse, retries = 2 }) => {

  const makeRequest = async (attempt = 1) => {
    try {
      const response = await axios({
        url: backend_URL + "/api/generate",
        method: "POST",
        data: { question },
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
        },
      });


      if (response.status === 200 && response.data) {
        // console.log(response)
        onResponse(response.data);
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed`, error);

      if (error.code === "ECONNABORTED" && attempt <= retries) {
        await new Promise(r => setTimeout(r, 2000));
        return makeRequest(attempt + 1);
      }

      onResponse({
        candidates: [{
          content: {
            parts: [{ text: "Server error. Please try again later." }]
          }
        }]
      });
    }
  };

  await makeRequest();
};

// TextTool specific API services
export const TextToolAPI = {
  newEmail: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/new-email",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  replyEmail: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/reply-email",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  // Report Generation APIs
  internshipReport: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/internship-report",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  projectReport: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/project-report",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  technicalReport: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/technical-report",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  businessMarketReport: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/business-market-report",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  incidentStatusReport: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/incident-status-report",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  generateBlog: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/generate-blog",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  generateLetter: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/generate-letter",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  generateTextIntelligence: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/texttool/generate-text-intelligence",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  }
};

// Agreements specific API services
export const AgreementsAPI = {
  generateTemplate: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/agreements/generate-template",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  },

  generateAgreement: async (data, onResponse, retries = 2) => {
    const makeRequest = async (attempt = 1) => {
      try {
        const response = await axios({
          url: backend_URL + "/agreements/generate-agreement",
          method: "POST",
          data,
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data) {
          onResponse(response.data);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed`, error);

        if (error.code === "ECONNABORTED" && attempt <= retries) {
          await new Promise(r => setTimeout(r, 2000));
          return makeRequest(attempt + 1);
        }

        onResponse({
          candidates: [{
            content: {
              parts: [{ text: "Server error. Please try again later." }]
            }
          }]
        });
      }
    };

    await makeRequest();
  }
};

export default APIService;
