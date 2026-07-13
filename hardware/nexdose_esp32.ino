#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include "config.h"

// LED pin
const int LED_PIN = 2;

// Arrays for pins
const int servoPins[4] = {SERVO_PIN_0, SERVO_PIN_1, SERVO_PIN_2, SERVO_PIN_3};
const int photoPins[4] = {PHOTO_PIN_0, PHOTO_PIN_1, PHOTO_PIN_2, PHOTO_PIN_3};

// Servos array
Servo servos[4];

// Firebase objects
FirebaseData firebaseData;
FirebaseData streamData;

// Function declarations
void handleDispense(String orderId, int slotIndex);
bool waitForPillDrop(int slotIndex);
void updateStock(int slotIndex);
void logDispense(int slotIndex, String status);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize photoresistors as INPUT
  for (int i = 0; i < 4; i++) {
    pinMode(photoPins[i], INPUT);
  }

  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  // Start stream to listen for new orders in the queue
  String queuePath = "/dispensers/" + String(DEVICE_ID) + "/queue";
  if (!Firebase.beginStream(streamData, queuePath)) {
    Serial.println("ERROR: Could not start Firebase RTDB stream: " + streamData.errorReason());
  } else {
    Serial.println("RTDB Stream started. Listening on: " + queuePath);
  }
}

void loop() {
  // Check stream availability
  if (!Firebase.readStream(streamData)) {
    Serial.println("Stream read error: " + streamData.errorReason());
    delay(1000);
    return;
  }

  if (streamData.streamTimeout()) {
    Serial.println("Stream timeout, resuming...");
    return;
  }

  // Handle stream data updates
  if (streamData.streamAvailable()) {
    String path = streamData.dataPath();
    String type = streamData.dataType();

    // Trigger when a new path under the queue is updated/added
    if (type == "json") {
      FirebaseJson &json = streamData.jsonObject();
      FirebaseJsonData jsonData;
      
      // Parse entire queue changes
      size_t len = json.iteratorBegin();
      String key, value;
      int typeNum = 0;
      
      for (size_t i = 0; i < len; i++) {
        json.iteratorGet(i, typeNum, key, value);
        if (typeNum == FirebaseJson::JSON_OBJECT) {
          // Check if status is "pending"
          FirebaseJsonData statusData;
          json.get(statusData, key + "/status");
          if (statusData.success && statusData.stringValue == "pending") {
            FirebaseJsonData slotData;
            json.get(slotData, key + "/compartmentSlot");
            if (slotData.success) {
              int slot = slotData.intValue;
              handleDispense(key, slot);
            }
          }
        }
      }
      json.iteratorEnd();
    } else if (path != "/" && path.endsWith("/status")) {
      // Direct field update (e.g. status changed to pending)
      if (streamData.stringValue() == "pending") {
        // Retrieve the parent order ID
        String orderId = path.substring(1, path.lastIndexOf("/"));
        String orderPath = "/dispensers/" + String(DEVICE_ID) + "/queue/" + orderId;
        
        if (Firebase.getJSON(firebaseData, orderPath)) {
          FirebaseJson &json = firebaseData.jsonObject();
          FirebaseJsonData slotData;
          json.get(slotData, "compartmentSlot");
          if (slotData.success) {
            handleDispense(orderId, slotData.intValue);
          }
        }
      }
    }
  }
}

void handleDispense(String orderId, int slotIndex) {
  if (slotIndex < 0 || slotIndex >= 4) {
    Serial.print("ERROR: Invalid compartment slot: ");
    Serial.println(slotIndex);
    return;
  }

  Serial.println("\n----------------------------------------");
  Serial.print("NEW DISPENSE COMMAND: Order ID: ");
  Serial.print(orderId);
  Serial.print(" | Slot Index: ");
  Serial.println(slotIndex);

  // Status update path
  String statusPath = "/dispensers/" + String(DEVICE_ID) + "/queue/" + orderId + "/status";

  // Update status to "dispensing"
  Firebase.setString(firebaseData, statusPath, "dispensing");

  // Blink LED to indicate action
  digitalWrite(LED_PIN, HIGH);

  // Attach servo dynamically to prevent jitter when idle
  servos[slotIndex].attach(servoPins[slotIndex]);
  
  // Trigger Servo to OPEN position
  Serial.print("Opening servo for compartment ");
  Serial.println(slotIndex + 1);
  servos[slotIndex].write(SERVO_OPEN_ANGLE);

  // Check for pill drop using photoresistor
  bool dropConfirmed = waitForPillDrop(slotIndex);

  // Wait remaining hold time or hold open
  delay(DISPENSE_HOLD_MS);

  // Close Servo
  Serial.println("Closing servo...");
  servos[slotIndex].write(SERVO_CLOSE_ANGLE);
  delay(500); // Wait for servo to reach position
  servos[slotIndex].detach();

  digitalWrite(LED_PIN, LOW);

  if (dropConfirmed) {
    Serial.println("Dispensation SUCCESSFUL: Pill drop confirmed.");
    Firebase.setString(firebaseData, statusPath, "dispensed");
    updateStock(slotIndex);
    logDispense(slotIndex, "Success");
  } else {
    Serial.println("Dispensation FAILED: No pill drop detected within 3 seconds.");
    Firebase.setString(firebaseData, statusPath, "failed");
    logDispense(slotIndex, "Failure");
  }
  Serial.println("----------------------------------------");
}

bool waitForPillDrop(int slotIndex) {
  int sensorPin = photoPins[slotIndex];
  unsigned long startTime = millis();
  
  Serial.println("Waiting for pill drop detection...");
  
  // Sample the baseline first (light state vs covered/dark state)
  // Assumes pill drop causes a quick state change (photoresistor blockage)
  while (millis() - startTime < CONFIRM_TIMEOUT_MS) {
    // Read sensor: assuming active-high or active-low block triggers change
    // LDR in voltage divider: block light -> resistance up -> pin state changes
    if (digitalRead(sensorPin) == LOW) { // Low indicates laser/LED beam broken
      return true;
    }
    
    // Quick LED blinking during wait
    digitalWrite(LED_PIN, (millis() / 100) % 2);
    delay(10);
  }
  return false;
}

void updateStock(int slotIndex) {
  // Slot ID in DB is 1-indexed (slotIndex + 1)
  String stockPath = "/medicines/slot_" + String(slotIndex + 1) + "/stock";
  int currentStock = 0;
  
  if (Firebase.getInt(firebaseData, stockPath)) {
    currentStock = firebaseData.intData();
    if (currentStock > 0) {
      Firebase.setInt(firebaseData, stockPath, currentStock - 1);
      Serial.print("Decremented stock for slot ");
      Serial.print(slotIndex + 1);
      Serial.print(" to ");
      Serial.println(currentStock - 1);
    }
  } else {
    Serial.println("Failed to read current stock levels: " + firebaseData.errorReason());
  }
}

void logDispense(int slotIndex, String status) {
  String logPath = "/logs";
  FirebaseJson logData;
  
  // Format transaction timestamp (placeholder or device uptime)
  logData.set("slot", slotIndex + 1);
  logData.set("status", status);
  logData.set("deviceId", DEVICE_ID);
  logData.set("timestamp", String(millis() / 1000) + " seconds uptime");

  if (Firebase.pushJSON(firebaseData, logPath, logData)) {
    Serial.println("Dispense transaction logged to Firebase RTDB.");
  } else {
    Serial.println("Failed to log transaction: " + firebaseData.errorReason());
  }
}
