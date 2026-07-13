/**
 * device.ts
 * Central device configuration for NexDose.
 *
 * Every file that needs the device ID or RTDB path MUST import from here
 * instead of hardcoding strings.
 */

export const DEVICE_ID = "SYS-001";
export const RTDB_PATH = `dispensers/${DEVICE_ID}/queue/currentJob`;
