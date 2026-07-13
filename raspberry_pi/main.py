"""
main.py — NexDose Raspberry Pi Dispense Controller
=====================================================
Architecture:
  Frontend (Kiosk) → Firebase RTDB (currentJob) → THIS SCRIPT → Serial → Arduino

RTDB path  : dispensers/SYS-001/queue/currentJob
Device ID  : SYS-001
Status flow: pending → processing → complete | error

Run:
    python3 main.py
"""

import logging
import os
import sys
import time

import firebase_admin
from firebase_admin import credentials, db
import serial
import serial.tools.list_ports

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("nexdose")

# ─── Constants ────────────────────────────────────────────────────────────────

DEVICE_ID    = "SYS-001"
RTDB_PATH    = f"dispensers/{DEVICE_ID}/queue/currentJob"

# Candidate serial ports — first one found and openable wins
SERIAL_CANDIDATES = ["/dev/ttyUSB0", "/dev/ttyACM0", "/dev/ttyUSB1", "/dev/ttyACM1"]
BAUD_RATE         = 9600
SERIAL_TIMEOUT    = 3          # seconds — matches CONFIRM_TIMEOUT_MS on ESP32 side
POLL_INTERVAL     = 1          # seconds between RTDB polls
SERVICE_ACCOUNT   = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

# ─── Firebase initialisation ──────────────────────────────────────────────────

def init_firebase() -> db.Reference:
    """
    Initialise Firebase Admin SDK and return a reference to the RTDB job node.
    Exits with a clear error message if the credentials file is missing or the
    databaseURL is still the placeholder.
    """
    if not os.path.isfile(SERVICE_ACCOUNT):
        log.error(
            "serviceAccountKey.json not found at: %s\n"
            "Download it from Firebase Console → Project Settings → Service Accounts.",
            SERVICE_ACCOUNT,
        )
        sys.exit(1)

    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT)
    except ValueError as exc:
        log.error("Invalid serviceAccountKey.json: %s", exc)
        sys.exit(1)

    # Read databaseURL from the service-account file so it is never hardcoded.
    # Override here if your project uses a non-default region.
    import json
    with open(SERVICE_ACCOUNT) as f:
        sa = json.load(f)
    project_id = sa.get("project_id", "")
    if not project_id:
        log.error("Could not read project_id from serviceAccountKey.json.")
        sys.exit(1)

    database_url = f"https://{project_id}-default-rtdb.firebaseio.com/"
    log.info("Connecting to Firebase RTDB: %s", database_url)

    firebase_admin.initialize_app(cred, {"databaseURL": database_url})
    job_ref = db.reference(RTDB_PATH)
    log.info("Firebase initialised. Watching RTDB path: %s", RTDB_PATH)
    return job_ref

# ─── Serial port auto-detection ───────────────────────────────────────────────

def open_serial() -> serial.Serial:
    """
    Try each candidate port in order. Returns the first one that opens.
    Falls back to auto-detecting any connected USB-serial device.
    Exits if no port is available.
    """
    # Try known candidates first
    for port in SERIAL_CANDIDATES:
        try:
            ser = serial.Serial(port, BAUD_RATE, timeout=SERIAL_TIMEOUT)
            log.info("Serial port opened: %s @ %d baud", port, BAUD_RATE)
            time.sleep(2)   # Give Arduino time to reset after DTR toggle
            return ser
        except (serial.SerialException, OSError):
            pass

    # Auto-detect any USB-serial adapter
    available = [p.device for p in serial.tools.list_ports.comports()
                 if "USB" in (p.description or "") or "ACM" in (p.device or "")]
    for port in available:
        try:
            ser = serial.Serial(port, BAUD_RATE, timeout=SERIAL_TIMEOUT)
            log.info("Auto-detected serial port: %s @ %d baud", port, BAUD_RATE)
            time.sleep(2)
            return ser
        except (serial.SerialException, OSError):
            pass

    log.error(
        "No Arduino serial port found. Tried: %s\n"
        "Check USB connection and that the device appears in /dev/.",
        SERIAL_CANDIDATES + available,
    )
    sys.exit(1)

# ─── Dispense a single item ───────────────────────────────────────────────────

