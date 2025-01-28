
declare global {
  interface Window {
    env: {
      API_URL: string;
      ENVIRONMENT: string;
    }
  }
}

export const environment = {
  production: false,
  apis: {
    be: window?.env?.API_URL || 'http://localhost:8081/',
    metrics: 'https://my-json-server.typicode.com/405516GONZALEZFEDERICO/fake-api-metrics/environmentalData'
  }
};