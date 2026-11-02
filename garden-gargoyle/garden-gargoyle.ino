/*
  Garden gargoyle — turn, arms, shout

  BOARD: Arduino Nano (same as the feeder)

  Sit it with its BACK to the path, like a statue facing the house.
  PIR watches the walk behind it. A warm body moves → it TURNS
  AROUND, RAISES BOTH ARMS, then plays the human track.

  PIR fires  → turn → arms up → 001.mp3 → arms down → turn back
  Day, idle  → back to the path, arms hanging, quiet
  Night      → tiny silent turn (haunt). No voice. No arms.
  Button     → full scare (bench test)

  SOUND
  -----
  DFPlayer Mini + microSD + speaker in the mouth.
  Card FAT32, one file named exactly:  001.mp3
  Record your own voice. Do not rip a movie.

  3 SERVOS
  --------
  Body/waist  D9   whole torso spins ~180° on a lazy-susan
                   or the statue is cut at the belt
  Left arm    D5   shoulder. Horn glued to the upper arm
  Right arm   D6   same. If that arm goes down when it should
                   go up, swap ARM_DOWN_R / ARM_UP_R

  Cheap shortcut: one servo and a stick across both wrists
  so they rise together. Wire that servo to D5 and ignore D6
  (comment out the right-arm writes).

  MOUNT
  -----
  1. Hollow / foam gargoyle. Cut at the WAIST for the turn
     servo (horn to the upper body, servo body in the hips
     or a disc in the planter). Head can stay glued on.
  2. Cut at both SHOULDERS. Servo in the socket, horn to arm.
     Arms must clear the chest when they rise.
  3. Dry box in the belly or under the planter:
     Nano, power bank, PIR board, DFPlayer.
  4. PIR dome aims at the PATH (behind the parked statue),
     knee-to-waist height. It does not turn with the body.
     Silicone the dome.
  5. Speaker in the mouth. LDR to the sky (day/night only).
  6. Charge the bank indoors. Bring it in for storms.

        path (creature walks here)
              |
           [ PIR ]          ← does not spin
              |
         back of statue     ← PARKED this way
              |
         [ turn servo ]
        /    belly     \
     left arm     right arm

  3 servos WILL reset the Nano if you feed them from the
  onboard 5V pin. Use the power bank for servo reds. Share GND.

  WIRING
  ------
  Body servo   orange → D9
  Left arm     orange → D5
  Right arm    orange → D6
  All browns → GND
  All reds   → 5V pack

  PIR          VCC → 5V   GND → GND   OUT → D7
  LDR          5V — LDR — A0 — 10k — GND
  Eyes         D3 → 220 Ω → red LEDs → GND
  Button       D2 → button → GND
  DFPlayer     TX → D10
               RX → 1k → D11
               BUSY → D12
               SPK1/SPK2 → speaker
               VCC/GND → 5V / GND

  HOW TO USE
  ----------
  1. 001.mp3 on the card, then power.
  2. Wait ~45 s (LED blinks). Short press = full scare.
  3. Walk the path behind it. Serial: "Creature."
  4. Hold 2 s = silent night haunt on/off.
  5. Tune BODY_PARK / BODY_FACE so "park" is back-to-path
     and "face" is staring at you. Tune the arm pairs so
     both fists go UP.
*/

#include <Servo.h>
#include <SoftwareSerial.h>

const int BUTTON_PIN  = 2;
const int EYE_PIN     = 3;
const int ARM_L_PIN   = 5;
const int ARM_R_PIN   = 6;
const int PIR_PIN     = 7;
const int BODY_PIN    = 9;
const int DF_RX_PIN   = 10;
const int DF_TX_PIN   = 11;
const int DF_BUSY_PIN = 12;
const int LDR_PIN     = A0;
const int LED_PIN     = 13;

// Body: park = back to the path. face = spun around at you.
const int BODY_PARK = 20;
const int BODY_FACE = 160;
const int BODY_HAUNT = 50;

// Arms. Right side is often mirrored — swap these two if needed.
const int ARM_DOWN_L = 20;
const int ARM_UP_L   = 150;
const int ARM_DOWN_R = 160;
const int ARM_UP_R   = 30;

const int MOVE_TURN_MS = 500;
const int MOVE_ARM_MS  = 350;
const int HOLD_MS      = 250;
const int EYE_DIM      = 25;
const int EYE_BRIGHT   = 255;
const int TRACK_HUMAN  = 1;
const int DF_VOLUME    = 22;
const unsigned long TRACK_MAX_MS = 8000;

const int NIGHT_LEVEL = 120;
const unsigned long PIR_WARMUP_MS = 45000;
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long LOOK_LOCK_MS  = 6000;
const unsigned long HAUNT_MIN_MS  = 25000;
const unsigned long HAUNT_SPAN_MS = 40000;

