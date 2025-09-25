import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverSelectionScreen from './src/screens/DriverSelectionScreen';
import BusSelectionScreen from './src/screens/BusSelectionScreen';
import TrackingScreen from './src/screens/TrackingScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="DriverSelection"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#8E4DFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="DriverSelection" 
          component={DriverSelectionScreen}
          options={{ title: 'SmartBus Driver' }}
        />
        <Stack.Screen 
          name="BusSelection" 
          component={BusSelectionScreen}
          options={{ title: 'Select Bus' }}
        />
        <Stack.Screen 
          name="Tracking" 
          component={TrackingScreen}
          options={{ 
            title: 'GPS Tracking',
            headerBackVisible: false // Prevent going back while tracking
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;