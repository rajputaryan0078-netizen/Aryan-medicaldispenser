# NexDose ESP32 — Hardware Implementation Summary

## 1. Network & Cloud Connectivity

- WiFi connects to 2.4GHz network using credentials from config.h
- Firebase RTDB stream initialized on /dispensers/{deviceId}/queue
- Persistent stream catches incoming prescription orders in real-time

## 2. State & Dispense Orchestration

- Filters queue items where status == "pending"
- Status pipeline: pending → dispensing → dispensed / failed
- SG90 servo: attach → SERVO_OPEN_ANGLE (90°) → hold 2s → 
  SERVO_CLOSE_ANGLE (0°) → detach (prevents jitter)
- Onboard LED (GPIO 2) blinks rapidly during active dispensing

## 3. Feedback Loop & Inventory Management

- Photoresistor polls for up to 3s (CONFIRM_TIMEOUT_MS)
- LOW signal = pill broke light beam = confirmed drop
- On confirm: decrements /medicines/slot_{N}/stock by 1 in RTDB
- Pushes log to /logs: { slot, status, deviceId, timestamp }
- On timeout: sets status to "failed", no stock decrement

## Pin Mapping (from config.h)

| Function         | Pin Constant  |
|-----------------|---------------|
| Servo slot 0    | SERVO_PIN_0   |
| Servo slot 1    | SERVO_PIN_1   |
| Servo slot 2    | SERVO_PIN_2   |
| Servo slot 3    | SERVO_PIN_3   |
| Photoresistor 0 | PHOTO_PIN_0   |
| Photoresistor 1 | PHOTO_PIN_1   |
| Photoresistor 2 | PHOTO_PIN_2   |
| Photoresistor 3 | PHOTO_PIN_3   |
| Status LED      | GPIO 2        |

## Timing Constants

| Constant           | Value  | Purpose                    |
|-------------------|--------|----------------------------|
| SERVO_OPEN_ANGLE  | 90°    | Door open position         |
| SERVO_CLOSE_ANGLE | 0°     | Door closed position       |
| DISPENSE_HOLD_MS  | 2000ms | Hold door open duration    |
| CONFIRM_TIMEOUT_MS| 3000ms | Max wait for pill confirm  |
