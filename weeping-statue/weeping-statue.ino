/*
  Weeping statue — frozen in the light, leans in the dark

  BOARD: Arduino Nano (same as the feeder)
  Indoor gargoyle / action figure. Lights on = statue.
  A hand or a body casts a shadow on the LDR = it LEANS
  one inch toward you, holds, then creeps back as if it
  never moved.

  Light on  → park. Head / torso still.
  Shadow    → lean. Snap in, creep home.
  Button    → force a lean (tune angles on the bench).
  Hold 2 s  → haunt on/off. Haunt = slow lean every so often
              when the room is already dim.

  1 SERVO
  -------
  Lean   D9   PARK = facing away / upright
              LEAN = an inch toward the path

  MOUNT
  -----
  1. Hollow plastic figure, foam, or a thrift statue.
     Cut at the waist or neck. Horn to the upper body,
     servo body in the hips / stand.
  2. LDR in the chest or between the eyes, facing the
     LAMP, not the ceiling. A person walking by should
     shadow it.
  3. Optional red LEDs in the eyes (D3).
  4. Nano + battery in the stand.

        lamp
          |
       [ LDR ]
      (  face  )
       | lean |
      [  box  ]

  WIRING
  ------
  Servo        orange → D9
               brown  → GND
               red    → 5V pack (share GND)
  LDR          one leg → 5V
               other  → A0 AND a 10k to GND
  Eyes (opt)   D3 → 220 Ω → LEDs → GND
  Button       D2 → button → GND
  LED onboard  D13 on while it leans

  HOW TO USE
  ----------
  1. Upload. Cover the LDR. Serial 9600: "Shadow. Lean."
  2. Looks all the time → raise SHADOW_DROP.
     Hand does nothing → lower SHADOW_DROP.
  3. Short press = lean now.
  4. Park it where PEOPLE walk between a lamp and the LDR.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int EYE_PIN    = 3;
const int SERVO_PIN  = 9;
const int LDR_PIN    = A0;
const int LED_PIN    = 13;

const int PARK_ANGLE = 70;
const int LEAN_ANGLE = 115;

const int MOVE_SNAP_MS = 160;
const int MOVE_SLOW_MS = 16;
const int HOLD_MS      = 1600;
const int EYE_DIM      = 20;
const int EYE_BRIGHT   = 255;

const int SHADOW_DROP = 70;
const int DIM_LEVEL   = 160;
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long LEAN_LOCK_MS  = 3500;
const unsigned long HAUNT_MIN_MS  = 20000;
const unsigned long HAUNT_SPAN_MS = 35000;

Servo lean;

unsigned long buttonDownMs = 0;
unsigned long lastLeanMs   = 0;
unsigned long nextHauntMs  = 0;
int lightAvg           = 512;
bool buttonWasDown     = false;
bool longPressHandled  = false;
bool haunt             = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(EYE_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  analogWrite(EYE_PIN, EYE_DIM);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  lightAvg = analogRead(LDR_PIN);
  park();
  Serial.print("Statue parked. Light=");
  Serial.println(lightAvg);
}

void loop() {
  handleButton();
  watchLight();
  handleHaunt();
  delay(20);
}

void watchLight() {
  int light = analogRead(LDR_PIN);
  lightAvg = (lightAvg * 7 + light) / 8;

  if (millis() - lastLeanMs < LEAN_LOCK_MS) return;
  if (lightAvg - light < SHADOW_DROP) return;

  Serial.print("Shadow. Lean. light=");
  Serial.print(light);
  Serial.print(" avg=");
  Serial.println(lightAvg);
  doLean();
}

void handleHaunt() {
  if (!haunt) return;
  if (analogRead(LDR_PIN) > DIM_LEVEL) return;
  if (millis() < nextHauntMs) return;
  if (millis() - lastLeanMs < LEAN_LOCK_MS) return;

  Serial.println("Dim haunt.");
  doLean();
  scheduleHaunt();
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    haunt = !haunt;
    longPressHandled = true;
    if (haunt) {
      scheduleHaunt();
      Serial.println("Haunt on.");
      flash(2);
    } else {
      Serial.println("Haunt off.");
      flash(4);
    }
  }

  if (!down && buttonWasDown && !longPressHandled) {
    Serial.println("Forced lean.");
    doLean();
  }

  buttonWasDown = down;
}

void doLean() {
  digitalWrite(LED_PIN, HIGH);
  analogWrite(EYE_PIN, EYE_BRIGHT);
  snapTo(LEAN_ANGLE);
  delay(HOLD_MS);
  creepTo(PARK_ANGLE);
  analogWrite(EYE_PIN, EYE_DIM);
  lean.detach();
  lastLeanMs = millis();
  digitalWrite(LED_PIN, LOW);
}

void snapTo(int angle) {
  lean.attach(SERVO_PIN);
  lean.write(angle);
  delay(MOVE_SNAP_MS);
}

void creepTo(int angle) {
  lean.attach(SERVO_PIN);
  int now = lean.read();
  if (now < 0) now = PARK_ANGLE;
  int step = (angle > now) ? 1 : -1;
  for (int a = now; a != angle; a += step) {
    lean.write(a);
    delay(MOVE_SLOW_MS);
  }
  lean.write(angle);
}

void park() {
  lean.attach(SERVO_PIN);
  lean.write(PARK_ANGLE);
  delay(400);
  lean.detach();
}

void scheduleHaunt() {
  nextHauntMs = millis() + HAUNT_MIN_MS + random(0, HAUNT_SPAN_MS + 1);
}

void flash(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    analogWrite(EYE_PIN, EYE_BRIGHT);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    analogWrite(EYE_PIN, EYE_DIM);
    delay(80);
  }
}
