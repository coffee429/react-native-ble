import {useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
import DeviceInfo from 'react-native-device-info';
import {PERMISSIONS, requestMultiple} from 'react-native-permissions';

const bleManager = new BleManager();
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

type PermissionCallback = (result: boolean) => void;

interface BluetoothLowEnergyApi {
  scanForDevices(): void;
  allDevices: Device[];
  requestPermissions(callback: PermissionCallback): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  connectedDevice: Device | null;
  sendMessage: (message: string) => Promise<void>;
}

export default function useBLE(): BluetoothLowEnergyApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) => {
    return devices.findIndex(device => nextDevice.id === device.id) > -1;
  };

  const scanForDevices = () => {
    console.log('Scanning...');
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
      }
      if (device) {
        setAllDevices(prevState => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  };

  const requestPermissions = async (callback: PermissionCallback) => {
    if (Platform.OS === 'android') {
      const apiLevel = await DeviceInfo.getApiLevel();
      console.log(`Api level: ${apiLevel}`);
      if (apiLevel < 31) {
        const grantedStatus = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy Needs Location Permission',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
            buttonNeutral: 'Maybe Later',
          },
        );
        callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]);

        const isAllPermissionGranted =
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;

        callback(isAllPermissionGranted);
      }
    } else {
      callback(true);
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await device.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
    } catch (e) {
      console.log('ERROR IN CONNECTION', e);
    }
  };

  const sendMessage = async (message: string) => {
    try {
      // Get the connected device
      const services = await connectedDevice?.services();
      const service = services?.find(s => s.uuid === SERVICE_UUID);

      if (!service) {
        throw new Error('Service not found');
      }

      const characteristics = await service.characteristics();
      const characteristic = characteristics.find(
        c => c.uuid === CHARACTERISTIC_UUID,
      );

      if (!characteristic) {
        throw new Error('Characteristic not found');
      }

      const base64Message = btoa(message);

      await characteristic.writeWithResponse(base64Message);
      console.log(`Message sent: ${message}`);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    scanForDevices,
    allDevices,
    requestPermissions,
    connectToDevice,
    connectedDevice,
    sendMessage,
  };
}
