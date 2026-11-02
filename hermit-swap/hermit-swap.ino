/*
  Hermit swap — small cup off, bigger cup on

  BOARD: Arduino Nano (same as the feeder)
  A cardboard crab sits on a base. A SMALL paper cup is its
  shell. Short press: it wiggles, DRAGS that cup off its back,
  then a BIGGER cup swings down and becomes the new shell.

  Long press: reverse (big cup lifts off, small cup slides back)
  so you can demo it more than once.

  3 SERVOS
  --------
  Legs      D5   a rocker under the body. It does not walk
                 far. It just looks annoyed while the shells
                 change.
  Drag      D9   long horn / popsicle stick hooked on the RIM
                 of the small cup. Parked = cup sitting on the
                 crab. Swap = swings BACK and pulls the cup
                 off like a hermit backing out.
  Drop      D6   arm holding the BIG cup above / beside the
                 crab. Parked = big cup waiting in the air.
                 Swap = lowers the big cup onto the crab's
                 back.

  CUPS
  ----
  Small = bathroom dixie / espresso cup. Opening toward the
          TAIL. Light. Tape a paperclip on the rim for the
          drag hook to grab.
  Big   = the next size up. Opening toward the tail too.
          Hot-glue the side of the cup to the drop-arm so
          it stays aimed.

  MOUNT
  -----
  1. Cardboard base, about a sheet of paper. Crab in the
     middle. Nano + battery under the base or in a snack box
     behind the crab.
  2. Crab body = a matchbox / small cardboard lump. Pipe
     cleaner or cardboard legs glued on. The legs servo
     is UNDER the body, horn lifting one side so it rocks.
  3. Drag servo behind the tail, horn pointing up, a bent
     paperclip hook on the end. Hook catches the small-cup
     rim from the outside.
  4. Drop servo to the SIDE of the crab (stage left). Arm
     is a popsicle stick. Big cup glued to the end. At rest
     the big cup is UP, out of the way. At drop it sits
     snug on the crab like a hat.
  5. The two cups must not hit each other mid-swap. Park
     the big cup high enough that the small one can slide
     out first.

        [ big cup waiting ]----drop servo
                 |
     small cup on crab
            crab  (rocks)
              |
           drag servo  ← pulls small cup THIS way (tail)
           [ Nano box ]

  WIRING
  ------
  Legs         orange → D5
  Drop (big)   orange → D6
  Drag (small) orange → D9
  All browns → GND
  All reds   → 5V pack   (NOT the Nano 5V pin)
  Share GND with the Nano.

  Button       D2 → button → GND   (INPUT_PULLUP)
  Onboard LED  D13 on during a swap.

  HOW TO USE
  ----------
  1. No cups. Short press. Watch: rock, drag-arm swings back,
     drop-arm comes down, then they reverse to park.
  2. Hook the small cup. Glue the big cup to the drop arm.
  3. Tweak DRAG_OFF until the small cup actually leaves.
     Tweak DROP_ON until the big cup sits on the crab, not
     on the table, not on the drag hook.
  4. If an arm goes the wrong way, swap that pair of angles.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int LEGS_PIN   = 5;
const int DROP_PIN   = 6;
const int DRAG_PIN   = 9;
const int LED_PIN    = 13;

const int LEGS_LEFT  = 60;
const int LEGS_RIGHT = 120;
const int LEGS_REST  = 90;

const int DRAG_ON    = 40;    // hook holding small cup on the crab
const int DRAG_OFF   = 130;   // small cup pulled off, behind the tail

const int DROP_WAIT  = 30;    // big cup in the air
const int DROP_ON    = 110;   // big cup sitting on the crab

const int MOVE_MS    = 450;
const int WIGGLE_MS  = 180;
const unsigned long LONG_PRESS_MS = 2000;
const unsigned long SWAP_LOCK_MS  = 3000;

Servo legs;
Servo drag;
Servo drop;

unsigned long buttonDownMs = 0;
unsigned long lastSwapMs   = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;
bool wearingBig        = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  smallShellPose();
  Serial.println("Hermit hiding. Short press = bigger shell.");
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
    if (millis() - lastSwapMs >= SWAP_LOCK_MS) {
      Serial.println("Back to the small shell.");
      goSmall();
    }
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    if (millis() - lastSwapMs < SWAP_LOCK_MS) {
      Serial.println("Still changing.");
    } else {
      Serial.println("Bigger shell.");
      goBig();
    }
  }

  buttonWasDown = down;
}

void goBig() {
  digitalWrite(LED_PIN, HIGH);
  wiggle(3);

  Serial.println("Drag small cup off.");
  moveDrag(DRAG_OFF);
  delay(200);

  Serial.println("Drop big cup on.");
  moveDrop(DROP_ON);
  delay(200);

  wiggle(2);
  wearingBig = true;
  doneSwap();
}

void goSmall() {
  digitalWrite(LED_PIN, HIGH);
  wiggle(2);

  Serial.println("Lift big cup.");
  moveDrop(DROP_WAIT);
  delay(200);

  Serial.println("Slide small cup back.");
  moveDrag(DRAG_ON);
  delay(200);

  wiggle(2);
  wearingBig = false;
  doneSwap();
}

void wiggle(int times) {
  legs.attach(LEGS_PIN);
  for (int i = 0; i < times; i++) {
    legs.write(LEGS_LEFT);
    delay(WIGGLE_MS);
    legs.write(LEGS_RIGHT);
    delay(WIGGLE_MS);
  }
  legs.write(LEGS_REST);
  delay(WIGGLE_MS);
}

void smallShellPose() {
  drag.attach(DRAG_PIN);
  drop.attach(DROP_PIN);
  legs.attach(LEGS_PIN);
  drag.write(DRAG_ON);
  drop.write(DROP_WAIT);
  legs.write(LEGS_REST);
  delay(500);
  detachAll();
  wearingBig = false;
}

void moveDrag(int angle) {
  drag.attach(DRAG_PIN);
  drag.write(angle);
  delay(MOVE_MS);
}

void moveDrop(int angle) {
  drop.attach(DROP_PIN);
  drop.write(angle);
  delay(MOVE_MS);
}

void doneSwap() {
  detachAll();
  lastSwapMs = millis();
  digitalWrite(LED_PIN, LOW);
}

void detachAll() {
  legs.detach();
  drag.detach();
  drop.detach();
}
