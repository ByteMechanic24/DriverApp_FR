import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

class LocationService {
  static watchId = null;
  static currentOptions = null;

  // Request location permissions
  static async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'SmartBus Driver Location Permission',
            message: 'This app needs access to your location to track the bus position for passengers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          return true;
        } else {
          console.log('Location permission denied');
          return false;
        }
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    } else {
      // iOS permissions are handled automatically by the library
      return true;
    }
  }

  // Request background location permission (Android 10+)
  static async requestBackgroundPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Location Permission',
            message: 'This app needs background location access to continue tracking when the app is minimized.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error requesting background location permission:', err);
        return false;
      }
    }
    return true; // iOS or older Android versions
  }

  // Get current location once
  static async getCurrentLocation() {
    return new Promise(async (resolve, reject) => {
      const hasPermission = await this.requestLocationPermission();
      
      if (!hasPermission) {
        reject(new Error('Location permission not granted'));
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            bearing: position.coords.heading,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  // Start continuous location tracking
  static async startTracking({ onLocationUpdate, onError, interval = 10000 }) {
    const hasPermission = await this.requestLocationPermission();
    
    if (!hasPermission) {
      onError && onError(new Error('Location permission not granted'));
      return false;
    }

    // Skip background permission for now - using foreground only
    // await this.requestBackgroundPermission();

    this.currentOptions = { onLocationUpdate, onError, interval };

    // Stop any existing tracking
    this.stopTracking();

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          bearing: position.coords.heading,
          timestamp: position.timestamp,
        };

        console.log('Location update:', locationData);
        onLocationUpdate && onLocationUpdate(locationData);
      },
      (error) => {
        console.error('Location tracking error:', error);
        onError && onError(error);
        
        // Try to restart tracking after error
        setTimeout(() => {
          if (this.currentOptions) {
            console.log('Attempting to restart location tracking...');
            this.startTracking(this.currentOptions);
          }
        }, 5000);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5, // Minimum distance (in meters) to trigger update
        interval: interval,
        fastestInterval: Math.max(5000, interval / 2), // Fastest update interval
        forceRequestLocation: true,
        forceLocationManager: false,
        showLocationDialog: true,
        useSignificantChanges: false,
      }
    );

    console.log(`Started location tracking with interval: ${interval}ms`);
    return true;
  }

  // Stop location tracking
  static stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.currentOptions = null;
      console.log('Stopped location tracking');
    }
  }

  // Check if location services are enabled
  static async isLocationEnabled() {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === 1) {
            // PERMISSION_DENIED
            resolve(false);
          } else if (error.code === 2) {
            // POSITION_UNAVAILABLE - location services disabled
            resolve(false);
          } else {
            // TIMEOUT or other error
            resolve(true); // Assume enabled but temporary issue
          }
        },
        { timeout: 1000, enableHighAccuracy: false }
      );
    });
  }

  // Show location settings dialog
  static showLocationSettings() {
    Alert.alert(
      'Location Services Required',
      'Please enable location services in your device settings to use GPS tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Settings', 
          onPress: () => {
            // This would ideally open device settings
            // You might need to use a library like react-native-android-open-settings
            console.log('Open location settings');
          }
        }
      ]
    );
  }
}

export default LocationService;