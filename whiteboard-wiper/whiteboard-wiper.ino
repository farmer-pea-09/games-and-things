/*
  Whiteboard wiper — one stripe, then looks innocent

  BOARD: Arduino Nano (same as the feeder)
  A long arm with a dry-erase FELT pad (not sandpaper, not a
  nail). Short press: it leans in, wipes ONE stripe, lifts
  off, and parks beside the board like it did nothing.

  Hold 2 seconds = panic park (stop mid-wipe, look innocent).

  2 SERVOS
  --------
  Lift   D5   up = felt OFF the board (innocent)
              down = felt KISSING the board (crime)
  Sweep  D9   parked at the side. Wipe = one slow pass
              across, then back to the side while LIFTED
              so it does not scribble a second stripe home.

  The arm is a meter-stick / paint stirrer / yardstick.
  Felt is a cut-up dry-erase eraser or a sock over a sponge,
  rubber-banded to the tip. Light pressure. If it squeaks
  or gouges, the lift-down angle is too hard.

  MOUNT
  -----
  1. Clamp or tape the servo CLUSTER to the whiteboard TRAY
     or the frame, on the LEFT edge of the area you want
     wiped. Do not drill a school board.
  2. Sweep servo body fixed. Horn glued to the stick, near
     the tray, so the stick is a windshield wiper.
  3. Lift servo at the TIP, or a second horn that presses
     the felt on/off. Easier build: lift servo sits on the
     stick near the tip. Horn = felt pad. Down = pad flat
     on the board. Up = pad flared away.
  4. Nano + battery on the tray in a snack box, not dangling.
  5. Test on a tiny home board or a laminated sheet first.

        [  whiteboard  ]
        stripe → → → →
        felt *
          \
           \ arm
            \
         [lift] [sweep]  ← tray
         [ Nano box ]

  WIRING
  ------
  Lift         orange → D5
  Sweep        orange → D9
  Both browns → GND
  Both reds   → 5V pack  (NOT Nano 5V)
  Share GND with the Nano.

  Button       D2 → button → GND
  Onboard LED  D13 on during a wipe.

  HOW TO USE
  ----------
  1. Felt UP. Short press. Watch: pad down, one sweep,
     pad up, arm returns. Serial: "Wipe." then "Innocent."
  2. Tweak SWEEP_PARK / SWEEP_END for a stripe that is
     long enough but does not slam the frame.
  3. Tweak LIFT_DOWN until it erases, not skips, not gouges.
  4. If sweep is backwards, swap SWEEP_PARK and SWEEP_END.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int LIFT_PIN   = 5;
const int SWEEP_PIN  = 9;
const int LED_PIN    = 13;

const int LIFT_UP   = 40;    // felt off the board
const int LIFT_DOWN = 110;   // felt on the board

const int SWEEP_PARK = 30;   // hanging at the side, innocent
const int SWEEP_END  = 140;  // far end of the stripe

const int LIFT_MS  = 300;
const int SWEEP_MS = 900;    // slow = looks sneakier
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long WIPE_LOCK_MS  = 2500;

Servo lift;
Servo sweep;

unsigned long buttonDownMs = 0;
unsigned long lastWipeMs   = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  lookInnocent();
  Serial.println("Wiper bored. Short press = one stripe.");
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
    Serial.println("Panic. Innocent.");
    lookInnocent();
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (millis() - lastWipeMs >= WIPE_LOCK_MS) {
      wipeOnce();
    } else {
      Serial.println("Already innocent.");
    }
  }

  buttonWasDown = down;
}

void wipeOnce() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("Wipe.");

  // Lean in.
  sweep.attach(SWEEP_PIN);
  sweep.write(SWEEP_PARK);
  delay(200);
  pressFelt(true);
  delay(150);

  // One stripe only.
  sweep.write(SWEEP_END);
  delay(SWEEP_MS);

  // Lift BEFORE coming home so there is no return streak.
  pressFelt(false);
  delay(150);
  sweep.write(SWEEP_PARK);
  delay(SWEEP_MS);

  lookInnocent();
  lastWipeMs = millis();
  Serial.println("Innocent.");
}

void pressFelt(bool onBoard) {
  lift.attach(LIFT_PIN);
  lift.write(onBoard ? LIFT_DOWN : LIFT_UP);
  delay(LIFT_MS);
}

void lookInnocent() {
  lift.attach(LIFT_PIN);
  sweep.attach(SWEEP_PIN);
  lift.write(LIFT_UP);
  sweep.write(SWEEP_PARK);
  delay(400);
  lift.detach();
  sweep.detach();
  digitalWrite(LED_PIN, LOW);
}
