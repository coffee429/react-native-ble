import React, {useEffect, useState} from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {styles} from './AppStyles';
import useBLE from './useBLE';

function App(): React.JSX.Element {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const isDarkMode = useColorScheme() === 'dark';

  const {
    scanForDevices,
    allDevices,
    requestPermissions,
    connectToDevice,
    connectedDevice,
  } = useBLE();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    color: 'white',
  };

  useEffect(() => {
    scanForDevices();
  }, [isScanning]);

  const toggleScanning = async () => {
    requestPermissions((isGranted: boolean) => {
      alert(`Permission granted? ${isGranted}`);
    });
    const state = !isScanning;
    if (state) {
      scanForDevices();
    }
    setIsScanning(state);
  };

  // allDevices.forEach(device => console.log(device.name));
  console.log(connectedDevice?.name);
  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={styles.container}>
          <Text style={styles.text}>Bluetooth connector project</Text>
          <View>
            <Button title="Connect bluetooth" onPress={toggleScanning} />
            {allDevices
              .filter(device => device.name)
              .map((device, index) => (
                <View id={index.toString()} style={styles.peripheralButton}>
                  <Button
                    color="#008000"
                    title={device.name ? device.name : ''}
                    onPress={() => connectToDevice(device)}></Button>
                </View>
              ))}
            {/* <Button>{allDevices.map(device => device.name)}</Button> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
