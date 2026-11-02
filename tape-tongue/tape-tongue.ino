/*
  Tape tongue — chameleon cousin

  BOARD: Arduino Nano (same as the feeder)
  A cheap tape measure is the tongue. The servo only YANKS.
  The spring inside the tape measure REELS it back.

  Short press = look (optional head) + fire + rewind.
  Hold 2 seconds = peek only (head turns, no spit).

  1 REQUIRED SERVO
  ----------------
  Yank    D9   rest = tab held, blade in the mouth
               fire = horn pulls the tab ~2 cm
               then back to rest so the spring can rewind

  OPTIONAL HEAD
  -------------
  Head    D5   looks at the fly before the spit.
               If you only have one servo, leave D5 empty.
               The code still runs.

  TIP
  ---
  Magnet or a loop of tape on the blade. Paper fly gets a
  paperclip. Aim at the DESK, never a face. Metal blades can
  cut — a plastic sewing tape is safer if you can find one.

  MOUNT
  -----
  1. Cardboard chameleon. Tape measure glued inside the mouth,
     blade coming out the lips.
  2. Yank servo beside the mouth. Paperclip hook or fishing
     line on the tape TAB, not the blade.
  3. Fire = servo pulls a short tug. That is enough for a
     cheap 1 m tape to spit 20–40 cm, then snap home.
  4. Nano + battery in the belly or a snack box behind it.

        [ paper fly ]
              ^
           tongue
         (  mouth  )
        [yank] [head]
         [ Nano ]

  WIRING
  ------
  Yank         orange → D9
  Head (opt)   orange → D5
  Browns → GND
  Reds   → 5V pack   (NOT the Nano 5V pin)
  Share GND with the Nano.

  Button       D2 → button → GND
  Onboard LED  D13 on while it strikes.

  HOW TO USE
  ----------
  1. No fly first. Short press. Blade should spit, then hide.
  2. If it only peeks, raise YANK_FIRE (more pull).
  3. If it slams the desk, lower YANK_FIRE.
  4. Stick a paperclip fly on the desk and try again.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int HEAD_PIN   = 5;
const int YANK_PIN   = 9;
const int LED_PIN    = 13;

const int YANK_REST = 40;
const int YANK_FIRE = 110;

const int HEAD_REST = 90;
const int HEAD_LOOK = 125;

const int MOVE_MS          = 280;
const int HOLD_FIRE_MS     = 220;
const int REWIND_WAIT_MS   = 450;
const unsigned long LONG_PRESS_MS = 2000;

Servo yank;
Servo head;
bool hasHead = false;

unsigned long buttonDownMs = 0;
bool buttonWasDown    = false;
bool longPressHandled = false;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  yank.attach(YANK_PIN);
  yank.write(YANK_REST);
  delay(MOVE_MS);

  head.attach(HEAD_PIN);
  head.write(HEAD_REST);
  delay(MOVE_MS);
  hasHead = true;
  head.detach();
  yank.detach();

  Serial.println("Tape tongue ready. Short press = strike.");
}

void loop() {
  handleButton();
  delay(20);
}

void handleButton() {
  bool down = digitalRead(BUTTON_PIN) == LOW;

  if (down && !buttonWasDown) {
    buttonDownMs = millis();
    longPressHandled = false;
  }

  if (down && !longPressHandled && (millis() - buttonDownMs >= LONG_PRESS_MS)) {
    Serial.println("Peek.");
    peek();
    longPressHandled = true;
  }

  if (!down && buttonWasDown && !longPressHandled) {
    Serial.println("Strike.");
    strike();
  }

  buttonWasDown = down;
}

void peek() {
  digitalWrite(LED_PIN, HIGH);
  look(HEAD_LOOK);
  delay(500);
  look(HEAD_REST);
  digitalWrite(LED_PIN, LOW);
}

void strike() {
  digitalWrite(LED_PIN, HIGH);
  look(HEAD_LOOK);
  delay(180);

  yank.attach(YANK_PIN);
  yank.write(YANK_FIRE);
  delay(MOVE_MS + HOLD_FIRE_MS);
  yank.write(YANK_REST);
  delay(MOVE_MS + REWIND_WAIT_MS);
  yank.detach();

  look(HEAD_REST);
  digitalWrite(LED_PIN, LOW);
}

void look(int angle) {
  if (!hasHead) return;
  head.attach(HEAD_PIN);
  head.write(angle);
  delay(MOVE_MS);
  head.detach();
}