def dispense_item(arduino: serial.Serial, slot_1indexed: int, quantity: int) -> bool:
    """
    Send a dispense command for one medicine slot and wait for Arduino ACK.

    The ESP32/Arduino firmware uses a 0-indexed slot array (servos[slotIndex]).
    The frontend stores slotNumber as 1-indexed (Firestore field: slotId/slotNumber).
    We therefore subtract 1 before sending.

    Command format : "<slot_0indexed>\\n"   e.g. "0\\n" for slot 1
    Expected ACK   : any non-empty line     e.g. "OK" or "DISPENSED"

    Returns True if every unit received an ACK, False if any timed out.
    """
    slot_0indexed = slot_1indexed - 1   # BUG FIX: convert 1-indexed → 0-indexed

    if slot_0indexed < 0 or slot_0indexed > 3:
        log.warning("Slot %d (0-indexed) is out of range [0-3]. Skipping.", slot_0indexed)
        return False

    all_ok = True
    for unit in range(quantity):
        command = f"{slot_0indexed}\n"
        log.info(
            "  → Sending slot command: %r  (slot %d, unit %d/%d)",
            command.strip(), slot_1indexed, unit + 1, quantity,
        )
        try:
            arduino.write(command.encode())
            response = arduino.readline().decode(errors="replace").strip()
            if response:
                log.info("  ← Arduino ACK: %s", response)
            else:
                log.warning("  ← No response from Arduino (timeout). Continuing.")
                all_ok = False
        except serial.SerialTimeoutException:
            log.warning("  ← Serial write timeout on slot %d unit %d.", slot_1indexed, unit + 1)
            all_ok = False
        except serial.SerialException as exc:
            log.error("  ← Serial error: %s", exc)
            raise exc

    return all_ok

# ─── Process one complete job ─────────────────────────────────────────────────

def process_job(job_ref: db.Reference, job: dict, arduino: serial.Serial) -> None:
    """
    Execute a full dispense job:
      1. Set status → processing
      2. Iterate items, send serial commands
      3. Set status → complete | error
    """
    job_id = job.get("jobId", "unknown")
    log.info("Processing job: %s", job_id)

    # BUG FIX: was item["compartmentSlot"] — correct key is item["slot"]
    items = job.get("items", [])
    if isinstance(items, dict):
        items = list(items.values())

    if not items:
        log.warning("Job %s has no items. Marking complete.", job_id)
        job_ref.update({"status": "complete", "completedAt": int(time.time() * 1000)})
        return

    # Mark as processing so the kiosk shows the dispensing screen
    try:
        job_ref.update({"status": "processing"})
    except Exception as exc:
        log.error("Failed to update status to processing: %s", exc)
        return

    all_success = True
    for item in items:
        if not isinstance(item, dict):
            log.warning("Expected item to be a dictionary, got %s. Skipping.", type(item))
            all_success = False
            continue
        # BUG FIX: key is "slot", not "compartmentSlot"
        slot = item.get("slot")
        quantity = item.get("quantity", 1)
        name = item.get("medicineName", f"slot {slot}")

        if slot is None:
            log.warning("Item missing 'slot' field: %s — skipping.", item)
            all_success = False
            continue

        log.info("Dispensing: %s  slot=%s  qty=%s", name, slot, quantity)
        try:
            ok = dispense_item(arduino, int(slot), int(quantity))
            if not ok:
                log.warning("Item %s did not fully ACK.", name)
                all_success = False
        except serial.SerialException as exc:
            log.error("Serial port exception encountered during dispense: %s", exc)
            raise exc

    # Update final status — both "complete" and "error" are handled by the
    # Kiosk RTDB listener and by piService.ts status mapping
    final_status = "complete" if all_success else "error"
    try:
        job_ref.update({
            "status": final_status,
            "completedAt": int(time.time() * 1000),
        })
        log.info("Job %s finished with status: %s", job_id, final_status)
    except Exception as exc:
        log.error("Failed to update final status for job %s: %s", job_id, exc)

# ─── Main polling loop ────────────────────────────────────────────────────────

def main() -> None:
    log.info("NexDose Pi Controller starting — Device: %s", DEVICE_ID)

    job_ref = init_firebase()
    arduino = None

    log.info("Waiting for dispense jobs on: %s", RTDB_PATH)

    while True:
        try:
            # Automatic Serial Connection & Reconnection
            if arduino is None or not arduino.is_open:
                log.info("Attempting to connect/reconnect to Arduino...")
                try:
                    if arduino:
                        arduino.close()
                except Exception:
                    pass
                arduino = open_serial()

            job = job_ref.get()

            if job and job.get("status") == "pending":
                process_job(job_ref, job, arduino)
            else:
                # Nothing to do — stay quiet
                pass

        except KeyboardInterrupt:
            log.info("Interrupted by user. Exiting.")
            break

        except serial.SerialException as exc:
            log.error("Serial port error: %s. Reconnecting in %ds...", exc, POLL_INTERVAL * 5)
            try:
                if arduino:
                    arduino.close()
            except Exception:
                pass
            arduino = None
            time.sleep(POLL_INTERVAL * 5)

        except firebase_admin.exceptions.FirebaseError as exc:
            log.error("Firebase error: %s — retrying in %ds.", exc, POLL_INTERVAL * 5)
            time.sleep(POLL_INTERVAL * 5)

        except Exception as exc:
            log.error("Unexpected error in main loop: %s — retrying.", exc, exc_info=True)
            time.sleep(POLL_INTERVAL)

        time.sleep(POLL_INTERVAL)

    try:
        if arduino:
            arduino.close()
            log.info("Serial port closed.")
    except Exception:
        pass

if __name__ == "__main__":
    main()
