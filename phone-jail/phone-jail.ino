/*
  Phone jail — you built your own enemy

  BOARD: Arduino Nano (same as the feeder)
  Drop YOUR phone in the box. Short press = the latch closes
  for 25 minutes (pomodoro). When the timer dies the bar
  slides open. Hold 2 seconds = emergency unlock. You will
  feel shame. That is the spec.

  Only your phone. Do not jail someone else's.

  1 SERVO
  -------
  Latch  D9   OPEN  = slot clear, phone can come out
              SHUT  = cardboard bar across the opening

  MOUNT
  -----
  1. Shoebox or snack box, phone-sized.
  2. Cut a slot in the lid. Servo inside. Horn = cardboard
     bar that slides over the slot.
  3. Optional USB hole in the side so it can still charge.
     The jail is about attention, not theft.
  4. Nano + battery taped under the lid. Button on the
     OUTSIDE. If the button is inside, you already lost.

        [ bar / latch ]
     =================== lid
        phone
     [ Nano ]  (button on the outside)

  WIRING
  ------
  Servo        orange → D9
               brown  → GND
               red    → 5V pack (share GND)
  Button       D2 → button → GND
  LED onboard  D13 on while locked

  HOW TO USE
  ----------
  1. Upload. Short press. Bar should close. Wait, or hold
     2 seconds to open it again.
  2. If shut / open are backwards, swap LATCH_OPEN and
     LATCH_SHUT.
  3. Change LOCK_MS if 25 minutes is too kind or too mean.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int SERVO_PIN  = 9;
const int LED_PIN    = 13;

const int LATCH_OPEN = 30;
const int LATCH_SHUT = 120;

const int MOVE_MS = 400;
const unsigned long LOCK_MS       = 25UL * 60UL * 1000UL;
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long BLINK_MS      = 800;

Servo latch;

unsigned long buttonDownMs = 0;
unsigned long lockUntil    = 0;
bool buttonWasDown    = false;
bool longPressHandled = false;
bool locked           = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  openLatch();
  Serial.println("Phone jail open. Short press = 25 min.");
}

void loop() {
  handleButton();
  handleLock();
  delay(20);
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    longPressHandled = true;
    if (locked) {
      Serial.println("Emergency unlock. Shame.");
      unlock();
    }
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (!locked) {
      Serial.println("Locked. See you in 25.");
      lockUp();
    } else {
      Serial.println("Still locked. Hold 2s to quit.");
    }
  }

  buttonWasDown = down;
}

void handleLock() {
  if (!locked) return;

  if (millis() >= lockUntil) {
    Serial.println("Time. You may have the phone.");
    unlock();
    return;
  }

  unsigned long pulse = millis() % (BLINK_MS * 2);
  digitalWrite(LED_PIN, pulse < BLINK_MS ? HIGH : LOW);
}

void lockUp() {
  latch.attach(SERVO_PIN);
  latch.write(LATCH_SHUT);
  delay(MOVE_MS);
  latch.detach();
  locked = true;
  lockUntil = millis() + LOCK_MS;
  digitalWrite(LED_PIN, HIGH);
}

void unlock() {
  openLatch();
  locked = false;
  lockUntil = 0;
  digitalWrite(LED_PIN, LOW);
}

void openLatch() {
  latch.attach(SERVO_PIN);
  latch.write(LATCH_OPEN);
  delay(MOVE_MS);
  latch.detach();
}
