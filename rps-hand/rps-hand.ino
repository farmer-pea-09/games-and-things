/*
  RPS hand — "Rocky" homework edition

  BOARD: Arduino Nano (same as the feeder)

  Mark Rober's Rocky wins because it LOOKS at your fingers
  (IR, ~100 times a second, on a mini-computer) THEN throws
  the shape that beats you, mid-swing. A Nano cannot do that
  camera/computer trick. This one cheats the same WAY, slower:
  3 IR "eyes" on the table watch your throw, then 3 finger
  servos slam the winning pose.

  Short press = one round (LED blinks 3 times, then shoot).
  Hold 2 seconds = cycle mode:
    0 FAIR   = random throw (honest)
    1 WIN    = cheat. Reads your hand, plays the counter.
    2 LOSE   = anti-cheat. Reads you, plays the loser.

  3 FINGER SERVOS
  ---------------
  Thumb pack     D9    thumb + side of the palm
  Scissors pack  D5    index + middle (the two "V" fingers)
  Pinky pack     D6    ring + pinky

    ROCK     all closed
    PAPER    all open
    SCISSORS scissors pack OPEN, the other two CLOSED

  Glue three cardboard fingers (popsicle sticks + tape joints)
  to the horns. Rest the "wrist" on a snack box with googly
  eyes. That IS Rocky's costume.

  3 IR EYES (cheat sensors)
  -------------------------
  Cheap IR obstacle modules (the ones with a little pot and
  an onboard LED). They look UP from the table at where YOUR
  hand lands.

    LEFT  D7     MID  D8     RIGHT  D4
    (module OUT goes HIGH when it sees a hand. If yours goes
     LOW instead, flip SEEN_IS_HIGH to false.)

  How it guesses your throw:
    only MID           → you played ROCK   (a fist)
    LEFT+MID+RIGHT     → you played PAPER  (flat hand)
    two sensors, not 3 → you played SCISSORS (two fingers)
    nothing            → it shrugs and plays random

  This is sloppy compared to Rocky. Sit your throw 5–10 cm
  above the three eyes, same spot every time. Tune the pots
  on the modules until a fist lights only the middle LED.

  MOUNT
  -----
  1. Snack box = wrist / body. Nano + battery inside.
     Googly eyes on the front.
  2. Three SG90s in a row on the open end, horns toward you.
  3. Cardboard palm glued across the three servo bodies so
     they look like one hand.
  4. Three IR modules on a strip of cardboard, 4 cm apart,
     on the TABLE between you and the hand, aiming UP.
  5. You bounce your fist in time with the 3 blinks, then
     throw over the strip.

        YOU  (throw here)
         [ L ][ M ][ R ]   IR eyes looking up
              |
         [  robot hand  ]
         [  snack box   ]
         [  Nano+bank   ]

  WIRING
  ------
  Thumb servo      orange → D9
  Scissors servo   orange → D5
  Pinky servo      orange → D6
  All browns → GND
  All reds   → 5V pack  (NOT Nano 5V)
  Share GND.

  IR LEFT   OUT → D7   VCC → 5V   GND → GND
  IR MID    OUT → D8
  IR RIGHT  OUT → D4

  Button    D2 → button → GND
  LED       D13  (countdown + mode flash)

  HOW TO USE
  ----------
  1. No sensors yet. Short press. Hand should hit a random
     pose after 3 blinks.
  2. Hold button: 1 blink = FAIR, 2 = WIN, 3 = LOSE.
  3. Wire the IR strip. Mode WIN. Throw paper (flat). It
     should play scissors. Fist → it plays paper. V → rock.
  4. Tweak CLOSED_*/OPEN_* so fingers really curl.
     If a servo is backwards, swap that pair.
*/

#include <Servo.h>

const int BUTTON_PIN = 2;
const int IR_RIGHT   = 4;
const int FING_SCI   = 5;
const int FING_PINK  = 6;
const int IR_LEFT    = 7;
const int IR_MID     = 8;
const int FING_THUMB = 9;
const int LED_PIN    = 13;

const bool SEEN_IS_HIGH = true;

// Tweak per servo. Closed = rock fist. Open = paper.
const int THUMB_CLOSED = 20;
const int THUMB_OPEN   = 140;
const int SCI_CLOSED   = 20;
const int SCI_OPEN     = 140;
const int PINK_CLOSED  = 160;  // often mirrored
const int PINK_OPEN    = 40;