Servo body;
Servo armL;
Servo armR;
SoftwareSerial df(DF_RX_PIN, DF_TX_PIN);

unsigned long buttonDownMs = 0;
unsigned long lastLookMs   = 0;
unsigned long nextHauntMs  = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;
bool haunt             = false;
bool pirReady          = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(PIR_PIN, INPUT);
  pinMode(DF_BUSY_PIN, INPUT_PULLUP);
  pinMode(EYE_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  analogWrite(EYE_PIN, EYE_DIM);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  df.begin(9600);
  delay(800);
  dfCmd(0x06, DF_VOLUME);
  delay(200);

  parkPose();
  analogWrite(EYE_PIN, EYE_DIM);
  Serial.println("Gargoyle waking the PIR. Stay out of the cone ~45 s.");
}

void loop() {
  if (!pirReady) {
    waitForPir();
    handleButton();
    return;
  }
  handleButton();
  watchCreature();
  handleHaunt();
  delay(20);
}

void waitForPir() {
  if (millis() < PIR_WARMUP_MS) {
    digitalWrite(LED_PIN, (millis() / 250) % 2);
    return;
  }
  pirReady = true;
  digitalWrite(LED_PIN, LOW);
  lastLookMs = millis();
  Serial.println("PIR ready. Watching for a creature.");
}

void watchCreature() {
  if (millis() - lastLookMs < LOOK_LOCK_MS) return;
  if (digitalRead(PIR_PIN) != HIGH) return;

  Serial.println("Creature.");
  scare();
}

void handleHaunt() {
  if (!haunt) return;
  if (analogRead(LDR_PIN) > NIGHT_LEVEL) return;
  if (millis() < nextHauntMs) return;
  if (millis() - lastLookMs < LOOK_LOCK_MS) return;

  Serial.println("Night haunt.");
  body.attach(BODY_PIN);
  body.write(BODY_HAUNT);
  delay(MOVE_TURN_MS);
  delay(400);
  body.write(BODY_PARK);
  delay(MOVE_TURN_MS);
  finishScare();
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
    Serial.println("Forced scare.");
    scare();
  }

  buttonWasDown = down;
}

void scare() {
  digitalWrite(LED_PIN, HIGH);
  analogWrite(EYE_PIN, EYE_BRIGHT);

  Serial.println("Turn.");
  turnTo(BODY_FACE);
  delay(HOLD_MS);

  Serial.println("Arms.");
  armsUp();
  delay(HOLD_MS);

  Serial.println("Human track.");
  playHumanTrack();

  armsDown();
  delay(HOLD_MS);
  turnTo(BODY_PARK);
  analogWrite(EYE_PIN, EYE_DIM);
  finishScare();
}

void turnTo(int angle) {
  body.attach(BODY_PIN);
  body.write(angle);
  delay(MOVE_TURN_MS);
}

void armsUp() {
  armL.attach(ARM_L_PIN);
  armR.attach(ARM_R_PIN);
  armL.write(ARM_UP_L);
  armR.write(ARM_UP_R);
  delay(MOVE_ARM_MS);
}

void armsDown() {
  armL.attach(ARM_L_PIN);
  armR.attach(ARM_R_PIN);
  armL.write(ARM_DOWN_L);
  armR.write(ARM_DOWN_R);
  delay(MOVE_ARM_MS);
}

void parkPose() {
  body.attach(BODY_PIN);
  armL.attach(ARM_L_PIN);
  armR.attach(ARM_R_PIN);
  body.write(BODY_PARK);
  armL.write(ARM_DOWN_L);
  armR.write(ARM_DOWN_R);
  delay(500);
  detachAll();
}

void finishScare() {
  detachAll();
  lastLookMs = millis();
  digitalWrite(LED_PIN, LOW);
}

void detachAll() {
  body.detach();
  armL.detach();
  armR.detach();
}

void playHumanTrack() {
  dfCmd(0x03, TRACK_HUMAN);
  delay(150);

  unsigned long start = millis();
  while (millis() - start < TRACK_MAX_MS) {
    if (digitalRead(DF_BUSY_PIN) == HIGH && millis() - start > 400) {
      break;
    }
    delay(30);
  }
}

void dfCmd(byte cmd, unsigned int arg) {
  byte buf[10];
  buf[0] = 0x7E;
  buf[1] = 0xFF;
  buf[2] = 0x06;
  buf[3] = cmd;
  buf[4] = 0x00;
  buf[5] = (byte)(arg >> 8);
  buf[6] = (byte)(arg & 0xFF);
  int checksum = 0;
  for (int i = 1; i <= 6; i++) {
    checksum += buf[i];
  }
  checksum = -checksum;
  buf[7] = (byte)(checksum >> 8);
  buf[8] = (byte)(checksum & 0xFF);
  buf[9] = 0xEF;
  df.write(buf, 10);
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
