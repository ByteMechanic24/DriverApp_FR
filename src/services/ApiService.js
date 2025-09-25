// Backend API service for Driver App
const BASE_URL = 'https://smartbus-backend-production.up.railway.app/api'; // Live Railway backend

class ApiService {
  // Get list of drivers for selection
  static async getDriverList() {
    try {
      const response = await fetch(`${BASE_URL}/drivers/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver list:', error);
      throw error;
    }
  }

  // Get available buses
  static async getAvailableBuses() {
    try {
      const response = await fetch(`${BASE_URL}/drivers/buses/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available buses:', error);
      throw error;
    }
  }

  // Start tracking session
  static async startTracking({ driverId, busId }) {
    try {
      const response = await fetch(`${BASE_URL}/drivers/start-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          busId,
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting tracking session:', error);
      throw error;
    }
  }

  // Stop tracking session
  static async stopTracking({ driverId }) {
    try {
      const response = await fetch(`${BASE_URL}/drivers/stop-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error stopping tracking session:', error);
      throw error;
    }
  }

  // Send location update
  static async updateLocation({ driverId, latitude, longitude, speed, bearing }) {
    try {
      const response = await fetch(`${BASE_URL}/drivers/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          latitude,
          longitude,
          speed,
          bearing,
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  // Get current session info
  static async getCurrentSession(driverId) {
    try {
      const response = await fetch(`${BASE_URL}/drivers/${driverId}/current-session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching current session:', error);
      throw error;
    }
  }
}

export default ApiService;