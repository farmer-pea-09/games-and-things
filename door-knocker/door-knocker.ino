/*
  Door knocker — button + Halloween haunt

  BOARD: Arduino Nano (same as the feeder)
  One servo is the fist. No microphone.

  MOUNT (no holes in the door)
  ----------------------------
  1. Paint stirrer hung over the TOP of the door, on the INSIDE.
  2. Zip-tie the servo to that slat, about chest height, so
     the horn swings TOWARD the door face.
  3. Popsicle stick on the horn. Hot-glue a wooden bead / nut
     at the tip. It must hit wood at the strike angle.
  4. Snack box with Nano + battery on the same slat. Make sure
     the door can still close.

        hallway (outside)
     ========================  door
              [fist][servo]
              [ Nano box ]
            (you, inside)

  STRIKE
  ------
    rest   = arm pulled back, not touching the door
    strike = servo flicks forward, bead hits, then back

  Tweak REST_ANGLE and STRIKE_ANGLE after the first mount.
  If it slams the frame instead of the door, swap the two numbers.

  WIRING
  ------
  Servo        orange → D9
               brown  → GND
               red    → 5V pack (not Nano 5V if it twitches)
  Share GND with the Nano.

  Button       D2 → button → GND   (INPUT_PULLUP)
  Onboard LED  D13 on while it knocks.

  HOW TO USE
  ----------
  1. Short press = three knocks.
  2. Hold 2 seconds = haunt on/off.
     Haunt: every 30–90 seconds it knocks by itself
     (three slow, or two quick). LED blinks 2× when haunt
     is on, 4× when off.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int SERVO_PIN  = 9;
const int LED_PIN    = 13;

const int REST_ANGLE   = 30;
const int STRIKE_ANGLE = 85;

const int SWING_MS    = 90;
const int CONTACT_MS  = 40;
const int GAP_MS      = 180;
const int SLOW_GAP_MS = 450;

const unsigned long LONG_PRESS_MS = 2000;
const unsigned long HAUNT_MIN_MS  = 30000;
const unsigned long HAUNT_SPAN_MS = 60000;  // extra random wait on top of min

Servo fist;

unsigned long buttonDownMs = 0;
unsigned long nextHauntMs  = 0;
bool buttonWasDown    = false;
bool longPressHandled = false;
bool haunt            = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  restFist();
  Serial.println("Door knocker ready. Short press = knock.");
}

void loop() {
  handleButton();
  handleHaunt();
  delay(15);
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
    Serial.println("Knock.");
    knockTriple();
  }

  buttonWasDown = down;
}

void handleHaunt() {
  if (!haunt) return;
  if (millis() < nextHauntMs) return;

  if (random(0, 2) == 0) {
    Serial.println("Haunt: slow.");
    knockSlow();
  } else {
    Serial.println("Haunt: two.");
    knockTimes(2, GAP_MS);
  }
  scheduleHaunt();
}

void scheduleHaunt() {
  nextHauntMs = millis() + HAUNT_MIN_MS + random(0, HAUNT_SPAN_MS + 1);
}

void knockTriple() {
  knockTimes(3, GAP_MS);
}

void knockSlow() {
  knockTimes(3, SLOW_GAP_MS);
}

void knockTimes(int times, int gapMs) {
  digitalWrite(LED_PIN, HIGH);
  fist.attach(SERVO_PIN);
  for (int i = 0; i < times; i++) {
    fist.write(STRIKE_ANGLE);
    delay(SWING_MS + CONTACT_MS);
    fist.write(REST_ANGLE);
    delay(SWING_MS + gapMs);
  }
  fist.detach();
  digitalWrite(LED_PIN, LOW);
}

void restFist() {
  fist.attach(SERVO_PIN);
  fist.write(REST_ANGLE);
  delay(300);
  fist.detach();
}

void flash(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    delay(80);
  }
}
