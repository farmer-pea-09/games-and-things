/*
  Page raven — homework villain

  BOARD: Arduino Nano (same as the feeder)
  Stands to the RIGHT of an open book. Short press = it caws,
  drops a rubber claw on the top-right corner, drags the page
  over, then parks. Long press = reverse (previous page).

  3 SERVOS
  --------
  Beak     D9   open / close. Glue the lower beak to the horn
                (or the whole head nods if that is easier).
  Claw Z   D5   up / down. Down must kiss the paper, not punch
                a hole in it.
  Claw X   D6   sweep. Parked over the right margin. Sweep goes
                toward the SPINE, then a little past, so the
                page actually flips.

  The claw tip is a pencil eraser or a fat rubber band. Bare
  cardboard will not grab paper.

  MOUNT
  -----
  1. Cardboard raven on a small box / wood scrap. The box sits
     on the DESK, not on the book.
  2. Book open, LEFT pages weighted (another book, a mug, a
     binder clip on the left stack). The right page must be
     free.
  3. Paperback, dry paper. Glossy magazines and brand-new
     stiff pages will laugh at you.
  4. Aim the claw at the TOP-RIGHT CORNER of the right page.
     That corner flips the easiest.
  5. Tune the three angle pairs below on the bench with NO
     book first, then with a junk paperback.

        weighted left | free right page
        ==============|================
                      |    * claw
                      |   raven
                      |   [ Nano ]

  PAGE TURN (short press)
  -----------------------
    1. Beak opens (caw).
    2. Claw lowers onto the corner.
    3. Claw sweeps toward the spine / left.
    4. Claw lifts (page should be mid-flip).
    5. Claw sweeps the rest of the way / parks high.
    6. Beak closes.

  PREVIOUS PAGE (hold 2 seconds)
  ------------------------------
    Same dance, sweep the other direction. Only works if the
    left page is not crushed under the weight — lift the mug.

  WIRING
  ------
  Beak         orange → D9
  Claw lift    orange → D5
  Claw sweep   orange → D6
  All browns → GND
  All reds   → 5V pack   (3 servos: NOT the Nano 5V pin)
  Share GND with the Nano.

  Button       D2 → button → GND   (INPUT_PULLUP)
  Onboard LED  D13 on while it turns a page.

  HOW TO USE
  ----------
  1. Upload. Short press with no book: watch the claw trace
     an L in the air (down, across, up).
  2. Put a junk paperback in. Tweak CLAW_DOWN until it
     GRIPS, not SKIPS, not RIPS.
  3. Tweak SWEEP_LEFT until the page actually goes over.
  4. If the right arm of the sweep is backwards, swap
     SWEEP_RIGHT and SWEEP_LEFT.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int CLAW_Z_PIN = 5;
const int CLAW_X_PIN = 6;
const int BEAK_PIN   = 9;
const int LED_PIN    = 13;

// Tweak these. Units are servo degrees.
const int BEAK_SHUT = 40;
const int BEAK_OPEN = 95;

const int CLAW_UP   = 30;    // hovering over the book
const int CLAW_DOWN = 95;    // rubber on the page

const int SWEEP_RIGHT = 40;  // parked at the right margin
const int SWEEP_MID   = 90;  // over the spine
const int SWEEP_LEFT  = 140; // page dumped onto the left stack

const int BEAK_MS   = 250;
const int LIFT_MS   = 350;
const int SWEEP_MS  = 500;
const int GRIP_MS   = 200;   // sit on the paper before dragging
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long TURN_LOCK_MS  = 2500;

Servo beak;
Servo clawZ;
Servo clawX;

unsigned long buttonDownMs = 0;
unsigned long lastTurnMs   = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  park();
  Serial.println("Page raven perched. Short press = next page.");
}

void loop() {
  handleButton();
  delay(15);
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    if (millis() - lastTurnMs >= TURN_LOCK_MS) {
      Serial.println("Previous page.");
      turnPage(false);
    }
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (millis() - lastTurnMs >= TURN_LOCK_MS) {
      Serial.println("Next page.");
      turnPage(true);
    } else {
      Serial.println("Still swallowing that page.");
    }
  }

  buttonWasDown = down;
}

void turnPage(bool forward) {
  digitalWrite(LED_PIN, HIGH);

  caw();
  lowerClaw();
  delay(GRIP_MS);

  if (forward) {
    sweepTo(SWEEP_MID);
    liftClaw();
    sweepTo(SWEEP_LEFT);
  } else {
    sweepTo(SWEEP_MID);
    liftClaw();
    sweepTo(SWEEP_RIGHT);
  }

  shutBeak();
  park();
  lastTurnMs = millis();
  digitalWrite(LED_PIN, LOW);
}

void caw() {
  beak.attach(BEAK_PIN);
  beak.write(BEAK_OPEN);
  delay(BEAK_MS);
}

void shutBeak() {
  beak.attach(BEAK_PIN);
  beak.write(BEAK_SHUT);
  delay(BEAK_MS);
}

void lowerClaw() {
  clawZ.attach(CLAW_Z_PIN);
  clawZ.write(CLAW_DOWN);
  delay(LIFT_MS);
}

void liftClaw() {
  clawZ.attach(CLAW_Z_PIN);
  clawZ.write(CLAW_UP);
  delay(LIFT_MS);
}

void sweepTo(int angle) {
  clawX.attach(CLAW_X_PIN);
  clawX.write(angle);
  delay(SWEEP_MS);
}

void park() {
  beak.attach(BEAK_PIN);
  clawZ.attach(CLAW_Z_PIN);
  clawX.attach(CLAW_X_PIN);
  beak.write(BEAK_SHUT);
  clawZ.write(CLAW_UP);
  clawX.write(SWEEP_RIGHT);
  delay(400);
  beak.detach();
  clawZ.detach();
  clawX.detach();
}