const int POSE_MS = 280;
const unsigned long LONG_PRESS_MS = 2000;

enum Shape { ROCK, PAPER, SCISSORS, UNKNOWN };
enum Mode  { FAIR, WIN, LOSE };

Servo thumb;
Servo sci;
Servo pinky;

unsigned long buttonDownMs = 0;
bool buttonWasDown     = false;
bool longPressHandled  = false;
int  mode              = FAIR;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(IR_LEFT, INPUT);
  pinMode(IR_MID, INPUT);
  pinMode(IR_RIGHT, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  delay(200);

  pose(ROCK);
  Serial.println("RPS hand ready. Short press = play. Hold = mode.");
  printMode();
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
    mode = (mode + 1) % 3;
    longPressHandled = true;
    printMode();
    flash(mode + 1);
  }

  if (!down && buttonWasDown && !longPressHandled) {
    playRound();
  }

  buttonWasDown = down;
}

void playRound() {
  Serial.println("1... 2... 3...");
  countdown();

  Shape you = UNKNOWN;
  Shape me  = ROCK;

  if (mode == FAIR) {
    me = (Shape)random(0, 3);
  } else {
    you = readYou();
    Serial.print("I saw ");
    Serial.println(nameOf(you));
    if (you == UNKNOWN) {
      me = (Shape)random(0, 3);
    } else if (mode == WIN) {
      me = beats(you);
    } else {
      me = losesTo(you);
    }
  }

  pose(me);
  Serial.print("I play ");
  Serial.println(nameOf(me));
}

void countdown() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(220);
    digitalWrite(LED_PIN, LOW);
    delay(220);
  }
}

bool seen(int pin) {
  int v = digitalRead(pin);
  return SEEN_IS_HIGH ? (v == HIGH) : (v == LOW);
}

Shape readYou() {
  // Sample a few times while you are still over the strip.
  int l = 0, m = 0, r = 0;
  for (int i = 0; i < 8; i++) {
    if (seen(IR_LEFT))  l++;
    if (seen(IR_MID))   m++;
    if (seen(IR_RIGHT)) r++;
    delay(12);
  }
  bool L = l >= 3;
  bool M = m >= 3;
  bool R = r >= 3;
  int n = (L ? 1 : 0) + (M ? 1 : 0) + (R ? 1 : 0);

  if (n == 0) return UNKNOWN;
  if (L && M && R) return PAPER;
  if (n == 1 && M) return ROCK;
  if (n == 1) return ROCK;
  return SCISSORS;
}

Shape beats(Shape you) {
  if (you == ROCK)     return PAPER;
  if (you == PAPER)    return SCISSORS;
  return ROCK;
}

Shape losesTo(Shape you) {
  if (you == ROCK)     return SCISSORS;
  if (you == PAPER)    return ROCK;
  return PAPER;
}

void pose(Shape s) {
  thumb.attach(FING_THUMB);
  sci.attach(FING_SCI);
  pinky.attach(FING_PINK);

  if (s == ROCK) {
    thumb.write(THUMB_CLOSED);
    sci.write(SCI_CLOSED);
    pinky.write(PINK_CLOSED);
  } else if (s == PAPER) {
    thumb.write(THUMB_OPEN);
    sci.write(SCI_OPEN);
    pinky.write(PINK_OPEN);
  } else {
    thumb.write(THUMB_CLOSED);
    sci.write(SCI_OPEN);
    pinky.write(PINK_CLOSED);
  }

  delay(POSE_MS);
  thumb.detach();
  sci.detach();
  pinky.detach();
}

void flash(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(90);
    digitalWrite(LED_PIN, LOW);
    delay(90);
  }
}

void printMode() {
  if (mode == FAIR) Serial.println("Mode FAIR (random).");
  if (mode == WIN)  Serial.println("Mode WIN (cheat, Rober-style).");
  if (mode == LOSE) Serial.println("Mode LOSE (you win).");
}

const char* nameOf(Shape s) {
  if (s == ROCK)     return "ROCK";
  if (s == PAPER)    return "PAPER";
  if (s == SCISSORS) return "SCISSORS";
  return "???";
}
