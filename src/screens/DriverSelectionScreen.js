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

const DriverSelectionScreen = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await ApiService.getDriverList();
      if (response.success) {
        setDrivers(response.drivers);
      } else {
        Alert.alert('Error', 'Failed to load drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
  };

  const handleContinue = () => {
    if (!selectedDriver) {
      Alert.alert('Please Select', 'Please select a driver to continue');
      return;
    }

    navigation.navigate('BusSelection', { 
      selectedDriver: selectedDriver 
    });
  };

  const renderDriverItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.driverCard,
        selectedDriver?.driver_id === item.driver_id && styles.selectedDriverCard
      ]}
      onPress={() => handleDriverSelect(item)}
    >
      <View style={styles.driverInfo}>
        <View style={styles.driverAvatar}>
          <Icon name="account-circle" size={40} color="#8E4DFF" />
        </View>
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{item.driver_name}</Text>
          <Text style={styles.driverSubtext}>Driver ID: {item.driver_id}</Text>
        </View>
        {selectedDriver?.driver_id === item.driver_id && (
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
          <Text style={styles.loadingText}>Loading drivers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon name="account-group" size={48} color="#8E4DFF" />
        <Text style={styles.title}>Select Your Profile</Text>
        <Text style={styles.subtitle}>Choose your driver profile to continue</Text>
      </View>

      <View style={styles.driversContainer}>
        <FlatList
          data={drivers}
          renderItem={renderDriverItem}
          keyExtractor={item => item.driver_id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.driversList}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedDriver && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedDriver}
        >
          <Text style={styles.continueButtonText}>
            Continue
          </Text>
          <Icon name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  driversContainer: {
    flex: 1,
    padding: 20,
  },
  driversList: {
    paddingBottom: 20,
  },
  driverCard: {
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
  selectedDriverCard: {
    borderColor: '#8E4DFF',
    borderWidth: 2,
    backgroundColor: '#F3F0FF',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
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
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#8E4DFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default DriverSelectionScreen;