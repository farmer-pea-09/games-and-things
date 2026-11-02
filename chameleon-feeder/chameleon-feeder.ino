/*
  Chameleon feeder — 4-pocket wheel, 2 feeds/day, Feed now button

  BOARD: Arduino Nano or Uno
  LIBRARY: Sketch → Include Library → Manage Libraries → "RTClib" by Adafruit

  WIRING
  ------
  DS3231 RTC
    VCC → 5V
    GND → GND
    SDA → A4  (Nano/Uno)
    SCL → A5

  Servo (SG90 / MG90)
    Brown/black → GND  (share ground with Arduino)
    Red         → 5V   (use a USB wall adapter, not a dying battery)
    Orange/yellow → D9

    If the Arduino resets when the servo moves, power the servo
    from a separate 5V pack and still connect GND to Arduino GND.

  Feed button
    One side → D2
    Other side → GND
    (code uses INPUT_PULLUP, no extra resistor)

  Onboard LED on D13 blinks during a feed.

  HOW TO USE
  ----------
  1. Load 4 pockets with calcium-dusted dubias / small supers.
  2. Upload this sketch.
  3. First upload only: uncomment rtc.adjust(...) below, upload,
     then comment it out and upload again so the clock stays correct.
  4. Short press = dump the NEXT pocket now.
  5. Hold 2 seconds = wheel back to pocket 0 after you refill.

  Pocket 0 is the reload position (tube blocked / empty).
  Feeds rotate to 1, then 2, then 3, then 4, then it STOPS
  so it cannot dump an empty wheel. Reset after refill.
*/

#include <Wire.h>
#include <RTClib.h>
#include <Servo.h>

// ---- pins ----
const int SERVO_PIN  = 9;
const int BUTTON_PIN = 2;
const int LED_PIN    = 13;

// ---- schedule (24-hour clock) ----
const int FEED1_HOUR = 8;
const int FEED1_MIN  = 30;
const int FEED2_HOUR = 16;
const int FEED2_MIN  = 0;

// 4 pockets on a 180° servo. Tweak these until each hole lines up with the tube.
const int NUM_POCKETS = 4;
const int POCKET_ANGLE[NUM_POCKETS + 1] = {
  10,   // 0 = reload / closed
  50,   // 1 = morning day 1
  95,   // 2 = afternoon day 1
  140,  // 3 = morning day 2
  175   // 4 = afternoon day 2
};

const int MOVE_MS = 800;          // time to let the servo reach the pocket
const int DROP_MS = 1500;         // stay over the hole so bugs can fall
const unsigned long FEED_LOCK_MS = 30000;  // ignore extra button hits
const unsigned long LONG_PRESS_MS = 2000;

RTC_DS3231 rtc;
Servo feeder;

int nextPocket = 1;               // next meal to dump (1..4)
int lastFeedDay = -1;
bool fedSlot1 = false;
bool fedSlot2 = false;
unsigned long lastFeedMs = 0;
unsigned long buttonDownMs = 0;
bool buttonWasDown = false;
bool longPressHandled = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  if (!rtc.begin()) {
    Serial.println("DS3231 not found. Check SDA/SCL.");
    blinkForever();
  }

  if (rtc.lostPower()) {
    Serial.println("RTC lost power. Set the clock.");
    // Uncomment ONE time, upload, then comment out and upload again:
    // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  feeder.attach(SERVO_PIN);
  feeder.write(POCKET_ANGLE[0]);
  delay(MOVE_MS);
  feeder.detach();  // stop buzzing / heating while idle

  Serial.println("Chameleon feeder ready.");
  printStatus();
}

void loop() {
  DateTime now = rtc.now();
  handleMidnightReset(now);
  handleSchedule(now);
  handleButton();
  delay(20);
}

void handleMidnightReset(DateTime now) {
  if (now.day() == lastFeedDay) return;
  lastFeedDay = now.day();
  fedSlot1 = false;
  fedSlot2 = false;
  Serial.println("New day: schedule flags reset.");
}

void handleSchedule(DateTime now) {
  if (inMinute(now, FEED1_HOUR, FEED1_MIN) && !fedSlot1) {
    if (dumpNextPocket("clock feed 1")) fedSlot1 = true;
  }
  if (inMinute(now, FEED2_HOUR, FEED2_MIN) && !fedSlot2) {
    if (dumpNextPocket("clock feed 2")) fedSlot2 = true;
  }
}

bool inMinute(DateTime now, int hour, int minute) {
  return now.hour() == hour && now.minute() == minute;
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    resetWheel();
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (millis() - lastFeedMs >= FEED_LOCK_MS) {
      dumpNextPocket("feed now");
    } else {
      Serial.println("Feed lockout — wait a bit.");
    }
  }

  buttonWasDown = down;
}

bool dumpNextPocket(const char* reason) {
  if (nextPocket > NUM_POCKETS) {
    Serial.println("Wheel empty. Refill, then long-press to reset.");
    flashEmpty();
    return false;
  }

  Serial.print("Dumping pocket ");
  Serial.print(nextPocket);
  Serial.print(" (");
  Serial.print(reason);
  Serial.println(")");

  digitalWrite(LED_PIN, HIGH);
  feeder.attach(SERVO_PIN);
  feeder.write(POCKET_ANGLE[nextPocket]);
  delay(MOVE_MS + DROP_MS);
  feeder.detach();
  digitalWrite(LED_PIN, LOW);

  nextPocket++;
  lastFeedMs = millis();
  printStatus();
  return true;
}

void resetWheel() {
  Serial.println("Reload reset → pocket 0.");
  digitalWrite(LED_PIN, HIGH);
  feeder.attach(SERVO_PIN);
  feeder.write(POCKET_ANGLE[0]);
  delay(MOVE_MS);
  feeder.detach();
  digitalWrite(LED_PIN, LOW);

  nextPocket = 1;
  lastFeedMs = millis();
  printStatus();
}

void printStatus() {
  DateTime now = rtc.now();
  Serial.print("Time ");
  if (now.hour() < 10) Serial.print('0');
  Serial.print(now.hour());
  Serial.print(':');
  if (now.minute() < 10) Serial.print('0');
  Serial.print(now.minute());
  Serial.print("  next pocket ");
  Serial.println(nextPocket > NUM_POCKETS ? 0 : nextPocket);
}

void flashEmpty() {
  for (int i = 0; i < 6; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(120);
    digitalWrite(LED_PIN, LOW);
    delay(120);
  }
}

void blinkForever() {
  while (true) {
    digitalWrite(LED_PIN, HIGH);
    delay(250);
    digitalWrite(LED_PIN, LOW);
    delay(250);
  }
}
