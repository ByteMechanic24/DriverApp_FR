import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../services/ApiService';

const BusSelectionScreen = ({ navigation, route }) => {
  const { selectedDriver } = route.params;
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    fetchAvailableBuses();
  }, []);

  const fetchAvailableBuses = async () => {
    try {
      const response = await ApiService.getAvailableBuses();
      if (response.success) {
        setBuses(response.buses);
      } else {
        Alert.alert('Error', 'Failed to load available buses');
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
  };

  const handleStartTracking = async () => {
    if (!selectedBus) {
      Alert.alert('Please Select', 'Please select a bus to continue');
      return;
    }

    setStartingSession(true);
    try {
      const response = await ApiService.startTracking({
        driverId: selectedDriver.driver_id,
        busId: selectedBus.bus_id
      });

      if (response.success) {
        navigation.navigate('Tracking', {
          selectedDriver: selectedDriver,
          selectedBus: selectedBus,
          session: response.session
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to start tracking');
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking session');
    } finally {
      setStartingSession(false);
    }
  };

  const renderBusItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.busCard,
        selectedBus?.bus_id === item.bus_id && styles.selectedBusCard
      ]}
      onPress={() => handleBusSelect(item)}
    >
      <View style={styles.busInfo}>
        <View style={styles.busIcon}>
          <Icon name="bus" size={32} color="#8E4DFF" />
        </View>
        <View style={styles.busDetails}>
          <Text style={styles.busNumber}>{item.bus_number}</Text>
          <Text style={styles.busCapacity}>Capacity: {item.capacity} passengers</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>
        {selectedBus?.bus_id === item.bus_id && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E4DFF" />
          <Text style={styles.loadingText}>Loading available buses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <Icon name="account-circle" size={32} color="#8E4DFF" />
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{selectedDriver.driver_name}</Text>
            <Text style={styles.driverSubtext}>Driver ID: {selectedDriver.driver_id}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Your Bus</Text>
        <Text style={styles.sectionSubtitle}>Choose the bus you'll be driving today</Text>

        {buses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="bus-off" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No buses available</Text>
            <Text style={styles.emptySubtext}>Please contact your supervisor</Text>
          </View>
        ) : (
          <FlatList
            data={buses}
            renderItem={renderBusItem}
            keyExtractor={item => item.bus_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.busList}
          />
        )}
      </View>

      {buses.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startButton, 
              (!selectedBus || startingSession) && styles.disabledButton
            ]}
            onPress={handleStartTracking}
            disabled={!selectedBus || startingSession}
          >
            {startingSession ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.startButtonText}>Starting...</Text>
              </>
            ) : (
              <>
                <Icon name="play" size={20} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start Tracking</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverDetails: {
    marginLeft: 10,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  driverSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  busList: {
    paddingBottom: 20,
  },
  busCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedBusCard: {
    borderColor: '#8E4DFF',
    borderWidth: 2,
    backgroundColor: '#F3F0FF',
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIcon: {
    marginRight: 15,
  },
  busDetails: {
    flex: 1,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  busCapacity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default BusSelectionScreen;