/*
  Shoulder parrot — clamp-on, head bob, chirp, NO BITE

  BOARD: Arduino Nano (same as the feeder)
  Foam parrot on a spring clamp. Head nods. Beak does not snap.

  SQUAWK button  D2   short press = one bob + chirp
  REPEAT button  D4   HOLD = keep repeating that squawk.
                      Let go: it still repeats for 5 seconds,
                      then it FORGETS and goes quiet.

  SOUND
  -----
  Piezo buzzer / tiny speaker:
    +  → D8
    −  → GND
  (optional 100 Ω in series if it is too loud or draws a lot)

  1 SERVO
  -------
  Head   D9   nods YES. No bite servo. Clamp FABRIC only.

  MOUNT
  -----
  Same as before. Put REPEAT where YOUR thumb is, not in
  someone else's face. Nano + bank on the clamp.

  WIRING
  ------
  Head servo   orange → D9   brown → GND   red → 5V pack
  Share GND with the Nano.

  Squawk btn   D2 → button → GND
  Repeat btn   D4 → button → GND
  Piezo        D8 → buzzer → GND
  LED          D13 on while it squawks
*/

#include <Servo.h>

const int SQUAWK_PIN = 2;
const int REPEAT_PIN = 4;
const int PIEZO_PIN  = 8;
const int HEAD_PIN   = 9;
const int LED_PIN    = 13;

const int HEAD_DOWN = 70;
const int HEAD_UP   = 110;
const int HEAD_REST = 90;

const int BOB_MS = 160;
const unsigned long FORGET_MS = 5000;

Servo head;

bool squawkWasDown = false;
unsigned long lastRepeatHeldMs = 0;
bool remembering = false;

void setup() {
  pinMode(SQUAWK_PIN, INPUT_PULLUP);
  pinMode(REPEAT_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  noTone(PIEZO_PIN);

  Serial.begin(9600);
  delay(200);

  parkHead();
  Serial.println("Parrot perched. D2 = once. Hold D4 = repeat. Forgets in 5 s.");
}

void loop() {
  handleSquawkButton();
  handleRepeatButton();
  handleMemory();
  delay(10);
}

void handleSquawkButton() {
  bool down = digitalRead(SQUAWK_PIN) == LOW;

  if (!down && squawkWasDown) {
    Serial.println("Squawk.");
    squawk(3);
  }
  squawkWasDown = down;
}

void handleRepeatButton() {
  if (digitalRead(REPEAT_PIN) == LOW) {
    lastRepeatHeldMs = millis();
    if (!remembering) {
      Serial.println("Remembering. Repeating.");
    }
    remembering = true;
  }
}

void handleMemory() {
  if (!remembering) return;

  bool held = digitalRead(REPEAT_PIN) == LOW;
  if (!held && millis() - lastRepeatHeldMs >= FORGET_MS) {
    Serial.println("Forgot.");
    remembering = false;
    parkHead();
    noTone(PIEZO_PIN);
    return;
  }

  squawk(1);
}

void squawk(int nods) {
  digitalWrite(LED_PIN, HIGH);
  chirp();
  head.attach(HEAD_PIN);
  for (int i = 0; i < nods; i++) {
    head.write(HEAD_DOWN);
    delay(BOB_MS);
    head.write(HEAD_UP);
    delay(BOB_MS);
  }
  head.write(HEAD_REST);
  delay(80);
  head.detach();
  digitalWrite(LED_PIN, LOW);
}

void chirp() {
  tone(PIEZO_PIN, 1800, 70);
  delay(80);
  tone(PIEZO_PIN, 2400, 90);
  delay(100);
  noTone(PIEZO_PIN);
}

void parkHead() {
  head.attach(HEAD_PIN);
  head.write(HEAD_REST);
  delay(200);
  head.detach();
}
