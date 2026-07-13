# NexDose ESP32 Hardware Integration Guide

This guide describes how to configure, wire, and flash the ESP32 micro-controller to drive the servo motors and photoresistor drop detectors for the NexDose automatic medicine dispenser.

## Specs & Hardware

*   **Board**: ESP32 DevKit v1
*   **Servos**: SG90 Micro Servo Motors (x4)
*   **Detectors**: Light Dependent Resistors (LDR / Photoresistors) (x4)
*   **Indication**: Onboard Blue LED (GPIO 2)

---

## Wiring Diagram

| Component | Pin (ESP32 GPIO) | Description | Power / GND |
| :--- | :--- | :--- | :--- |
| **Servo 0** | GPIO 13 | Compartment 1 Servo Signal | 5V / GND |
| **Servo 1** | GPIO 12 | Compartment 2 Servo Signal | 5V / GND |
| **Servo 2** | GPIO 14 | Compartment 3 Servo Signal | 5V / GND |
| **Servo 3** | GPIO 27 | Compartment 4 Servo Signal | 5V / GND |
| **Photoresistor 0** | GPIO 34 | Compartment 1 Drop Detector | 3.3V / GND (via 10k divider) |
| **Photoresistor 1** | GPIO 35 | Compartment 2 Drop Detector | 3.3V / GND (via 10k divider) |
| **Photoresistor 2** | GPIO 32 | Compartment 3 Drop Detector | 3.3V / GND (via 10k divider) |
| **Photoresistor 3** | GPIO 33 | Compartment 4 Drop Detector | 3.3V / GND (via 10k divider) |

> [!NOTE]
> Ensure the SG90 servo power lines are connected to a high-enough power source (e.g. 5V VBUS/VIN pin), as running four servos from the ESP32's onboard 3.3V rail may cause brownouts. LDRs should be set up in a standard voltage divider configuration with a 10k resistor pulling to GND, feeding the junction to the GPIO input.

---

## Setup & Configuration

1.  **Open Project**: Open the `hardware/nexdose_esp32.ino` sketch using the Arduino IDE.
2.  **Edit Configuration**: Open the `config.h` tab/file and configure your credentials:
    ```cpp
    #define WIFI_SSID "YOUR_SSID"
    #define WIFI_PASSWORD "YOUR_PASSWORD"
    #define FIREBASE_HOST "nexdose-f9a1c-default-rtdb.firebaseio.com"
    #define FIREBASE_AUTH "YOUR_SECRET_KEY"
    ```
3.  **Install Required Libraries**: Go to **Tools > Manage Libraries** and install:
    *   **Firebase ESP32 Client** (by Mobizt)
    *   **ESP32Servo** (by John K. Bennett)
    *   **ArduinoJson** (by Benoit Blanchon)

---

## Flashing Instructions

1.  Connect your ESP32 board to your PC via a Micro-USB cable.
2.  In the Arduino IDE, go to **Tools > Board** and select **DOIT ESP32 DEVKIT V1** (or generic **ESP32 Dev Module**).
3.  Go to **Tools > Port** and select the active COM/Serial port.
4.  Click the **Upload** arrow button (or press `Ctrl+U`).
5.  If compilation succeeds but uploading waits with `Connecting...___`, press and hold the **BOOT/FLASH** button on the ESP32 board until the flashing percentage begins.

---

## Troubleshooting

*   **Failed to connect to WiFi**: Ensure your SSID and Password are correct. The ESP32 only supports **2.4 GHz WiFi networks**; 5 GHz connections will fail.
*   **Firebase stream read timeout**: Verify your database credentials in `config.h`. Double check that your Database Secret is active in **Firebase Console > Project Settings > Service Accounts > Database Secrets**.
*   **Servos twitching/jittering**: Jittering is common when feeding insufficient power to the servos. Ensure you are powering the SG90s with a dedicated 5V source and sharing a common GND with the ESP32.
