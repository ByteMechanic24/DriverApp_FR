import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  AppState,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LocationService from '../services/LocationService';
import ApiService from '../services/ApiService';
import SocketService from '../services/SocketService';

const TrackingScreen = ({ navigation, route }) => {
  const { selectedDriver, selectedBus, session } = route.params;
  const [isTracking, setIsTracking] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationCount, setLocationCount] = useState(0);
  const [startTime] = useState(new Date());
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Initialize Socket.io connection
    SocketService.connect();
    
    // Check socket connection status
    const checkSocketConnection = () => {
      const status = SocketService.getConnectionStatus();
      setSocketConnected(status.isConnected);
    };
    
    // Monitor socket connection
    SocketService.on('connect', () => {
      setSocketConnected(true);
      // Join driver room for targeted communication
      SocketService.joinRoom(selectedDriver.driver_id, selectedBus.bus_id);
    });
    
    SocketService.on('disconnect', () => {
      setSocketConnected(false);
    });
    
    // Check initial connection status
    setTimeout(checkSocketConnection, 1000);

    // Start location tracking immediately
    startLocationTracking();

    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && isTracking) {
        startLocationTracking();
        // Reconnect socket if needed
        if (!SocketService.getConnectionStatus().isConnected) {
          SocketService.connect();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Continue tracking in background
        console.log('App in background, continuing GPS tracking');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      LocationService.stopTracking();
      SocketService.leaveRoom(selectedDriver.driver_id, selectedBus.bus_id);
      SocketService.disconnect();
    };
  }, []);

  const startLocationTracking = () => {
    LocationService.startTracking({
      onLocationUpdate: handleLocationUpdate,
      onError: handleLocationError,
      interval: 10000, // 10 seconds
    });
  };

  const handleLocationUpdate = async (location) => {
    try {
      // Validate location data before setting state
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        console.error('Invalid location data received:', location);
        return;
      }
      
      setCurrentLocation(location);
      setLastUpdateTime(new Date());
      setLocationCount(prev => prev + 1);

      // Send location to backend API
      const response = await ApiService.updateLocation({
        driverId: selectedDriver.driver_id,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed || 0,
        bearing: location.bearing || 0,
      });

      if (!response.success) {
        console.error('Failed to update location:', response.message);
      }
      
      // Also broadcast via Socket.io for real-time updates
      SocketService.emitLocationUpdate({
        bus_id: selectedBus.bus_id,
        driver_id: selectedDriver.driver_id,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed || 0,
        bearing: location.bearing || 0,
        timestamp: new Date().toISOString(),
        accuracy: location.accuracy,
      });
      
    } catch (error) {
      console.error('Error in handleLocationUpdate:', error);
    }
  };

  const handleLocationError = (error) => {
    console.error('Location error:', error);
    Alert.alert(
      'GPS Error',
      'Unable to get your location. Please check GPS settings.',
      [
        { text: 'Retry', onPress: startLocationTracking },
        { text: 'Stop Tracking', onPress: handleStopTracking, style: 'destructive' }
      ]
    );
  };

  const handleStopTracking = () => {
    Alert.alert(
      'Stop Tracking',
      'Are you sure you want to stop GPS tracking? This will end your session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: confirmStopTracking }
      ]
    );
  };

  const confirmStopTracking = async () => {
    try {
      setIsTracking(false);
      LocationService.stopTracking();
      
      // Stop tracking session on backend
      const response = await ApiService.stopTracking({
        driverId: selectedDriver.driver_id
      });

      if (response.success) {
        Alert.alert(
          'Session Ended',
          'GPS tracking has been stopped successfully.',
          [{ text: 'OK', onPress: () => navigation.popToTop() }]
        );
      } else {
        Alert.alert('Warning', 'Session ended locally, but server update failed.');
        navigation.popToTop();
      }
    } catch (error) {
      console.error('Error stopping tracking:', error);
      Alert.alert('Warning', 'Session ended locally, but server update failed.');
      navigation.popToTop();
    }
  };

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLocationAccuracy = () => {
    if (!currentLocation || currentLocation.accuracy === null || currentLocation.accuracy === undefined || isNaN(currentLocation.accuracy)) {
      return 'N/A';
    }
    return `±${Math.round(parseFloat(currentLocation.accuracy))}m`;
  };

  const formatCoordinate = (coord) => {
    if (coord === null || coord === undefined || isNaN(coord)) return 'N/A';
    return parseFloat(coord).toFixed(6);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed at top */}
      <View style={styles.header}>
        <View style={styles.sessionInfo}>
          <Text style={styles.driverName}>{selectedDriver?.driver_name ? String(selectedDriver.driver_name) : 'Driver'}</Text>
          <Text style={styles.busNumber}>{selectedBus?.bus_number ? String(selectedBus.bus_number) : 'Bus'}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, isTracking && styles.activeStatus]}>
            <View style={[styles.statusDot, isTracking && styles.activeDot]} />
            <Text style={[styles.statusText, isTracking && styles.activeStatusText]}>
              {isTracking ? 'TRACKING' : 'STOPPED'}
            </Text>
          </View>
          <View style={[styles.socketIndicator, socketConnected && styles.socketConnected]}>
            <Icon 
              name={socketConnected ? 'wifi' : 'wifi-off'} 
              size={12} 
              color={socketConnected ? '#4CAF50' : '#F44336'} 
            />
            <Text style={[styles.socketText, socketConnected && styles.socketConnectedText]}>
              {socketConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

      {/* Map View */}
      {currentLocation && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={true}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title={`Bus ${selectedBus?.bus_number ? String(selectedBus.bus_number) : 'Unknown'}`}
              description={`Driver: ${selectedDriver?.driver_name ? String(selectedDriver.driver_name) : 'Unknown'}`}
            >
              <View style={styles.busMarker}>
                <Icon name="bus" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          </MapView>
        </View>
      )}

      {/* GPS Status Card */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Icon name="map-marker" size={24} color="#4CAF50" />
          <Text style={styles.gpsTitle}>GPS Location</Text>
        </View>
        
        {currentLocation ? (
          <View style={styles.locationInfo}>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Latitude:</Text>
              <Text style={styles.coordinateValue}>
                {formatCoordinate(currentLocation.latitude)}
              </Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Longitude:</Text>
              <Text style={styles.coordinateValue}>
                {formatCoordinate(currentLocation.longitude)}
              </Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Accuracy:</Text>
              <Text style={styles.coordinateValue}>
                {getLocationAccuracy()}
              </Text>
            </View>
            {currentLocation.speed !== null && currentLocation.speed !== undefined && !isNaN(currentLocation.speed) && currentLocation.speed > 0 && (
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Speed:</Text>
                <Text style={styles.coordinateValue}>
                  {Math.round(parseFloat(currentLocation.speed) * 3.6)} km/h
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noLocationContainer}>
            <Icon name="map-marker-off" size={32} color="#CCC" />
            <Text style={styles.noLocationText}>Getting GPS location...</Text>
          </View>
        )}
      </View>

      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Session Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getElapsedTime()}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{locationCount}</Text>
            <Text style={styles.statLabel}>Updates Sent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {lastUpdateTime && lastUpdateTime instanceof Date ? lastUpdateTime.toLocaleTimeString() : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Last Update</Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Icon name="information" size={20} color="#2196F3" />
        <Text style={styles.instructionsText}>
          Your location is being sent every 10 seconds to help passengers track the bus in real-time.
          Keep this app open for best results.
        </Text>
      </View>

        {/* Stop Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTracking}
          >
            <Icon name="stop" size={20} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Stop Tracking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sessionInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  busNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
  },
  activeStatus: {
    backgroundColor: '#E8F5E8',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  activeStatusText: {
    color: '#4CAF50',
  },
  socketIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    gap: 3,
  },
  socketConnected: {
    backgroundColor: '#E8F5E8',
  },
  socketText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#F44336',
  },
  socketConnectedText: {
    color: '#4CAF50',
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  busMarker: {
    backgroundColor: '#8E4DFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  gpsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  locationInfo: {
    gap: 8,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#666',
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'monospace',
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E4DFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 10,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    marginTop: 10,
  },
  stopButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TrackingScreen;