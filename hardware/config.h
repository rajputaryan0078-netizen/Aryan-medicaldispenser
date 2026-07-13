#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Configuration
// e.g. nexdose-f9a1c-default-rtdb.firebaseio.com
#define FIREBASE_HOST "nexdose-f9a1c-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET_OR_AUTH_TOKEN"

// Device Configuration
#define DEVICE_ID "dispenser_01"

// Servo pin mapping (GPIOs supporting PWM)
#define SERVO_PIN_0 13
#define SERVO_PIN_1 12
#define SERVO_PIN_2 14
#define SERVO_PIN_3 27

// Photoresistor/LDR pin mapping (digital inputs)
#define PHOTO_PIN_0 34
#define PHOTO_PIN_1 35
#define PHOTO_PIN_2 32
#define PHOTO_PIN_3 33

// Servo Angles
#define SERVO_OPEN_ANGLE 90
#define SERVO_CLOSE_ANGLE 0

// Timing Configurations
#define DISPENSE_HOLD_MS 2000
#define CONFIRM_TIMEOUT_MS 3000

#endif // CONFIG_H
