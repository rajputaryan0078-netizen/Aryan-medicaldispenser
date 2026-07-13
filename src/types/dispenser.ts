export type CompartmentStatus = 'full' | 'low' | 'empty' | 'dispensing';
export type DeviceStatus = 'online' | 'offline' | 'syncing' | 'error';
export type FirebaseStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface Compartment {
  id: string;
  index: number;
  label: string;
  medicineId: string | null;
  medicineName: string | null;
  capacity: number;
  current: number;
  status: CompartmentStatus;
  lastDispensed: string | null;
  color: string;
}

export interface ServoMotor {
  id: string;
  compartmentIndex: number;
  angle: number;
  isActive: boolean;
  lastTriggered: string | null;
}

export interface ESP32Telemetry {
  deviceId: string;
  firmwareVersion: string;
  uptime: number;
  cpuTemp: number;
  freeHeap: number;
  wifiRssi: number;
  wifiSsid: string;
  ipAddress: string;
  status: DeviceStatus;
  lastSeen: string;
}

export interface DispenserDevice {
  id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  firebaseStatus: FirebaseStatus;
  compartments: Compartment[];
  servos: ServoMotor[];
  telemetry: ESP32Telemetry;
  createdAt: string;
  updatedAt: string;
}

export interface DispenseLog {
  id: string;
  deviceId: string;
  compartmentId: string;
  medicineId: string;
  medicineName: string;
  patientId: string;
  patientName: string;
  prescribedBy: string;
  dosage: string;
  dispensedAt: string;
  status: 'success' | 'failed' | 'partial';
  latencyMs: number;
}

export interface InventoryAlert {
  id: string;
  compartmentId: string;
  medicineId: string;
  medicineName: string;
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical';
  createdAt: string;
}

export interface SystemStats {
  dispenseAccuracy: number;
  avgSyncLatencyMs: number;
  totalDispensesToday: number;
  activeDevices: number;
  totalPatients: number;
  criticalAlerts: number;
}

export interface FloatingNodeData {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status: 'nominal' | 'warning' | 'critical';
  position: [number, number, number];
  icon?: string;
}

export interface HeroStat {
  value: string;
  label: string;
  sublabel: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  tag: string;
  gradient: string;
}

export interface WorkflowStep {
  id: string;
  step: number;
  actor: string;
  description: string;
  icon: string;
  color: string;
}

export interface TechStack {
  category: string;
  items: TechItem[];
}

export interface TechItem {
  name: string;
  description: string;
  icon: string;
  color: string;
}
